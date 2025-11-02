# 🚀 Deploy Movar Brain to Modexa.netlify.app

## 📋 **Quick Deployment Steps**

### Step 1: Get Your PC's IP Address
Run in Command Prompt:
```cmd
ipconfig
```
Look for IPv4 Address (e.g., 192.168.1.100)

### Step 2: Update Configuration
**Edit `netlify.toml` line 12:**
```toml
VITE_LOCAL_API_URL = "http://YOUR_ACTUAL_IP:3002/api"
```

### Step 3: Deploy to Netlify

#### Option A: Manual Deploy (Drag & Drop)
1. Go to [netlify.com](https://netlify.com) → Sites
2. Find your **Modexa** site → Site settings
3. Go to "Deploys" → "Deploy settings" → "Deploy using drag and drop"
4. Drag the entire `dist` folder to the deploy area
5. Wait for deployment to complete

#### Option B: Connect Git Repository
1. Push this project to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/movar-brain.git
git push -u origin main
```

2. In Netlify → Modexa site → Site settings → "Build & deploy"
3. Click "Link site to Git" → Connect repository
4. Build settings will be auto-detected from `netlify.toml`

### Step 4: Set Environment Variables
In Netlify Dashboard → Modexa Site → Site settings → Environment variables:

**Add these variables:**
```
VITE_LOCAL_API_URL = http://YOUR_PC_IP:3002/api
VITE_AZURE_OPENAI_API_KEY = 970587548a234c1f9340a97c513cf5fd
VITE_AZURE_OPENAI_ENDPOINT = https://ai-movarai650901572824.openai.azure.com
VITE_AZURE_OPENAI_DEPLOYMENT = o3-mini
VITE_CLERK_PUBLISHABLE_KEY = YOUR_CLERK_KEY
```

### Step 5: Configure Your Office PC Server

1. **Allow Firewall Access:**
   - Windows Firewall → Advanced Settings → Inbound Rules
   - New Rule → Port → TCP → 3002 → Allow

2. **Start the Server:**
   ```bash
   cd server
   start-production.bat
   ```

3. **Test Server Access:**
   - From another device: `http://YOUR_PC_IP:3002/api/health`

### Step 6: Test Deployment
1. Visit **https://modexa.netlify.app**
2. Sign in with Clerk
3. Create a conversation
4. Send a message
5. Verify data is stored on your PC (check `server/movar-brain.db`)

## 🔧 **Configuration Summary**

**Current Setup:**
- ✅ Build configured for production
- ✅ CORS set for modexa.netlify.app
- ✅ Environment variables template ready
- ✅ SQLite server configured for external access
- ✅ Git repository prepared

**What You Need:**
1. Your PC's IP address
2. Clerk publishable key (for authentication)
3. Windows Firewall configured
4. Router port forwarding (if accessing from internet)

## 🎯 **Final Architecture**

```
Users Worldwide → modexa.netlify.app → Your Office PC (SQLite)
```

All conversations will be stored locally on your Windows PC while the app is accessible globally! 🌐💾

## ⚠️ **Important Notes**

1. **Replace `[YOUR_PC_IP]`** in netlify.toml before deploying
2. **Keep your PC running** for the app to work
3. **Configure router** for internet access (port forwarding)
4. **Backup your database** regularly (`server/movar-brain.db`)

Ready to deploy? Follow these steps and your Movar Brain will be live on modexa.netlify.app! 🎉