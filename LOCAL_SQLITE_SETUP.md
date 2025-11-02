# Movar Brain - Local SQLite Database Integration

This guide shows how to set up and use the local SQLite database with Movar Brain instead of Supabase.

## 🗄️ **What's Been Added**

### New Files:
- `server/` - Complete SQLite backend server
- `src/services/localApiService.ts` - API client for local database
- Updated `src/contexts/ChatContext.tsx` - Integrated local API

### Database Features:
- **Users** - Clerk user management
- **Folders** - Organization with system prompts
- **Conversations** - Chat threads
- **Messages** - With attachments and artifacts
- **Documents** - File upload management

## 🚀 **Setup Instructions**

### 1. Start the SQLite Server

In **Terminal 1**:
```bash
cd server
npm start
```

Server runs on: **http://localhost:3001**

### 2. Start the Frontend

In **Terminal 2**:
```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

## ✅ **How It Works**

1. **User Signs In** → Creates/updates user in local SQLite database
2. **Chat Data** → All conversations, messages, folders stored locally
3. **File Uploads** → Files stored in `server/uploads/` directory
4. **Fallback** → If server is down, falls back to localStorage

## 🔄 **Migration from Supabase**

The integration:
- **Replaces** Supabase calls with local SQLite API
- **Maintains** all existing functionality
- **Preserves** localStorage fallback for offline use
- **Keeps** all file parsing and Azure OpenAI integration

## 📍 **Database Location**

- **Database**: `server/movar-brain.db` (created automatically)
- **Uploads**: `server/uploads/` (created automatically)

## 🛠️ **Development**

To run server in development mode:
```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

## 🔍 **API Endpoints**

### Users
- `POST /api/users` - Create/update user

### Folders
- `GET /api/folders/:userId` - Get user folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:folderId` - Update folder
- `DELETE /api/folders/:folderId` - Delete folder

### Conversations
- `GET /api/conversations/:userId` - Get conversations
- `POST /api/conversations` - Create conversation
- `PUT /api/conversations/:conversationId` - Update conversation
- `DELETE /api/conversations/:conversationId` - Delete conversation

### Messages
- `GET /api/conversations/:conversationId/messages` - Get messages
- `POST /api/conversations/:conversationId/messages` - Add message

### Files
- `POST /api/upload` - Upload file
- `GET /api/documents/:userId` - Get documents
- `POST /api/documents` - Save document
- `DELETE /api/documents/:documentId` - Delete document

## ⚙️ **Configuration**

No environment variables needed! The local API automatically:
- Creates the database on first run
- Sets up all required tables
- Handles file uploads
- Manages user sessions with Clerk

Your Windows PC now functions as a complete database server with all chat data stored locally! 🎉