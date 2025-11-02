# Ngrok Setup for Local SQLite Server

This app uses a local SQLite database that's exposed via ngrok tunnel for the production Netlify deployment.

## Setup Instructions

### 1. Start Local Server

```bash
cd server
npm start
```

The server will start on `http://localhost:3002`

### 2. Start Ngrok Tunnel

In a separate terminal:

```bash
ngrok http 3002
```

You'll see output like:
```
Forwarding    https://xxxx-xx-xxx-x-xxx.ngrok-free.app -> http://localhost:3002
```

### 3. Update Netlify Environment Variable

**Option A: Via Netlify Dashboard (Recommended)**

1. Go to your Netlify site dashboard
2. Navigate to: **Site Settings** → **Environment Variables**
3. Find `VITE_LOCAL_API_URL`
4. Update the value to: `https://your-new-ngrok-url.ngrok-free.app/api`
5. Click **Save**
6. Trigger a new deploy or wait for next build

**Option B: Via netlify.toml (for local testing)**

Update `netlify.toml`:
```toml
[build.environment]
  VITE_LOCAL_API_URL = "https://your-new-ngrok-url.ngrok-free.app/api"
```

**Note:** Changes to netlify.toml require a git commit and push.

### 4. Verify Configuration

After updating:

1. Redeploy your Netlify site
2. Check browser console for any CORS errors
3. Test chat functionality
4. Test knowledge base toggle

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

1. Verify ngrok tunnel is running: `curl https://your-ngrok-url.ngrok-free.app/api/health`
2. Check that the URL in Netlify matches your current ngrok URL
3. Ensure server is running on port 3002
4. Verify `server/server.js` has correct CORS configuration

### Ngrok URL Changed

Ngrok free tier generates new URLs when tunnel restarts. When this happens:

1. Copy the new ngrok URL
2. Update `VITE_LOCAL_API_URL` in Netlify dashboard
3. Redeploy

### Knowledge Base Search Not Working

If knowledge base toggle doesn't query Pinecone:

1. Check ngrok URL is correct
2. Verify `/api/knowledge/search` endpoint exists on server
3. Check server logs for Pinecone initialization
4. Ensure Pinecone API key is valid in `server/server.js`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_LOCAL_API_URL` | Ngrok tunnel URL to local SQLite server | `https://xxxx.ngrok-free.app/api` |
| `VITE_AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | `https://xxx.openai.azure.com` |
| `VITE_AZURE_OPENAI_API_KEY` | Azure OpenAI API key | `970587548a234c1f9340a97c513cf5fd` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth public key | `pk_test_xxx` |

## Production Considerations

For production use, consider:

1. **Persistent Ngrok URLs**: Upgrade to ngrok paid plan for static domains
2. **Cloud Database**: Migrate SQLite to PostgreSQL/MySQL hosted service
3. **API Gateway**: Use proper API gateway instead of ngrok tunnel
4. **Environment Secrets**: Store sensitive keys in Netlify secure environment variables
