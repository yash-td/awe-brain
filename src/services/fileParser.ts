import { FileAttachment } from '../types';
// @ts-ignore - pdf-parse doesn't have types
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';
import Papa from 'papaparse';

// Configure PDF.js worker - use jsDelivr CDN which is more reliable
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ParsedFileContent {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    fileType: string;
    fileName: string;
  };
}

class FileParserService {
  async parseFile(file: File): Promise<ParsedFileContent> {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
    try {
      switch (true) {
        case fileType === 'application/pdf':
          return await this.parsePDF(file);

        case fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDocx(file);

        case fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          return await this.parsePptx(file);

        case fileType === 'text/csv' || file.name.toLowerCase().endsWith('.csv'):
          return await this.parseCSV(file);

        case fileType.startsWith('image/'):
          return await this.parseImage(file);

        case fileType.startsWith('text/') || this.isTextFile(file.name):
          return await this.parseTextFile(file);

        default:
          return await this.parseAsText(file);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        text: `[Unable to parse file: ${file.name}]`,
        metadata: {
          wordCount: 0,
          fileType,
          fileName: file.name
        }
      };
    }
  }

  private async parsePDF(file: File): Promise<ParsedFileContent> {
    try {
      // First read: Get page count
      const arrayBuffer1 = await file.arrayBuffer();
      const uint8Array1 = new Uint8Array(arrayBuffer1);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array1 });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      // Second read: Extract text (to avoid detached ArrayBuffer issue in production)
      const arrayBuffer2 = await file.arrayBuffer();
      const text = await this.extractTextFromPDF(arrayBuffer2);

      return {
        text: text || '[PDF content could not be extracted]',
        metadata: {
          pages: pageCount,
          wordCount: this.countWords(text),
          fileType: 'PDF Document',
          fileName: file.name
        }
      };
    } catch (error) {
      console.error('Error in parsePDF:', error);
      // Third read: Fallback text extraction
      const arrayBuffer3 = await file.arrayBuffer();
      const text = await this.extractTextFromPDF(arrayBuffer3);
      return {
        text: text || '[PDF content could not be extracted]',
        metadata: {
          wordCount: this.countWords(text),
          fileType: 'PDF Document',
          fileName: file.name
        }
      };
    }
  }

  private async parseDocx(file: File): Promise<ParsedFileContent> {
    // For DOCX files, we'll extract the text content
    const arrayBuffer = await file.arrayBuffer();
    const text = await this.extractTextFromDocx(arrayBuffer);
    
    return {
      text: text || '[DOCX content could not be extracted]',
      metadata: {
        wordCount: this.countWords(text),
        fileType: 'Word Document',
        fileName: file.name
      }
    };
  }

  private async parsePptx(file: File): Promise<ParsedFileContent> {
    // For PPTX files, we'll extract slide content
    const arrayBuffer = await file.arrayBuffer();
    const text = await this.extractTextFromPptx(arrayBuffer);
    
    return {
      text: text || '[PowerPoint content could not be extracted]',
      metadata: {
        wordCount: this.countWords(text),
        fileType: 'PowerPoint Presentation',
        fileName: file.name
      }
    };
  }

  private async parseImage(file: File): Promise<ParsedFileContent> {
    // For images, we'll provide metadata and prepare for vision model
    const base64 = await this.fileToBase64(file);

    return {
      text: `[Image file: ${file.name}]\nThis is an image file that can be analyzed by the AI vision model. The image is ${Math.round(file.size / 1024)}KB in size.`,
      metadata: {
        wordCount: 0,
        fileType: 'Image',
        fileName: file.name
      }
    };
  }

  private async parseCSV(file: File): Promise<ParsedFileContent> {
    console.log('📊 Parsing CSV file...');
    const text = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as any[];
            const headers = results.meta.fields || [];

            if (data.length === 0) {
              resolve({
                text: '[CSV file is empty]',
                metadata: {
                  wordCount: 0,
                  fileType: 'CSV Spreadsheet',
                  fileName: file.name
                }
              });
              return;
            }

            // For large CSV files, chunk the data
            const MAX_ROWS_PER_CHUNK = 100;
            const totalRows = data.length;
            const chunks: string[] = [];

            // Add summary at the beginning
            chunks.push(`# CSV File: ${file.name}\n`);
            chunks.push(`**Total Rows:** ${totalRows} | **Columns:** ${headers.length}\n`);
            chunks.push(`**Column Names:** ${headers.join(', ')}\n\n`);

            // Process data in chunks
            for (let i = 0; i < totalRows; i += MAX_ROWS_PER_CHUNK) {
              const chunkData = data.slice(i, Math.min(i + MAX_ROWS_PER_CHUNK, totalRows));
              const chunkEnd = Math.min(i + MAX_ROWS_PER_CHUNK, totalRows);

              if (totalRows > MAX_ROWS_PER_CHUNK) {
                chunks.push(`## Rows ${i + 1} - ${chunkEnd}\n`);
              }

              // Create markdown table
              chunks.push(this.createMarkdownTable(headers, chunkData));
              chunks.push('\n');
            }

            const markdownText = chunks.join('');
            const sanitized = this.sanitizeText(markdownText);

            console.log(`✅ Parsed CSV with ${totalRows} rows and ${headers.length} columns`);

            resolve({
              text: sanitized,
              metadata: {
                wordCount: this.countWords(sanitized),
                fileType: 'CSV Spreadsheet',
                fileName: file.name,
                pages: Math.ceil(totalRows / MAX_ROWS_PER_CHUNK)
              }
            });
          } catch (error) {
            console.error('❌ Error processing CSV:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('❌ Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }

  private createMarkdownTable(headers: string[], rows: any[]): string {
    if (headers.length === 0 || rows.length === 0) return '';

    const lines: string[] = [];

    // Header row
    lines.push('| ' + headers.join(' | ') + ' |');

    // Separator row
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');

    // Data rows
    rows.forEach(row => {
      const cells = headers.map(header => {
        const value = row[header];
        // Escape pipe characters and handle undefined/null
        const cellValue = value !== undefined && value !== null ? String(value).replace(/\|/g, '\\|') : '';
        return cellValue;
      });
      lines.push('| ' + cells.join(' | ') + ' |');
    });

    return lines.join('\n');
  }

  private async parseTextFile(file: File): Promise<ParsedFileContent> {
    const text = await file.text();
    const sanitized = this.sanitizeText(text);

    return {
      text: sanitized,
      metadata: {
        wordCount: this.countWords(sanitized),
        fileType: 'Text File',
        fileName: file.name
      }
    };
  }

  private async parseAsText(file: File): Promise<ParsedFileContent> {
    try {
      const text = await file.text();
      const sanitized = this.sanitizeText(text);
      return {
        text: sanitized,
        metadata: {
          wordCount: this.countWords(sanitized),
          fileType: 'Text Content',
          fileName: file.name
        }
      };
    } catch {
      return {
        text: `[Binary file: ${file.name} - ${Math.round(file.size / 1024)}KB]`,
        metadata: {
          wordCount: 0,
          fileType: 'Binary File',
          fileName: file.name
        }
      };
    }
  }

  private async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      console.log('📄 Parsing PDF file...');
      const uint8Array = new Uint8Array(arrayBuffer);

      // Load PDF document using PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;

      console.log(`✅ PDF loaded with ${pdf.numPages} pages`);

      const textParts: string[] = [];

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }

      const extractedText = textParts.join('\n\n');
      const sanitized = this.sanitizeText(extractedText);
      console.log(`✅ Extracted ${this.countWords(sanitized)} words from PDF`);

      return sanitized || '[PDF appears to be empty or contains only images]';
    } catch (error) {
      console.error('❌ Error parsing PDF:', error);
      return '[PDF content could not be extracted]';
    }
  }

  private async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      console.log('📝 Parsing DOCX file...');

      // Use mammoth to extract text from DOCX
      const result = await mammoth.extractRawText({ arrayBuffer });

      const sanitized = this.sanitizeText(result.value);
      console.log(`✅ Extracted ${this.countWords(sanitized)} words from DOCX`);

      if (result.messages.length > 0) {
        console.warn('⚠️ DOCX parsing warnings:', result.messages);
      }

      return sanitized || '[DOCX appears to be empty]';
    } catch (error) {
      console.error('❌ Error parsing DOCX:', error);
      return '[DOCX content could not be extracted]';
    }
  }

  private async extractTextFromPptx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      console.log('📊 Parsing PPTX file...');

      // PPTX is a ZIP file containing XML files
      // We'll extract text from the XML
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);

      // Extract text between XML tags
      const textMatches = text.match(/>([^<]+)</g);

      if (textMatches) {
        const extractedText = textMatches
          .map(match => match.slice(1, -1))
          .filter(text => {
            // Filter out XML metadata and keep only meaningful text
            const trimmed = text.trim();
            return trimmed.length > 0 &&
                   !trimmed.startsWith('<?xml') &&
                   !trimmed.match(/^[\d.]+$/) && // Skip pure numbers
                   trimmed.length > 2; // Skip very short strings
          })
          .join(' ');

        const sanitized = this.sanitizeText(extractedText);
        console.log(`✅ Extracted ${this.countWords(sanitized)} words from PPTX`);
        return sanitized || '[PPTX appears to contain no text]';
      }

      return '[PPTX content could not be extracted]';
    } catch (error) {
      console.error('❌ Error parsing PPTX:', error);
      return '[PPTX content could not be extracted - may contain complex formatting or be password protected]';
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'ppt': 'application/vnd.ms-powerpoint',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'csv': 'text/csv',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private isTextFile(fileName: string): boolean {
    const textExtensions = ['txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h'];
    const extension = fileName.toLowerCase().split('.').pop();
    return textExtensions.includes(extension || '');
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Sanitize text to remove characters that can't be stored in PostgreSQL
  private sanitizeText(text: string): string {
    if (!text) return text;

    return text
      // Remove null bytes (cannot be stored in PostgreSQL text fields)
      .replace(/\u0000/g, '')
      // Remove other control characters except newlines, tabs, and carriage returns
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const fileParserService = new FileParserService();