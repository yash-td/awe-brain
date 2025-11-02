import axios from 'axios';
import { Conversation, Message, Folder, FileAttachment } from '../types';

// Use environment variable for production deployment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning
  },
});

export const localApiService = {
  // User Management
  async createOrUpdateUser(clerkUserId: string, email: string, firstName: string, lastName: string) {
    const response = await api.post('/users', {
      clerkUserId,
      email,
      firstName,
      lastName
    });
    return response.data;
  },

  // Folder Management
  async getFolders(userId: string): Promise<Folder[]> {
    const response = await api.get(`/folders/${userId}`);
    // Ensure response.data is an array
    if (!Array.isArray(response.data)) {
      console.error('getFolders received non-array response:', response.data);
      return [];
    }
    return response.data.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      systemPrompt: folder.system_prompt,
      color: folder.color,
      userId: folder.user_id,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    }));
  },

  async createFolder(userId: string, name: string, systemPrompt?: string, color?: string): Promise<Folder> {
    const response = await api.post('/folders', {
      userId,
      name,
      systemPrompt,
      color
    });

    const folder = response.data;
    return {
      id: folder.id,
      name: folder.name,
      systemPrompt: folder.system_prompt,
      color: folder.color,
      userId: folder.user_id,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    };
  },

  async updateFolder(folderId: string, updates: Partial<Folder>): Promise<Folder> {
    const response = await api.put(`/folders/${folderId}`, {
      name: updates.name,
      systemPrompt: updates.systemPrompt,
      color: updates.color
    });

    const folder = response.data;
    return {
      id: folder.id,
      name: folder.name,
      systemPrompt: folder.system_prompt,
      color: folder.color,
      userId: folder.user_id,
      createdAt: new Date(folder.created_at),
      updatedAt: new Date(folder.updated_at)
    };
  },

  async deleteFolder(folderId: string): Promise<void> {
    await api.delete(`/folders/${folderId}`);
  },

  // Conversation Management
  async getConversations(userId: string, folderId?: string | null): Promise<Conversation[]> {
    let url = `/conversations/${userId}`;
    if (folderId !== undefined) {
      url += `?folderId=${folderId || 'null'}`;
    }

    const response = await api.get(url);
    // Ensure response.data is an array
    if (!Array.isArray(response.data)) {
      console.error('getConversations received non-array response:', response.data);
      return [];
    }
    return response.data.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      messages: [], // Messages loaded separately
      folderId: conv.folder_id,
      userId: conv.user_id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      messageCount: conv.message_count || 0,
      folderName: conv.folder_name,
      folderColor: conv.folder_color
    }));
  },

  async createConversation(userId: string, title: string, folderId?: string): Promise<Conversation> {
    const response = await api.post('/conversations', {
      userId,
      title,
      folderId
    });

    const conv = response.data;
    return {
      id: conv.id,
      title: conv.title,
      messages: [],
      folderId: conv.folder_id,
      userId: conv.user_id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at)
    };
  },

  async updateConversation(conversationId: string, title: string): Promise<void> {
    await api.put(`/conversations/${conversationId}`, { title });
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/conversations/${conversationId}`);
  },

  // Message Management
  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    // Ensure response.data is an array
    if (!Array.isArray(response.data)) {
      console.error('getMessages received non-array response:', response.data);
      return [];
    }
    return response.data.map((msg: any) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      model: msg.model,
      attachments: msg.attachments || [],
      artifact: msg.artifact_type ? {
        type: msg.artifact_type,
        data: JSON.parse(msg.artifact_data || '{}')
      } : undefined
    }));
  },

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    model?: string,
    attachments?: FileAttachment[],
    artifact?: { type: string; data: any }
  ): Promise<Message> {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      role,
      content,
      model,
      attachments,
      artifact
    });

    const msg = response.data;
    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      model: msg.model,
      attachments: msg.attachments || [],
      artifact: msg.artifact
    };
  },

  // File Upload
  async uploadFile(file: File): Promise<{ id: string; name: string; type: string; size: number; path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Document Management
  async getDocuments(userId: string, folderId?: string | null) {
    let url = `/documents/${userId}`;
    if (folderId !== undefined) {
      url += `?folderId=${folderId || 'null'}`;
    }

    const response = await api.get(url);
    return response.data;
  },

  async saveDocument(
    userId: string,
    name: string,
    type: string,
    size: number,
    content: string,
    parsedContent?: string,
    folderId?: string,
    filePath?: string
  ) {
    const response = await api.post('/documents', {
      userId,
      folderId,
      name,
      type,
      size,
      content,
      parsedContent,
      filePath
    });

    return response.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/documents/${documentId}`);
  },

  // Health check
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  }
};

export default localApiService;