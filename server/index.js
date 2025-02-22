const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for the frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow both Vite ports
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increase payload limit for large LaTeX documents

// Create base directories
const TRANSCRIPTIONS_DIR = path.join(__dirname, '..', 'transcriptions');
const COURSE_DIRS = ['oop', 'calculus', 'cognitive-science'];

// Ensure all required directories exist
async function ensureDirectories() {
  try {
    // Create transcriptions directory
    await fs.mkdir(TRANSCRIPTIONS_DIR, { recursive: true });
    
    // Create course directories and their subdirectories
    for (const courseDir of COURSE_DIRS) {
      await fs.mkdir(path.join(TRANSCRIPTIONS_DIR, courseDir, 'summaries', 'pdf'), { recursive: true });
    }
    console.log('All required directories created successfully');
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Serve static files from the transcriptions directory
app.use('/transcriptions', express.static(TRANSCRIPTIONS_DIR));

// Root route handler
app.get('/', (req, res) => {
  res.send('PDF Generation Server is running. Use POST /generate-pdf to generate PDFs.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Create a temporary directory for LaTeX files
const TMP_DIR = path.join(os.tmpdir(), 'lecturemate');

// Ensure temp directory exists
async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
    console.log(`Temporary directory created at ${TMP_DIR}`);
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
  const texFile = path.join(TMP_DIR, `${baseFilename}.tex`);
  const pdfFile = path.join(TMP_DIR, `${baseFilename}.pdf`);

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
        `cd ${TMP_DIR} && pdflatex -interaction=nonstopmode ${baseFilename}.tex`,
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
    ].map(file => path.join(TMP_DIR, file));

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
      const logFile = path.join(TMP_DIR, `${baseFilename}.log`);
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
      ].map(file => path.join(TMP_DIR, file));
      
      await Promise.all(cleanupFiles.map(file => fs.unlink(file).catch(() => {})));
      console.log('Error cleanup completed');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
});

// Start the server
init(); 