import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment variables
const PINECONE_API_KEY = process.env.VITE_PINECONE_API_KEY || 'pcsk_2Ywzpn_SLPdmKkwGqFGa865fepAGXwSxHjXpBwEbyPv1XkrDY1F7Uix7FdD5WwbvHnHeDe';
const PINECONE_INDEX_HOST = process.env.VITE_PINECONE_INDEX_HOST || 'awe-xauq34o.svc.apu-57e2-42f6.pinecone.io';
const AZURE_OPENAI_ENDPOINT = process.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://ai-movarai650901572824.openai.azure.com';
const AZURE_OPENAI_KEY = process.env.VITE_AZURE_OPENAI_KEY || process.env.VITE_AZURE_OPENAI_API_KEY || '970587548a234c1f9340a97c513cf5fd';
const EMBEDDING_DEPLOYMENT = process.env.VITE_AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small';
const API_VERSION = '2024-12-01-preview';

// Path to the data dump file
const DATA_FILE_PATH = path.join(__dirname, 'data_dump.txt');

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkText(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

async function getEmbedding(text, retries = 3) {
  const dimensions = 512; // Match AWE Pinecone index dimension

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT}/embeddings?api-version=${API_VERSION}`,
        {
          input: text.substring(0, 8000),
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
    } catch (error) {
      if (error.response?.status === 429 && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 2000;
        console.log(`⏳ Rate limited (429). Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`);
        await delay(waitTime);
        continue;
      }

      console.error('Error getting embedding:', error.response?.data || error.message);
      throw error;
    }
  }

  throw new Error('Failed to get embedding after retries');
}

async function uploadVectorsToPinecone(vectors) {
  try {
    const response = await axios.post(
      `https://${PINECONE_INDEX_HOST}/vectors/upsert`,
      {
        vectors: vectors,
        namespace: ''
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': PINECONE_API_KEY
        }
      }
    );

    console.log(`✅ Uploaded ${vectors.length} vectors to Pinecone`);
    return response.data;
  } catch (error) {
    console.error('Error uploading to Pinecone:', error.response?.data || error.message);
    throw error;
  }
}

async function vectorizeDocument() {
  try {
    console.log('🚀 Starting vectorization process...');
    console.log(`📄 Reading file: ${DATA_FILE_PATH}`);

    // Read the file
    if (!fs.existsSync(DATA_FILE_PATH)) {
      throw new Error(`File not found: ${DATA_FILE_PATH}`);
    }

    const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    console.log(`✅ File read successfully. Content length: ${fileContent.length} characters`);

    // Chunk the text
    console.log('📝 Chunking text...');
    const chunks = chunkText(fileContent, 500);
    console.log(`✅ Created ${chunks.length} chunks`);

    // Process chunks in batches
    const BATCH_SIZE = 10;
    const vectors = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)} (chunks ${i+1}-${Math.min(i+BATCH_SIZE, chunks.length)})`);

      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunk = batch[j];

        try {
          console.log(`  📊 Getting embedding for chunk ${chunkIndex + 1}/${chunks.length}...`);
          const embedding = await getEmbedding(chunk);

          vectors.push({
            id: `awe-doc-chunk-${chunkIndex}`,
            values: embedding,
            metadata: {
              text: chunk,
              source: 'data_dump.txt',
              chunkIndex: chunkIndex,
              timestamp: new Date().toISOString()
            }
          });

          console.log(`  ✅ Chunk ${chunkIndex + 1} embedded successfully`);

          // Small delay to avoid rate limiting
          await delay(500);
        } catch (error) {
          console.error(`  ❌ Error processing chunk ${chunkIndex + 1}:`, error.message);
          throw error;
        }
      }

      // Upload batch to Pinecone
      if (vectors.length >= BATCH_SIZE) {
        console.log(`\n📤 Uploading batch to Pinecone...`);
        await uploadVectorsToPinecone(vectors.splice(0, BATCH_SIZE));
        await delay(1000); // Delay between batch uploads
      }
    }

    // Upload remaining vectors
    if (vectors.length > 0) {
      console.log(`\n📤 Uploading final batch to Pinecone...`);
      await uploadVectorsToPinecone(vectors);
    }

    console.log('\n🎉 Vectorization complete!');
    console.log(`✅ Successfully indexed ${chunks.length} chunks from data_dump.txt`);
    console.log(`✅ Pinecone index: ${PINECONE_INDEX_HOST}`);

  } catch (error) {
    console.error('\n❌ Vectorization failed:', error.message);
    process.exit(1);
  }
}

// Run the vectorization
vectorizeDocument();
