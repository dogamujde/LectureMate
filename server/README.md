# LectureMate Backend Server

This server handles LaTeX to PDF conversion for LectureMate.

## Prerequisites

1. Node.js (v14 or higher)
2. LaTeX distribution (one of the following):

   ### macOS
   Install BasicTeX using Homebrew (recommended):
   ```bash
   brew install basictex
   ```

   After installation, you need to:
   1. Add TeX to your PATH manually:
   ```bash
   echo 'export PATH="/Library/TeX/texbin:$PATH"' >> ~/.zshrc
   ```

   2. Reload your shell configuration:
   ```bash
   source ~/.zshrc
   ```

   3. Install required LaTeX packages:
   ```bash
   sudo tlmgr update --self
   sudo tlmgr install latexmk
   sudo tlmgr install collection-fontsrecommended
   sudo tlmgr install collection-latexrecommended
   ```

   4. Verify installation:
   ```bash
   pdflatex --version
   ```

   Alternative: If you need a full LaTeX distribution, you can install MacTeX:
   ```bash
   brew install --cask mactex
   ```
   Note: MacTeX is a much larger download (several GB) but includes all packages.

   ### Ubuntu/Debian
   Install full TeXLive distribution:
   ```bash
   sudo apt-get update
   sudo apt-get install texlive-full
   ```

   Verify installation:
   ```bash
   pdflatex --version
   ```

   ### Windows
   1. Download and install [MiKTeX](https://miktex.org/download)
   2. During installation:
      - Choose "Install missing packages on the fly = Yes"
   3. After installation, open Command Prompt and verify:
      ```cmd
      pdflatex --version
      ```

## Setup

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will run on http://localhost:3000.

## Development

For development with auto-reload:
```bash
npm run dev
```

## Troubleshooting

### LaTeX Not Found
If you see "pdflatex is not installed or not in PATH":

1. First, check if LaTeX is installed:
   ```bash
   ls /usr/local/texlive/2023/bin/universal-darwin/pdflatex
   ```

2. If the file exists but command is not found, add this line to ~/.zshrc:
   ```bash
   export PATH="/usr/local/texlive/2023/bin/universal-darwin:$PATH"
   ```

   Then reload your configuration:
   ```bash
   source ~/.zshrc
   ```

3. If LaTeX is not installed, install it:
   ```bash
   brew install --cask mactex-no-gui
   ```

4. Verify installation:
   ```bash
   pdflatex --version
   ```

### Connection Refused
If you see "connection refused" errors:

1. Verify the server is running:
   ```bash
   npm start
   ```

2. Check if port 3000 is available:
   For macOS/Linux:
   ```bash
   lsof -i :3000
   ```

   For Windows:
   ```cmd
   netstat -ano | findstr :3000
   ```

## API Endpoints

### POST /generate-pdf
Converts LaTeX content to PDF.

Request body:
```json
{
  "latex": "Your LaTeX content here"
}
```

Response: PDF file 