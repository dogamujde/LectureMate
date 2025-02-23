const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

const app = express();
const port = process.env.PORT || 3000;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvcdiMNJ6K8J47JZ3WE4PNH99sOS2HTa8",
  authDomain: "lecturemate-ad674.firebaseapp.com",
  projectId: "lecturemate-ad674",
  storageBucket: "lecturemate-ad674.firebasestorage.app",
  messagingSenderId: "372498362553",
  appId: "1:372498362553:web:0f75a6865f72f1debc6b68"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Enable CORS for the frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges', 'Content-Disposition'],
  credentials: true,
  maxAge: 3600
}));

app.use(express.json({ limit: '50mb' })); // Increase payload limit for large LaTeX documents

// Create base directories
const TRANSCRIPTIONS_DIR = path.join(__dirname, '..', 'transcriptions');
const TEMP_DIR = path.join(os.tmpdir(), 'lecturemate');

// Define course directory mapping
const COURSE_MAPPING = {
  'Object Oriented Programming': 'Object Oriented Programming',
  'Calculus and its Applications': 'Calculus and Its Applications',
  'Cognitive Science': 'Cognitive Science',
  'Introduction to Computation': 'Introduction to Computation',
  'Introduction to Linear Algebra': 'Introduction to Linear Algebra'
};

const COURSE_DIRS = Object.keys(COURSE_MAPPING);

// Ensure all required directories exist
async function ensureDirectories() {
  try {
    // Create transcriptions directory
    await fs.mkdir(TRANSCRIPTIONS_DIR, { recursive: true });
    
    // Create course directories and their subdirectories
    for (const courseDir of COURSE_DIRS) {
      const normalizedDir = COURSE_MAPPING[courseDir];
      const targetDir = path.join(TRANSCRIPTIONS_DIR, normalizedDir, 'summaries', 'pdf');
      try {
        await fs.mkdir(targetDir, { recursive: true });
        console.log(`Verified/created directory: ${targetDir}`);
      } catch (error) {
        console.error(`Error creating directory ${targetDir}:`, error);
      }
    }
    console.log('All required directories verified/created successfully');
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Serve static files from the transcriptions directory
app.use('/transcriptions', express.static(TRANSCRIPTIONS_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Range',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
        'Access-Control-Max-Age': '3600'
      });
    }
  }
}));

// Add preflight handler for all routes
app.options('*', cors());

// Handle PDF file requests
app.get('/transcriptions/:course/summaries/pdf/:filename', async (req, res) => {
  try {
    const { course, filename } = req.params;
    const decodedCourse = decodeURIComponent(course);
    const decodedFilename = decodeURIComponent(filename);
    const userAgent = req.headers['user-agent'] || '';
    const isMobileSafari = /iPhone.*Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    console.log('Received request for:', decodedFilename);
    console.log('User Agent:', userAgent);
    console.log('Is Mobile Safari:', isMobileSafari);
    
    // First try to serve from local filesystem
    const localFilePath = path.join(TRANSCRIPTIONS_DIR, decodedCourse, 'summaries', 'pdf', decodedFilename);
    try {
      const fileExists = await fs.access(localFilePath).then(() => true).catch(() => false);
      if (fileExists) {
        console.log('File exists:', localFilePath);
        
        // Set headers based on the client
        const headers = {
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Range, X-Requested-With',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Disposition',
          'Access-Control-Max-Age': '3600',
          'Cache-Control': 'no-cache'
        };

        if (isMobileSafari) {
          headers['Content-Disposition'] = 'inline';
        } else {
          headers['Content-Disposition'] = `attachment; filename="${decodedFilename}"`;
        }

        res.set(headers);
        return res.sendFile(localFilePath);
      }
    } catch (error) {
      console.log('Error checking local file:', error);
    }
    
    // If local file not found, try Firebase Storage
    const filePath = `transcriptions/${decodedCourse}/summaries/pdf/${decodedFilename}`;
    console.log('Attempting to fetch file from Firebase Storage:', filePath);
    
    try {
      const fileRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(fileRef);
      
      if (isMobileSafari) {
        // For Mobile Safari, proxy the request through our server
        const response = await fetch(downloadURL);
        const pdfBuffer = await response.arrayBuffer();
        
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Range, X-Requested-With',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, Content-Disposition',
          'Access-Control-Max-Age': '3600',
          'Cache-Control': 'no-cache'
        });
        
        return res.send(Buffer.from(pdfBuffer));
      } else {
        // For other browsers, redirect to the download URL
        res.set({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Range, X-Requested-With',
          'Access-Control-Max-Age': '3600'
        });
        
        res.redirect(downloadURL);
      }
    } catch (error) {
      console.log('File not found in Firebase Storage:', filePath);
      console.error('Firebase Storage error:', error);
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Internal server error');
  }
});

// Add a fallback route for file not found
app.use('/transcriptions/*', (req, res) => {
  console.log('File not found:', req.path);
  res.status(404).send('File not found');
});

// Root route handler
app.get('/', (req, res) => {
  res.send('PDF Generation Server is running. Use POST /generate-pdf to generate PDFs.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Ensure temp directory exists
async function ensureTmpDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`Temporary directory created at ${TEMP_DIR}`);
  } catch (error) {
    console.error('Error creating temp directory:', error);
    throw error;
  }
}

// Check if pdflatex is installed
function checkLatex() {
  return new Promise((resolve, reject) => {
    exec('pdflatex --version', (error) => {
      if (error) {
        console.error('pdflatex is not installed. Please install LaTeX first.');
        reject(new Error('LaTeX is not installed'));
        return;
      }
      console.log('LaTeX installation found');
      resolve();
    });
  });
}

// Initialize server
async function init() {
  try {
    await ensureTmpDir();
    await checkLatex();
    await ensureDirectories();
    
    app.listen(port, () => {
      console.log(`PDF generation server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

app.post('/generate-pdf', async (req, res) => {
  console.log('Received PDF generation request');
  console.log('Course Name:', req.body.courseName);
  console.log('File Name:', req.body.fileName);
  
  const { latex, courseName, fileName } = req.body;
  if (!latex || !courseName || !fileName) {
    console.error('Missing required parameters');
    return res.status(400).send('Missing required parameters: latex, courseName, fileName');
  }

  const timestamp = Date.now();
  const baseFilename = `document_${timestamp}`;
  const texFile = path.join(TEMP_DIR, `${baseFilename}.tex`);
  const pdfFile = path.join(TEMP_DIR, `${baseFilename}.pdf`);

  try {
    // Add required LaTeX packages to the content
    const enhancedLatex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{natbib}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{xcolor}

\\begin{document}

${latex}

\\end{document}`;

    // Write LaTeX content to file
    await fs.writeFile(texFile, enhancedLatex, 'utf8');
    console.log(`LaTeX file written to ${texFile}`);
    console.log('LaTeX content preview:', enhancedLatex.substring(0, 200) + '...');

    // Run pdflatex twice to resolve references
    const runPdfLatex = () => new Promise((resolve, reject) => {
      const process = exec(
        `cd ${TEMP_DIR} && pdflatex -interaction=nonstopmode ${baseFilename}.tex`,
        { maxBuffer: 1024 * 1024 * 10 }, // Increase buffer size to 10MB
        (error, stdout, stderr) => {
          if (error) {
            console.error('pdflatex error:', error);
            console.error('pdflatex stderr:', stderr);
            reject(new Error(`LaTeX compilation failed: ${stderr || stdout}`));
            return;
          }
          resolve(stdout);
        }
      );
      
      // Log pdflatex output
      process.stdout.on('data', (data) => {
        console.log(`pdflatex output: ${data}`);
      });
      
      process.stderr.on('data', (data) => {
        console.error(`pdflatex error: ${data}`);
      });
    });

    console.log('Running first pdflatex pass...');
    await runPdfLatex();
    console.log('Running second pdflatex pass...');
    await runPdfLatex();

    // Check if PDF was actually generated
    try {
      await fs.access(pdfFile);
      console.log('PDF file exists at:', pdfFile);
      
      // Get file size
      const stats = await fs.stat(pdfFile);
      console.log('PDF file size:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        throw new Error('Generated PDF file is empty');
      }
    } catch (error) {
      console.error('PDF file not found or empty at:', pdfFile);
      throw new Error('PDF file was not generated properly');
    }

    // Read the generated PDF
    console.log('Reading generated PDF...');
    const pdfContent = await fs.readFile(pdfFile);
    console.log('PDF size:', pdfContent.length, 'bytes');

    // Save to course directory
    const courseDir = courseName.toLowerCase() === 'object oriented programming' ? 'oop' :
                     courseName.toLowerCase() === 'calculus and its applications' ? 'calculus' :
                     'cognitive-science';
    
    const targetDir = path.join(__dirname, '..', 'transcriptions', courseDir, 'summaries', 'pdf');
    
    // Ensure the target directory exists
    try {
      await fs.mkdir(targetDir, { recursive: true });
      console.log('Created/verified target directory:', targetDir);
    } catch (error) {
      console.error('Error creating target directory:', error);
      throw new Error('Failed to create target directory');
    }
    
    const targetFile = path.join(targetDir, fileName);
    
    try {
      await fs.writeFile(targetFile, pdfContent);
      console.log(`PDF saved to ${targetFile}`);
      
      // Verify the file was written correctly
      const writtenStats = await fs.stat(targetFile);
      if (writtenStats.size === 0) {
        throw new Error('Written PDF file is empty');
      }
      console.log('Written PDF file size:', writtenStats.size, 'bytes');
    } catch (error) {
      console.error('Error writing PDF to target location:', error);
      throw new Error('Failed to save PDF to target location');
    }

    // Clean up temporary files
    const cleanupFiles = [
      `${baseFilename}.tex`,
      `${baseFilename}.pdf`,
      `${baseFilename}.aux`,
      `${baseFilename}.log`,
      `${baseFilename}.out`,
      `${baseFilename}.toc`
    ].map(file => path.join(TEMP_DIR, file));

    await Promise.all(cleanupFiles.map(file => fs.unlink(file).catch(() => {})));
    console.log('Cleanup completed');

    // Send PDF
    console.log('Sending PDF response...');
    res.contentType('application/pdf');
    res.send(pdfContent);
  } catch (error) {
    console.error('Error in PDF generation:', error);
    
    // Try to read the log file if it exists
    try {
      const logFile = path.join(TEMP_DIR, `${baseFilename}.log`);
      const logContent = await fs.readFile(logFile, 'utf8');
      console.error('LaTeX log file contents:', logContent);
    } catch (logError) {
      console.error('Could not read log file:', logError);
    }
    
    res.status(500).send(`Error generating PDF: ${error.message}`);
    
    // Attempt to clean up on error
    try {
      const cleanupFiles = [
        `${baseFilename}.tex`,
        `${baseFilename}.pdf`,
        `${baseFilename}.aux`,
        `${baseFilename}.log`,
        `${baseFilename}.out`,
        `${baseFilename}.toc`
      ].map(file => path.join(TEMP_DIR, file));
      
      await Promise.all(cleanupFiles.map(file => fs.unlink(file).catch(() => {})));
      console.log('Error cleanup completed');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
});

// Add new proxy endpoint for mobile Safari
app.get('/proxy-pdf/:course/:filename', async (req, res) => {
  try {
    const { course, filename } = req.params;
    const decodedCourse = decodeURIComponent(course);
    const decodedFilename = decodeURIComponent(filename);
    
    console.log('Proxying PDF request for:', { course: decodedCourse, filename: decodedFilename });
    
    // Try Firebase Storage
    const storagePath = `transcriptions/${decodedCourse}/summaries/pdf/${decodedFilename}`;
    console.log('Fetching from Firebase Storage:', storagePath);
    
    try {
      const fileRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(fileRef);
      console.log('Got download URL:', downloadURL);
      
      // Make request to Firebase Storage with proper headers
      const response = await fetch(downloadURL, {
        headers: {
          'Accept': 'application/pdf',
          'Range': 'bytes=0-'
        }
      });
      
      if (!response.ok) {
        console.error('Firebase response error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers)
        });
        throw new Error(`Firebase fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      const pdfBuffer = await response.arrayBuffer();
      
      if (!pdfBuffer || pdfBuffer.byteLength === 0) {
        throw new Error('Received empty PDF buffer');
      }
      
      console.log('Successfully fetched PDF, size:', pdfBuffer.byteLength);
      
      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': pdfBuffer.byteLength,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
        'Cache-Control': 'no-cache'
      });
      
      // Send the PDF
      return res.send(Buffer.from(pdfBuffer));
      
    } catch (firebaseError) {
      console.error('Firebase fetch failed:', firebaseError);
      throw new Error(`Failed to fetch PDF: ${firebaseError.message}`);
    }
  } catch (error) {
    console.error('Error proxying PDF:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF',
      details: error.message
    });
  }
});

// Start the server
init(); 