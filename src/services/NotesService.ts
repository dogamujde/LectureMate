import { type Note } from '../types';

export class NotesService {
  private static API_URL = 'https://api.openai.com/v1/chat/completions';

  static async generateNotes(transcript: string): Promise<Note> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.config.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-2024-07-18",
          messages: [
            {
              role: "system",
              content: `You are a thorough and meticulous student taking detailed lecture notes. Create extremely comprehensive notes that:

1. IMPLEMENTATION & SYNTAX:
   - Document exact syntax and method signatures
   - Include complete code examples for each concept
   - Note any specific implementation requirements or constraints
   - Highlight constructor patterns and common methods

2. PRACTICAL DETAILS:
   - Record all advantages and disadvantages mentioned
   - Note performance characteristics and complexity
   - Document memory usage considerations
   - List common use cases and scenarios

3. EXAMPLES & APPLICATIONS:
   - Provide detailed code examples for each concept
   - Include real-world application scenarios
   - Show different variations of usage
   - Document edge cases and special situations

4. BEST PRACTICES & WARNINGS:
   - Note all tips and tricks mentioned
   - Document common pitfalls and how to avoid them
   - Include best practices for each concept
   - Highlight any warnings or cautions

5. COMPARISONS & ALTERNATIVES:
   - Compare with similar data structures or approaches
   - Note when to use one approach over another
   - Document trade-offs between different approaches

Format using clear sections with descriptive headers. Use code blocks for all examples. Include every technical detail mentioned by the lecturer. Make the notes as detailed as possible, assuming no prior knowledge.`
            },
            {
              role: "user",
              content: `Create extremely detailed lecture notes from this transcript. Include complete code examples, implementation details, and practical applications. Don't summarize - capture every technical detail mentioned:\n\n${transcript}`
            }
          ],
          max_tokens: 16384,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate notes');
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating notes:', error);
      throw error;
    }
  }

  static formatSummary(content: string): string {
    const lines = content.split('\n');
    let formatted = '';
    let inList = false;
    let inCode = false;

    lines.forEach(line => {
      // Remove markdown headers (##)
      line = line.replace(/^#+\s*/, '');
      
      // Convert markdown lists to proper bullet points
      line = line.replace(/^\s*-\s*/, '• ');
      line = line.replace(/^\s*\*\s*/, '• ');
      
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        inCode = !inCode;
        if (inCode) {
          formatted += '\nCODE EXAMPLE:\n' + '='.repeat(12) + '\n';
        } else {
          formatted += '='.repeat(12) + '\n\n';
        }
        return;
      }

      if (inCode) {
        formatted += line + '\n';
        return;
      }
      
      // Add proper spacing between sections
      if (line.trim().length > 0) {
        if (line.match(/^[A-Z]/)) {  // If line starts with capital letter (likely a header)
          formatted += '\n' + line.toUpperCase() + '\n' + '='.repeat(line.length) + '\n\n';
        } else if (line.startsWith('• ')) {
          inList = true;
          formatted += line + '\n';
        } else {
          if (inList) {
            formatted += '\n';
            inList = false;
          }
          formatted += line + '\n';
        }
      }
    });

    return formatted;
  }

  static async generatePDF(content: string): Promise<Blob> {
    const formattedContent = this.formatSummary(content);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lecture Notes</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
          @media print {
            @page {
              margin: 1in;
              size: A4;
            }
          }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #1a202c;
            font-size: 11pt;
          }
          .header {
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 18pt;
            margin: 0;
            font-weight: 600;
            color: #1a202c;
          }
          .header .date {
            font-size: 11pt;
            color: #4a5568;
            margin-top: 8px;
          }
          pre {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
          }
          code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lecture Notes</h1>
          <div class="date">${new Date().toLocaleDateString()}</div>
        </div>
        <div class="content">
          ${formattedContent.replace(/\n/g, '<br>')}
        </div>
      </body>
      </html>
    `;

    // For now, return as HTML blob
    // In production, you'd want to use a proper PDF generation library
    return new Blob([htmlContent], { type: 'text/html' });
  }
} 