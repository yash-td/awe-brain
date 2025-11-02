import axios from 'axios';
import { fileParserService, ParsedFileContent } from './fileParser';

// Configuration
const PINECONE_API_KEY = import.meta.env.VITE_PINECONE_API_KEY || '';
const PINECONE_INDEX_HOST = import.meta.env.VITE_PINECONE_INDEX_HOST || '';
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '';
const EMBEDDING_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
const API_VERSION = '2024-12-01-preview';

export interface IndexProgress {
  status: 'parsing' | 'chunking' | 'embedding' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
}

class PineconeIndexer {
  // Rate limiting: delay between API calls to avoid 429 errors
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Chunk text into smaller pieces for better search results
  private chunkText(text: string, chunkSize: number = 500): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  // Get embedding from Azure OpenAI with retry logic
  private async getEmbedding(text: string, retries: number = 3): Promise<number[]> {
    // Use 512 dimensions to match AWE Pinecone index
    const dimensions = 512;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.post(
          `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT}/embeddings?api-version=${API_VERSION}`,
          {
            input: text.substring(0, 8000), // Limit text length
            dimensions: dimensions
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': AZURE_OPENAI_KEY
            }
          }
        );

        return response.data.data[0].embedding;
      } catch (error: any) {
        // If rate limited (429), wait longer before retry
        if (error.response?.status === 429 && attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Rate limited (429). Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`);
          await this.delay(waitTime);
          continue;
        }

        console.error('Error getting embedding:', error);
        throw error;
      }
    }

    throw new Error('Failed to get embedding after retries');
  }

  // Upload vectors to Pinecone
  private async uploadVectorsToPinecone(vectors: any[]): Promise<void> {
    try {
      const response = await axios.post(
        `https://${PINECONE_INDEX_HOST}/vectors/upsert`,
        {
          vectors: vectors,
          namespace: '' // Default namespace
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': PINECONE_API_KEY
          }
        }
      );

      console.log(`✅ Uploaded ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      console.error('Error uploading to Pinecone:', error);
      throw error;
    }
  }

  // Main indexing function
  async indexFile(
    file: File,
    category: string,
    onProgress?: (progress: IndexProgress) => void
  ): Promise<void> {
    try {
      // Step 1: Parse the file
      onProgress?.({
        status: 'parsing',
        progress: 10,
        message: `Parsing ${file.name}...`
      });

      console.log(`📄 Starting to index file: ${file.name}`);
      const parsedContent: ParsedFileContent = await fileParserService.parseFile(file);

      if (!parsedContent.text || parsedContent.text.trim().length === 0) {
        throw new Error('File contains no text content to index');
      }

      // Step 2: Chunk the text
      onProgress?.({
        status: 'chunking',
        progress: 30,
        message: 'Breaking document into chunks...'
      });

      const chunks = this.chunkText(parsedContent.text);
      console.log(`✂️ Split document into ${chunks.length} chunks`);

      if (chunks.length === 0) {
        throw new Error('No text chunks created from file');
      }

      // Step 3: Generate embeddings and upload
      const totalChunks = chunks.length;
      const vectors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Update progress
        const progressPercent = 30 + Math.floor((i / totalChunks) * 60);
        onProgress?.({
          status: i < totalChunks - 1 ? 'embedding' : 'uploading',
          progress: progressPercent,
          message: `Processing chunk ${i + 1} of ${totalChunks}...`
        });

        console.log(`🔄 Getting embedding for chunk ${i + 1}/${totalChunks}`);

        // Add delay between requests to avoid rate limiting (1 second delay)
        if (i > 0) {
          await this.delay(1000);
        }

        // Get embedding with retry logic
        const embedding = await this.getEmbedding(chunk);

        // Create vector with metadata
        const vector = {
          id: `${file.name}-chunk-${i}-${Date.now()}`,
          values: embedding,
          metadata: {
            fileName: file.name,
            filePath: file.name,
            fileType: file.type,
            category: category,
            chunkIndex: i,
            totalChunks: totalChunks,
            textPreview: chunk.substring(0, 200), // First 200 chars for preview
            uploadedAt: new Date().toISOString(),
            wordCount: parsedContent.metadata.wordCount,
            pages: parsedContent.metadata.pages
          }
        };

        vectors.push(vector);

        // Upload in smaller batches of 5 to avoid overwhelming Pinecone
        if (vectors.length >= 5 || i === chunks.length - 1) {
          console.log(`📤 Uploading batch of ${vectors.length} vectors to Pinecone`);
          await this.uploadVectorsToPinecone(vectors);
          vectors.length = 0; // Clear the batch

          // Add small delay between batch uploads
          if (i < chunks.length - 1) {
            await this.delay(500);
          }
        }
      }

      // Complete
      onProgress?.({
        status: 'complete',
        progress: 100,
        message: `Successfully indexed ${file.name} (${totalChunks} chunks)`
      });

      console.log(`✅ Successfully indexed ${file.name} with ${totalChunks} chunks`);
    } catch (error) {
      console.error('❌ Error indexing file:', error);

      onProgress?.({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to index file'
      });

      throw error;
    }
  }

  // Get available categories
  getCategories(): string[] {
    return [
      'Candidate CVs',
      'CASA Training',
      'Entertainment',
      'Growth',
      'Health, Safety and Well-being',
      'Innovation',
      'Job Descriptions',
      'Knowledge Library',
      'Lessons Learned',
      'Momentum Friday Meeting Videos',
      'Movar CVs',
      'Movar Manuals and Handbooks',
      'Movar Templates',
      'Organisation Chart',
      'Proposals and Bids',
      'Software',
      'Training',
      'Work Experience'
    ];
  }
}

export const pineconeIndexer = new PineconeIndexer();
