# 🚀 Netlify Deployment Guide for Movar Brain

Deploy your React frontend on Netlify while keeping your SQLite server running on your office PC.

## 🏗️ **Architecture Overview**

```
Internet Users → Netlify (Frontend) → Your Office PC (SQLite Server)
```

- **Frontend**: Hosted on Netlify (modexa.netlify.app)
- **Database**: SQLite server running on your office PC
- **Users**: Can access from anywhere, all data stored locally

## 📋 **Pre-Deployment Checklist**

### 1. Get Your Office PC IP Address

**Option A: Command Line**
```cmd
ipconfig
```
Look for your network adapter's IPv4 address (e.g., 192.168.1.100)

**Option B: Router Admin Panel**
- Access your router's admin interface
- Find connected devices
- Note your PC's local IP address

### 2. Configure Windows Firewall

**Allow Port 3002 through Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" → Enter "3002" → Next
6. Allow the connection → Next
7. Apply to all networks → Next
8. Name it "Movar Brain Server" → Finish

### 3. Update Configuration Files

**In `netlify.toml`** (line 12):
```toml
VITE_LOCAL_API_URL = "http://YOUR_ACTUAL_IP:3002/api"
```
Replace `YOUR_ACTUAL_IP` with your PC's IP address.

**In `server/server.js`** (line 41):
Add your Netlify domain to CORS origins:
```javascript
'https://modexa.netlify.app',
```

## 🚀 **Deployment Steps**

### Step 1: Prepare Your Office PC Server

1. **Install dependencies** (if not already done):
```bash
cd server
npm install
```

2. **Start the server in production mode**:
```bash
npm start
```

3. **Verify external access**:
   - Server should show: `Network: http://[YOUR_PC_IP]:3002`
   - Test from another device on same network: `http://YOUR_PC_IP:3002/api/health`

### Step 2: Deploy to Netlify

#### Option A: Git Integration (Recommended)

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Ready for Netlify deployment"
git remote add origin https://github.com/yourusername/movar-brain.git
git push -u origin main
```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import from Git"
   - Select your GitHub repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Set Environment Variables**:
   In Netlify dashboard → Site settings → Environment variables:
   ```
   VITE_LOCAL_API_URL = http://YOUR_PC_IP:3002/api
   VITE_AZURE_OPENAI_API_KEY = 970587548a234c1f9340a97c513cf5fd
   VITE_AZURE_OPENAI_ENDPOINT = https://ai-movarai650901572824.openai.azure.com
   VITE_AZURE_OPENAI_DEPLOYMENT = o3-mini
   ```

#### Option B: Manual Deploy

1. **Build the project**:
```bash
npm run build
```

2. **Deploy to Netlify**:
   - Drag and drop the `dist` folder to netlify.com
   - Set environment variables in dashboard

### Step 3: Configure Custom Domain (Optional)

1. **In Netlify Dashboard**:
   - Site settings → Domain management
   - Add custom domain: `modexa.netlify.app`
   - Enable HTTPS (automatic)

### Step 4: Router Configuration (For Internet Access)

**To allow internet users to access your PC server:**

1. **Port Forwarding** (on your router):
   - Forward external port 3002 → your PC's IP:3002
   - Enable UPnP if available

2. **Dynamic DNS** (optional):
   - Use services like DynDNS, No-IP for dynamic IP
   - Update `VITE_LOCAL_API_URL` to use your external domain

## 🔒 **Security Considerations**

### Essential Security Steps:

1. **Firewall Rules**:
   - Only allow port 3002
   - Consider restricting to specific IP ranges if possible

2. **HTTPS Considerations**:
   - Current setup uses HTTP for local server
   - For production, consider SSL certificates
   - Use reverse proxy (nginx) for HTTPS

3. **Authentication**:
   - Clerk authentication provides user-level security
   - Consider API key authentication for server endpoints

### Enhanced Security Setup:

```javascript
// Add to server.js for IP filtering (optional)
const allowedIPs = ['YOUR_OFFICE_IP_RANGE'];

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  // Add IP filtering logic if needed
  next();
});
```

## 🛠️ **Server Maintenance Scripts**

**Create `server/start-production.bat`**:
```batch
@echo off
echo Starting Movar Brain Production Server...
cd /d "%~dp0"
npm start
pause
```

**Create `server/restart-server.bat`**:
```batch
@echo off
taskkill /F /IM node.exe
timeout /t 2
npm start
```

## 📊 **Monitoring & Logs**

### Server Logs:
```bash
# Add logging to server.js
const fs = require('fs');
const path = require('path');

// Log requests
app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}\n`;
  fs.appendFileSync(path.join(__dirname, 'access.log'), log);
  next();
});
```

### Health Check Endpoint:
Your server already has `/api/health` - monitor this for uptime.

## 🚦 **Testing the Deployment**

1. **Local Test**: Verify server runs on your PC
2. **Network Test**: Access from another device on same network
3. **Internet Test**: Access your Netlify site from external network
4. **Functionality Test**: Create conversations, send messages
5. **Data Persistence**: Verify data saves to local SQLite

## ⚡ **Performance Tips**

1. **Keep PC Always On**: Configure power settings
2. **Stable Network**: Use wired connection for server PC
3. **Resource Monitoring**: Monitor SQLite database size
4. **Regular Backups**: Backup `movar-brain.db` regularly

## 🔧 **Troubleshooting**

### Common Issues:

1. **CORS Errors**: Check origin URLs in server CORS config
2. **Connection Refused**: Verify firewall and port forwarding
3. **Slow Response**: Check network latency and server resources
4. **Database Locks**: Restart server if SQLite locks up

### Debug Commands:
```bash
# Test server connectivity
curl http://YOUR_PC_IP:3002/api/health

# Check port status
netstat -an | grep 3002

# View server logs
cd server && npm start
```

## 🎯 **Final Result**

After deployment:
- ✅ **Frontend**: Hosted on modexa.netlify.app
- ✅ **Database**: Running on your office PC
- ✅ **Access**: Available worldwide
- ✅ **Data**: Stored locally and privately
- ✅ **Performance**: Fast local database access

Your office PC becomes a private database server accessible by your public Netlify app! 🏢→🌐