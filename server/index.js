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
    process.exit(1); // Exit if we can't create the temp directory
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
  
  const { latex } = req.body;
  if (!latex) {
    console.error('No LaTeX content provided');
    return res.status(400).send('No LaTeX content provided');
  }

  const timestamp = Date.now();
  const baseFilename = `document_${timestamp}`;
  const texFile = path.join(TMP_DIR, `${baseFilename}.tex`);
  const pdfFile = path.join(TMP_DIR, `${baseFilename}.pdf`);

  try {
    // Write LaTeX content to file
    await fs.writeFile(texFile, latex);
    console.log(`LaTeX file written to ${texFile}`);

    // Run pdflatex twice to resolve references
    const runPdfLatex = () => new Promise((resolve, reject) => {
      const process = exec(
        `pdflatex -interaction=nonstopmode -output-directory=${TMP_DIR} ${texFile}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error('pdflatex error:', error);
            console.error('pdflatex stderr:', stderr);
            reject(new Error(`LaTeX compilation failed: ${stderr}`));
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
    } catch (error) {
      throw new Error('PDF file was not generated');
    }

    // Read the generated PDF
    console.log('Reading generated PDF...');
    const pdfContent = await fs.readFile(pdfFile);

    // Clean up temporary files
    const cleanupFiles = [
      `${baseFilename}.tex`,
      `${baseFilename}.pdf`,
      `${baseFilename}.aux`,
      `${baseFilename}.log`,
      `${baseFilename}.out`,
      `${baseFilename}.toc`
    ].map(file => path.join(TMP_DIR, file));

    Promise.all(cleanupFiles.map(file => fs.unlink(file).catch(() => {})))
      .then(() => console.log('Cleanup completed'))
      .catch(error => console.error('Cleanup error:', error));

    // Send PDF
    console.log('Sending PDF response...');
    res.contentType('application/pdf');
    res.send(pdfContent);
  } catch (error) {
    console.error('Error in PDF generation:', error);
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
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
});

// Start the server
init(); 