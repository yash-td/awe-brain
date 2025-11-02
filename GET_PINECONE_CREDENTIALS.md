# How to Get Your Pinecone Credentials

The 401 error means your Pinecone API key is invalid or expired. Follow these steps:

## Step 1: Get API Key from Pinecone

1. Go to https://app.pinecone.io/
2. Sign in to your account
3. Click **"API Keys"** in the left sidebar
4. You'll see your API keys listed
5. **Copy** the API key (starts with `pcsk_` for new keys, or `pc_` for old keys)

## Step 2: Get Index Host URL

1. Still in Pinecone dashboard
2. Click **"Indexes"** in the left sidebar
3. Click on your **"movar"** index
4. Look for the **"Host"** or **"Endpoint"** field
5. Copy the full URL (format: `index-name-xxxxx.svc.region-xxx.pinecone.io`)

## Step 3: Update Your .env File

Open `/Users/ytkd/Desktop/code/movar-brain/.env` and update:

```env
# Pinecone Configuration (for Knowledge Base / RAG mode)
VITE_PINECONE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
VITE_PINECONE_INDEX_HOST=YOUR_ACTUAL_HOST_URL_HERE
VITE_PINECONE_INDEX_NAME=movar
```

**Example:**
```env
VITE_PINECONE_API_KEY=pcsk_2nA3ss_KV1WfbHBQDF1bfM8fQNkfB52ZmnX145T6v41C63u4dVvPqEzbYEpG3WWS1jnQAV
VITE_PINECONE_INDEX_HOST=movar-3o0smxc.svc.aped-4627-b74a.pinecone.io
VITE_PINECONE_INDEX_NAME=movar
```

## Step 4: Restart Dev Server

After updating `.env`:

```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

## Step 5: Test Again

1. Enable Knowledge mode (green button)
2. Ask a question
3. Check console - should now see:
   ```
   ✅ Embedding generated successfully
   ✅ Found X results from Pinecone
   ```

## Troubleshooting

### Still getting 401?
- Make sure you copied the FULL API key (they're long!)
- Check for extra spaces before/after the key
- Verify the key is from the correct Pinecone project

### Getting "Index not found" instead?
- Check that your index name is exactly "movar"
- Verify the index exists in your Pinecone dashboard

### Can't find your index?
If you don't have a "movar" index:
1. You may need to create one
2. Or your index might have a different name
3. Update `VITE_PINECONE_INDEX_NAME` in `.env` to match

## Quick Check: Does Your Index Have Data?

1. In Pinecone dashboard, click your "movar" index
2. Look for **"Vector count"** or **"Total vectors"**
3. Should be > 0 (if it's 0, you have no documents uploaded)

If vector count is 0, you need to upload documents to Pinecone first before RAG mode will work.
