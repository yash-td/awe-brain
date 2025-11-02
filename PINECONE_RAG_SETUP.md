# Pinecone RAG Mode Setup Guide

## What Changed

Previously, the Pinecone knowledge base search relied on the ngrok server. Now it's been updated to work **directly from the frontend** using Pinecone's REST API.

## How It Works

When you enable "Knowledge Search" mode:

1. **User asks a question** → Your query is sent to the app
2. **Azure OpenAI creates an embedding** → The query is converted to a vector (1024 dimensions)
3. **Pinecone searches the vector database** → Finds similar documents based on semantic meaning
4. **Results are formatted** → Top 5 most relevant documents are retrieved
5. **AI generates response** → Azure OpenAI uses the retrieved context to answer your question

## Configuration Needed

### 1. Get Your Pinecone Index Host URL

The Pinecone index host format is: `{index-name}-{project-id}.svc.{cloud}.pinecone.io`

**To find your exact host URL:**

1. Go to https://app.pinecone.io/
2. Sign in to your Pinecone account
3. Click on your index (named "movar")
4. Look for the **"Host"** or **"Endpoint"** field
5. Copy the full URL (it should look like: `movar-xxxxx.svc.aped-xxxx-xxxx.pinecone.io`)

**Update the host in your `.env` file:**
```env
VITE_PINECONE_INDEX_HOST=movar-xxxxx.svc.aped-xxxx-xxxx.pinecone.io
```

### 2. Verify Your Pinecone API Key

The API key is already configured, but you can verify it in Pinecone:

1. Go to https://app.pinecone.io/
2. Click on "API Keys" in the left sidebar
3. Copy your API key
4. Update `.env` if needed:
```env
VITE_PINECONE_API_KEY=your_actual_pinecone_api_key
```

### 3. Environment Variables Summary

Make sure your `.env` file has these Pinecone variables:

```env
# Pinecone Configuration (for Knowledge Base / RAG mode)
VITE_PINECONE_API_KEY=pcsk_2nA3ss_KV1WfbHBQDF1bfM8fQNkfB52ZmnX145T6v41C63u4dVvPqEzbYEpG3WWS1jnQAV
VITE_PINECONE_INDEX_HOST=movar-3o0smxc.svc.aped-4627-b74a.pinecone.io
VITE_PINECONE_INDEX_NAME=movar
```

**Note**: The `VITE_PINECONE_INDEX_HOST` value above is a placeholder. You MUST replace it with your actual index host from the Pinecone dashboard.

## Testing RAG Mode

### Step 1: Start the App
```bash
npm run dev
```

### Step 2: Enable Knowledge Search
1. Sign in to the app
2. Click the **"Knowledge: OFF"** button in the header
3. It should turn green and say **"Knowledge: ON"**
4. You should see a green badge: "Knowledge Search Active"

### Step 3: Ask a Question
Ask something that should be in your Pinecone knowledge base, for example:
- "What are Movar's core values?"
- "Summarize the training documentation"
- "What's in the employee handbook?"

### Step 4: Check Console Logs

Open browser DevTools (F12) and check the Console. You should see:

```
✅ Knowledge Search Active
🔍 Starting knowledge base search...
📝 Query: What are Movar's core values?
🎯 Category filter: none
🔄 Getting embedding from Azure OpenAI...
✅ Embedding generated successfully
🔄 Querying Pinecone index...
✅ Found 5 results from Pinecone
📊 Top result: {
  score: 0.85,
  fileName: "Movar-Handbook.pdf",
  preview: "Movar's core values are innovation, integrity..."
}
```

### Expected Behavior

**✅ When Knowledge Mode is ON:**
- Questions are enhanced with context from Pinecone
- AI responses reference specific documents
- Console shows detailed search logs
- More accurate, grounded answers

**❌ When Knowledge Mode is OFF:**
- Questions go directly to Azure OpenAI
- No Pinecone search
- General knowledge responses

## Troubleshooting

### Error: "Failed to load resource: net::ERR_NAME_NOT_RESOLVED"

**Problem**: The Pinecone index host URL is incorrect.

**Solution**:
1. Go to Pinecone dashboard
2. Copy the correct host URL
3. Update `VITE_PINECONE_INDEX_HOST` in `.env`
4. Restart the dev server

### Error: "401 Unauthorized" or "403 Forbidden"

**Problem**: Invalid Pinecone API key.

**Solution**:
1. Go to Pinecone → API Keys
2. Copy a valid API key
3. Update `VITE_PINECONE_API_KEY` in `.env`
4. Restart the dev server

### Error: "Index not found"

**Problem**: The index name is incorrect or doesn't exist.

**Solution**:
1. Verify your index name in Pinecone dashboard
2. Update `VITE_PINECONE_INDEX_NAME` in `.env`
3. Restart the dev server

### No Results Found (⚠️ No results found in knowledge base)

**Possible Reasons**:
1. **Empty index** - No documents uploaded to Pinecone
2. **Wrong namespace** - Using a different namespace than where documents are stored
3. **Poor query match** - Try more specific questions
4. **Filter too restrictive** - Category filter might be excluding results

**Solution**:
- Verify documents exist in Pinecone dashboard
- Try a broader question
- Check if documents are in the default namespace (`""`)

### Azure OpenAI Embedding Error

**Problem**: Can't generate embeddings for the query.

**Solution**:
1. Check Azure OpenAI credentials in `.env`
2. Verify `text-embedding-3-small` deployment exists
3. Check Azure OpenAI quota/usage limits

## RAG Mode Workflow (Technical Details)

### Frontend Flow (`src/contexts/ChatContext.tsx`)

```typescript
if (ragMode) {
  // 1. Search Pinecone for relevant documents
  const searchResults = await pineconeService.search(content, 5);

  if (searchResults.length > 0) {
    // 2. Format context from search results
    const context = searchResults.map((result, idx) =>
      `[Document ${idx + 1}: ${result.fileName}]\n${result.textPreview}`
    ).join('\n\n');

    // 3. Create enhanced prompt with context
    const enhancedContent = `Using the following context from Movar's knowledge base, answer the user's question. If the context doesn't contain relevant information, say so and answer based on your general knowledge.

CONTEXT:
${context}

USER QUESTION:
${content}`;

    // 4. Send to Azure OpenAI with context
    response = await azureOpenAIService.sendMessage(messagesWithContext, selectedModel);
  }
}
```

### Pinecone Service (`src/services/pineconeService.ts`)

```typescript
async search(query: string, topK: number = 10) {
  // 1. Get embedding from Azure OpenAI
  const embedding = await this.getEmbedding(query);

  // 2. Query Pinecone with embedding
  const response = await axios.post(
    `https://${PINECONE_INDEX_HOST}/query`,
    {
      vector: embedding,
      topK: topK,
      includeMetadata: true
    },
    {
      headers: {
        'Api-Key': PINECONE_API_KEY
      }
    }
  );

  // 3. Return formatted results
  return response.data.matches.map(match => ({
    score: match.score,
    fileName: match.metadata.fileName,
    textPreview: match.metadata.textPreview,
    // ... other metadata
  }));
}
```

## Benefits of New Implementation

✅ **No server required** - Works entirely from frontend
✅ **Direct Pinecone access** - Faster, no intermediary
✅ **Better logging** - Detailed console output for debugging
✅ **Same functionality** - All features preserved from old implementation
✅ **Works with Supabase** - Compatible with new architecture

## Checking Your Pinecone Index

To verify your index has data:

1. Go to https://app.pinecone.io/
2. Click on your "movar" index
3. Check the **Vector Count** - should be > 0
4. Click "Query" to test manually
5. Try a sample query to see if results are returned

## Adding Documents to Pinecone

Documents are typically added through:
1. The old server's upload endpoint (if still running)
2. Direct Pinecone API calls
3. Bulk import scripts

If your index is empty, you'll need to re-upload your documents.

## Production Deployment

For Netlify deployment, add these environment variables:

1. Go to Netlify → Site Settings → Environment Variables
2. Add:
   - `VITE_PINECONE_API_KEY`
   - `VITE_PINECONE_INDEX_HOST`
   - `VITE_PINECONE_INDEX_NAME`

## Security Note

⚠️ **Important**: Pinecone API keys are currently exposed in frontend code. For production:

1. Create a Netlify Function or Supabase Edge Function
2. Move Pinecone queries to serverless function
3. Keep API keys server-side only
4. Frontend calls your function, not Pinecone directly

This is fine for development/internal use but should be secured for public deployment.
