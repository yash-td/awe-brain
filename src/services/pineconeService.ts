import axios from 'axios';

// Pinecone configuration
const PINECONE_API_KEY = import.meta.env.VITE_PINECONE_API_KEY || 'pcsk_3hvQYt_EGMqHg1ioVSAqBVhnytKgV1ERmFza6JsQ7fGYGuYdREA8SHwdZzppopK1edTAbs';
const PINECONE_INDEX_HOST = import.meta.env.VITE_PINECONE_INDEX_HOST || 'movar-xauq34o.svc.aped-4627-b74a.pinecone.io';
const INDEX_NAME = import.meta.env.VITE_PINECONE_INDEX_NAME || 'movar';

// Azure OpenAI configuration for embeddings
const AZURE_OPENAI_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://ai-movarai650901572824.openai.azure.com';
const AZURE_OPENAI_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '970587548a234c1f9340a97c513cf5fd';
const EMBEDDING_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large';
const API_VERSION = '2024-12-01-preview';

export interface SearchResult {
  id: string;
  score: number;
  fileName: string;
  filePath: string;
  fileType: string;
  textPreview: string;
  category: string;
  chunkIndex: number;
  totalChunks: number;
}

class PineconeService {
  // Get embedding from Azure OpenAI
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      console.log('🔄 Getting embedding from Azure OpenAI...');
      const response = await axios.post(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT}/embeddings?api-version=${API_VERSION}`,
        {
          input: text.substring(0, 8000), // Limit text length
          dimensions: 512 // Match AWE Pinecone index dimensions
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_KEY
          }
        }
      );

      console.log('✅ Embedding generated successfully');
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('❌ Error getting embedding:', error);
      throw error;
    }
  }

  // Query Pinecone directly using REST API
  async search(query: string, topK: number = 10, category?: string): Promise<SearchResult[]> {
    try {
      console.log('🔍 Starting knowledge base search...');
      console.log('📝 Query:', query);
      console.log('🎯 Category filter:', category || 'none');

      // Step 1: Get embedding for the query
      const queryEmbedding = await this.getEmbedding(query);

      // Step 2: Build filter if category is specified
      const filter = category ? { category: { $eq: category } } : undefined;

      // Step 3: Query Pinecone using REST API
      console.log('🔄 Querying Pinecone index...');
      console.log('📍 Pinecone Host:', PINECONE_INDEX_HOST);
      console.log('🔑 API Key (first 20 chars):', PINECONE_API_KEY.substring(0, 20) + '...');
      console.log('📦 Index Name:', INDEX_NAME);

      const pineconeResponse = await axios.post(
        `https://${PINECONE_INDEX_HOST}/query`,
        {
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
          filter: filter,
          namespace: '' // Default namespace
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': PINECONE_API_KEY
          }
        }
      );

      // Step 4: Format results
      const matches = pineconeResponse.data.matches || [];
      console.log(`✅ Found ${matches.length} results from Pinecone`);

      const searchResults: SearchResult[] = matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        fileName: match.metadata?.fileName || 'Unknown',
        filePath: match.metadata?.filePath || '',
        fileType: match.metadata?.fileType || '',
        textPreview: match.metadata?.textPreview || '',
        category: match.metadata?.category || '',
        chunkIndex: match.metadata?.chunkIndex || 0,
        totalChunks: match.metadata?.totalChunks || 1
      }));

      // Log results for debugging
      if (searchResults.length > 0) {
        console.log('📊 Top result:', {
          score: searchResults[0].score,
          fileName: searchResults[0].fileName,
          preview: searchResults[0].textPreview.substring(0, 100) + '...'
        });
      } else {
        console.log('⚠️ No results found in knowledge base');
      }

      return searchResults;
    } catch (error: any) {
      console.error('❌ Error searching knowledge base:', error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response error:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);

        // Provide helpful debugging info
        if (error.response.status === 403) {
          console.error('');
          console.error('🔍 DEBUGGING 403 FORBIDDEN:');
          console.error('   1. Check that the API key is for the correct Pinecone project');
          console.error('   2. Verify the index host URL matches your Pinecone dashboard');
          console.error('   3. Ensure the index exists and is in the same project as the API key');
          console.error('   4. Check that the API key has "Query" permissions');
          console.error('');
          console.error('📋 Expected host format: index-name-project-id.svc.region.pinecone.io');
          console.error('📋 Your host:', PINECONE_INDEX_HOST);
          console.error('');
        }
      }
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    // Return predefined categories based on folder structure
    return [
      'Technical Documentation',
      'Safety Procedures',
      'Security Protocols',
      'Training Materials',
      'Research & Development',
      'Quality Assurance',
      'Project Documentation',
      'Knowledge Library',
      'Lessons Learned',
      'Standards & Guidelines',
      'Personnel Documentation',
      'Manuals and Handbooks',
      'Templates',
      'Organization Charts',
      'Technical Reports',
      'Software Documentation',
      'Compliance & Regulatory',
      'Operational Procedures'
    ];
  }
}

export const pineconeService = new PineconeService();
export default pineconeService;