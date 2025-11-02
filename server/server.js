const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { Pinecone } = require('@pinecone-database/pinecone');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

// Pinecone configuration
const PINECONE_API_KEY = 'pcsk_2nA3ss_KV1WfbHBQDF1bfM8fQNkfB52ZmnX145T6v41C63u4dVvPqEzbYEpG3WWS1jnQAV';
const INDEX_NAME = 'movar';
const AZURE_OPENAI_ENDPOINT = process.env.VITE_AZURE_OPENAI_ENDPOINT || 'https://ai-movarai650901572824.cognitiveservices.azure.com';
const AZURE_OPENAI_KEY = process.env.VITE_AZURE_OPENAI_API_KEY || '970587548a234c1f9340a97c513cf5fd';
const EMBEDDING_DEPLOYMENT = 'text-embedding-3-small';
const API_VERSION = '2024-12-01-preview';

// Initialize Pinecone
let pineconeIndex = null;
async function initPinecone() {
  if (!pineconeIndex) {
    const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pc.index(INDEX_NAME);
    console.log('✅ Pinecone initialized');
  }
  return pineconeIndex;
}

// Get embedding from Azure OpenAI
async function getEmbedding(text) {
  const response = await axios.post(
    `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT}/embeddings?api-version=${API_VERSION}`,
    {
      input: text.substring(0, 8000),
      dimensions: 1024
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
      }
    }
  );
  return response.data.data[0].embedding;
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Configure CORS for production and development
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://modexa.netlify.app',
    /^https:\/\/.*\.netlify\.app$/  // Allow all Netlify apps
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'ngrok-skip-browser-warning']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// User Management
app.post('/api/users', (req, res) => {
  const { clerkUserId, email, firstName, lastName } = req.body;

  // Check if user exists
  db.get('SELECT * FROM users WHERE clerk_user_id = ?', [clerkUserId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Update existing user
      db.run(`UPDATE users SET
        email = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = ?`,
        [email, firstName, lastName, clerkUserId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ id: row.id, clerkUserId, email, firstName, lastName });
        }
      );
    } else {
      // Create new user
      const userId = uuidv4();
      db.run('INSERT INTO users (id, clerk_user_id, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        [userId, clerkUserId, email, firstName, lastName],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ id: userId, clerkUserId, email, firstName, lastName });
        }
      );
    }
  });
});

// Folder Management
app.get('/api/folders/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === 'undefined' || userId === 'null') {
    console.log('Invalid userId in getFolders:', userId);
    return res.json([]); // Return empty array for invalid userId
  }

  db.all('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC',
    [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching folders:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/folders', (req, res) => {
  const { userId, name, systemPrompt, color } = req.body;
  const folderId = uuidv4();

  db.run('INSERT INTO folders (id, user_id, name, system_prompt, color) VALUES (?, ?, ?, ?, ?)',
    [folderId, userId, name, systemPrompt, color || '#6b7280'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM folders WHERE id = ?', [folderId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

app.put('/api/folders/:folderId', (req, res) => {
  const { folderId } = req.params;
  const { name, systemPrompt, color } = req.body;

  db.run(`UPDATE folders SET
    name = COALESCE(?, name),
    system_prompt = COALESCE(?, system_prompt),
    color = COALESCE(?, color),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [name, systemPrompt, color, folderId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM folders WHERE id = ?', [folderId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

app.delete('/api/folders/:folderId', (req, res) => {
  const { folderId } = req.params;

  db.serialize(() => {
    // Update conversations to remove folder reference
    db.run('UPDATE conversations SET folder_id = NULL WHERE folder_id = ?', [folderId]);

    // Delete the folder
    db.run('DELETE FROM folders WHERE id = ?', [folderId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Folder deleted successfully' });
    });
  });
});

// Conversation Management
app.get('/api/conversations/:userId', (req, res) => {
  const { userId } = req.params;
  const { folderId } = req.query;

  if (!userId || userId === 'undefined' || userId === 'null') {
    console.log('Invalid userId in getConversations:', userId);
    return res.json([]); // Return empty array for invalid userId
  }

  let query = `
    SELECT c.*,
           COUNT(m.id) as message_count,
           f.name as folder_name,
           f.color as folder_color
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN folders f ON c.folder_id = f.id
    WHERE c.user_id = ?
  `;

  const params = [userId];

  if (folderId === 'null' || folderId === 'undefined') {
    query += ' AND c.folder_id IS NULL';
  } else if (folderId) {
    query += ' AND c.folder_id = ?';
    params.push(folderId);
  }

  query += ' GROUP BY c.id ORDER BY c.updated_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching conversations:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/conversations', (req, res) => {
  const { userId, title, folderId } = req.body;
  const conversationId = uuidv4();

  db.run('INSERT INTO conversations (id, user_id, folder_id, title) VALUES (?, ?, ?, ?)',
    [conversationId, userId, folderId || null, title || 'New Chat'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get(`
        SELECT c.*, f.name as folder_name, f.color as folder_color
        FROM conversations c
        LEFT JOIN folders f ON c.folder_id = f.id
        WHERE c.id = ?`,
        [conversationId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

app.put('/api/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const { title } = req.body;

  db.run('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, conversationId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Conversation updated successfully' });
    }
  );
});

app.delete('/api/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params;

  db.serialize(() => {
    // Delete file attachments first
    db.run('DELETE FROM file_attachments WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = ?)', [conversationId]);

    // Delete messages
    db.run('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);

    // Delete conversation
    db.run('DELETE FROM conversations WHERE id = ?', [conversationId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Conversation deleted successfully' });
    });
  });
});

// Message Management
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
    console.log('Invalid conversationId in getMessages:', conversationId);
    return res.json([]); // Return empty array for invalid conversationId
  }

  db.all(`
    SELECT m.*,
           json_group_array(
             CASE WHEN fa.id IS NOT NULL
             THEN json_object(
               'id', fa.id,
               'name', fa.name,
               'type', fa.type,
               'size', fa.size,
               'content', fa.content,
               'parsedContent', fa.parsed_content
             )
             END
           ) as attachments
    FROM messages m
    LEFT JOIN file_attachments fa ON m.id = fa.message_id
    WHERE m.conversation_id = ?
    GROUP BY m.id
    ORDER BY m.timestamp ASC`,
    [conversationId], (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err.message);
      return res.status(500).json({ error: err.message });
    }

    // Parse attachments JSON
    const messages = rows.map(row => ({
      ...row,
      attachments: JSON.parse(row.attachments).filter(att => att !== null)
    }));

    res.json(messages || []);
  });
});

app.post('/api/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const { role, content, model, attachments, artifact } = req.body;
  const messageId = uuidv4();

  if (!['user', 'assistant', 'system'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prepare artifact data
  let artifactType = null;
  let artifactData = null;

  if (artifact) {
    artifactType = artifact.type;
    artifactData = JSON.stringify(artifact.data);
  }

  db.serialize(() => {
    // Insert message
    db.run(`INSERT INTO messages
      (id, conversation_id, role, content, model, artifact_type, artifact_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [messageId, conversationId, role, content, model, artifactType, artifactData],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Insert attachments if any
        if (attachments && attachments.length > 0) {
          const attachmentStmt = db.prepare(`
            INSERT INTO file_attachments
            (id, message_id, name, type, size, content, parsed_content)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          attachments.forEach(att => {
            attachmentStmt.run([
              att.id || uuidv4(),
              messageId,
              att.name,
              att.type,
              att.size,
              att.content,
              att.parsedContent
            ]);
          });

          attachmentStmt.finalize();
        }

        // Update conversation timestamp
        db.run('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);

        // Return the created message
        db.get(`
          SELECT m.*,
                 json_group_array(
                   CASE WHEN fa.id IS NOT NULL
                   THEN json_object(
                     'id', fa.id,
                     'name', fa.name,
                     'type', fa.type,
                     'size', fa.size,
                     'content', fa.content,
                     'parsedContent', fa.parsed_content
                   )
                   END
                 ) as attachments
          FROM messages m
          LEFT JOIN file_attachments fa ON m.id = fa.message_id
          WHERE m.id = ?
          GROUP BY m.id`,
          [messageId], (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const message = {
            ...row,
            attachments: JSON.parse(row.attachments).filter(att => att !== null),
            artifact: artifact || null
          };

          res.json(message);
        });
      }
    );
  });
});

// File Upload Management
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileInfo = {
    id: uuidv4(),
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
    filename: req.file.filename
  };

  res.json(fileInfo);
});

// Document Management
app.get('/api/documents/:userId', (req, res) => {
  const { userId } = req.params;
  const { folderId } = req.query;

  let query = 'SELECT * FROM documents WHERE user_id = ?';
  const params = [userId];

  if (folderId === 'null' || folderId === 'undefined') {
    query += ' AND folder_id IS NULL';
  } else if (folderId) {
    query += ' AND folder_id = ?';
    params.push(folderId);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/documents', (req, res) => {
  const { userId, folderId, name, type, size, content, parsedContent, filePath } = req.body;
  const documentId = uuidv4();

  db.run(`INSERT INTO documents
    (id, user_id, folder_id, name, type, size, content, parsed_content, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [documentId, userId, folderId || null, name, type, size, content, parsedContent, filePath],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM documents WHERE id = ?', [documentId], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

app.delete('/api/documents/:documentId', (req, res) => {
  const { documentId } = req.params;

  // Get document info to delete file if exists
  db.get('SELECT file_path FROM documents WHERE id = ?', [documentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row && row.file_path) {
      const fullPath = path.join(__dirname, row.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    db.run('DELETE FROM documents WHERE id = ?', [documentId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Document deleted successfully' });
    });
  });
});

// Pinecone Knowledge Base Search
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, topK = 10, category } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Initialize Pinecone
    const index = await initPinecone();

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Build filter if category is specified
    const filter = category ? { category: { $eq: category } } : undefined;

    // Query Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: filter
    });

    // Format results
    const searchResults = results.matches.map((match) => ({
      id: match.id,
      score: match.score,
      fileName: match.metadata.fileName,
      filePath: match.metadata.filePath,
      fileType: match.metadata.fileType,
      textPreview: match.metadata.textPreview,
      category: match.metadata.category,
      chunkIndex: match.metadata.chunkIndex,
      totalChunks: match.metadata.totalChunks
    }));

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Bind to all network interfaces for external access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Movar Brain Server running on:`);
  console.log(`   • Local: http://localhost:${PORT}`);
  console.log(`   • Network: http://[YOUR_PC_IP]:${PORT}`);
  console.log(`📁 Database location: ${path.join(__dirname, 'movar-brain.db')}`);
  console.log(`🌐 Ready for Netlify deployment!`);
  console.log(`ℹ️  Make sure Windows Firewall allows port ${PORT}`);
});

module.exports = app;