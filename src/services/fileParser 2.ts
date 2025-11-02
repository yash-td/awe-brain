import { FileAttachment } from '../types';
// @ts-ignore - pdf-parse doesn't have types
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    // For now, we'll extract text content from PDF using a simple approach
    // In a production environment, you'd want to use a proper PDF parsing library
    const arrayBuffer = await file.arrayBuffer();
    const text = await this.extractTextFromPDF(arrayBuffer);
    
    return {
      text: text || '[PDF content could not be extracted]',
      metadata: {
        wordCount: this.countWords(text),
        fileType: 'PDF Document',
        fileName: file.name
      }
    };
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

  private async parseTextFile(file: File): Promise<ParsedFileContent> {
    const text = await file.text();
    
    return {
      text,
      metadata: {
        wordCount: this.countWords(text),
        fileType: 'Text File',
        fileName: file.name
      }
    };
  }

  private async parseAsText(file: File): Promise<ParsedFileContent> {
    try {
      const text = await file.text();
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
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
    // Simple PDF text extraction - in production, use pdf-parse or similar
    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder().decode(uint8Array);
      
      // Basic PDF text extraction (very simplified)
      const matches = text.match(/\(([^)]+)\)/g);
      if (matches) {
        return matches.map(match => match.slice(1, -1)).join(' ');
      }
      
      return '[PDF parsing requires server-side processing]';
    } catch {
      return '[PDF content could not be extracted]';
    }
  }

  private async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    // Simplified DOCX extraction - in production, use mammoth.js
    try {
      return '[DOCX parsing requires server-side processing]';
    } catch {
      return '[DOCX content could not be extracted]';
    }
  }

  private async extractTextFromPptx(arrayBuffer: ArrayBuffer): Promise<string> {
    // Simplified PPTX extraction
    try {
      return '[PPTX parsing requires server-side processing]';
    } catch {
      return '[PPTX content could not be extracted]';
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
}

export const fileParserService = new FileParserService();