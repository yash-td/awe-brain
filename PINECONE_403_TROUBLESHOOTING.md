# Pinecone 403 Forbidden - Troubleshooting Guide

## 🔴 Error: 403 Forbidden

This means:
- ✅ Your API key is **valid** (not 401 anymore!)
- ❌ But it doesn't have **permission** to access the index

## 🔍 Step-by-Step Fix

### Step 1: Verify Your Index Exists

1. Go to https://app.pinecone.io/
2. Sign in
3. Look at the **Indexes** section on the left
4. Do you see an index named **"movar"**?
   - ✅ YES → Continue to Step 2
   - ❌ NO → Your index doesn't exist or has a different name

**If index doesn't exist:**
- Either create a new index named "movar"
- Or update `.env` to use your actual index name:
  ```env
  VITE_PINECONE_INDEX_NAME=your-actual-index-name
  ```

### Step 2: Get the EXACT Host URL

1. In Pinecone dashboard, click on your **"movar"** index
2. Look for these fields (they might be labeled differently):
   - **Host**, or
   - **Endpoint**, or
   - **Index URL**
3. Copy the **FULL URL** exactly as shown

**Example of what to look for:**
```
movar-3o0smxc.svc.aped-4627-b74a.pinecone.io
```

### Step 3: Verify Your API Key Belongs to This Project

1. In Pinecone dashboard, click **"API Keys"** in left sidebar
2. Look at the **Project** or **Organization** name at the top
3. Make sure your API key is from the **same project** where your index exists

**Common issue:** Using an API key from a different Pinecone project than where your index is hosted.

**Solution:**
- Use the API key from the **same project** as your index
- Or move your index to the project that matches your API key

### Step 4: Check API Key Permissions

1. In **API Keys** section
2. Find your API key
3. Check its **permissions** or **role**
4. It should have at least:
   - ✅ **Query** permission (to search vectors)
   - ✅ **Read** permission

**If permissions are wrong:**
- Create a new API key with correct permissions
- Or upgrade the existing key's permissions

### Step 5: Update Your .env File

```env
# Get these values from Pinecone dashboard:

VITE_PINECONE_API_KEY=pcsk_YOUR_ACTUAL_API_KEY_HERE
VITE_PINECONE_INDEX_HOST=your-exact-host-from-dashboard.svc.region.pinecone.io
VITE_PINECONE_INDEX_NAME=movar
```

**IMPORTANT:**
- Do NOT add `https://` to the host URL
- Do NOT add `/query` to the host URL
- Copy the host EXACTLY as shown in Pinecone dashboard

### Step 6: Restart and Test

```bash
# Stop server (Ctrl+C)
npm run dev
```

Then test again and check console output.

## 🐛 Console Debugging Output

After the fix, run your query and check the console. It will now show:

```
🔄 Querying Pinecone index...
📍 Pinecone Host: movar-xxxxx.svc.region.pinecone.io
🔑 API Key (first 20 chars): pcsk_2nA3ss_KV1WfbHB...
📦 Index Name: movar
```

**Verify this information matches your Pinecone dashboard exactly!**

## ❓ Still Getting 403?

### Check 1: Are you on the free tier?

Pinecone free tier has limitations. Check:
1. Your project is active (not paused)
2. You haven't exceeded free tier limits
3. Your index is in a supported region

### Check 2: Index Region Mismatch

Make sure your index host includes the correct region in the URL.

**Wrong:**
```
movar-3o0smxc.svc.wrong-region.pinecone.io
```

**Right (copy from dashboard):**
```
movar-3o0smxc.svc.aped-4627-b74a.pinecone.io
```

### Check 3: API Key Type

Pinecone has different types of keys:
- **Environment keys** (old format, starts with UUID)
- **API keys** (new format, starts with `pcsk_`)

Make sure you're using the right type for your index.

## 🎯 Quick Checklist

Before testing again, verify:

- [ ] Index exists and is named "movar" (or .env has correct name)
- [ ] API key is from the SAME Pinecone project as the index
- [ ] Host URL copied EXACTLY from Pinecone dashboard
- [ ] Host URL does NOT include `https://` or `/query`
- [ ] API key has Query/Read permissions
- [ ] .env file saved with correct values
- [ ] Dev server restarted after changing .env

## 📞 Need More Help?

If still stuck, check the **detailed console output** after our changes. It will show:
- The exact host URL being used
- The first 20 characters of your API key
- The index name
- Full error response from Pinecone

Share that console output to get more specific help!
