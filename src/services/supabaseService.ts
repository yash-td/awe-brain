import { createClient } from '@supabase/supabase-js';
import { Conversation, Message, Folder, FileAttachment } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseService = {
  // User Management
  async createOrUpdateUser(clerkUserId: string, email: string, firstName: string, lastName: string) {
    // Check if user exists - using maybeSingle() to avoid 406 errors
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        clerkUserId: data.clerk_user_id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name
      };
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            clerk_user_id: clerkUserId,
            email,
            first_name: firstName,
            last_name: lastName
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        clerkUserId: data.clerk_user_id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name
      };
    }
  },

  // Folder Management
  async getFolders(userId: string): Promise<Folder[]> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('Invalid userId in getFolders:', userId);
      return [];
    }

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return (data || []).map((folder: any) => ({
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
    const { data, error } = await supabase
      .from('folders')
      .insert([
        {
          user_id: userId,
          name,
          system_prompt: systemPrompt,
          color: color || '#6b7280'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      systemPrompt: data.system_prompt,
      color: data.color,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateFolder(folderId: string, updates: Partial<Folder>): Promise<Folder> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.systemPrompt !== undefined) updateData.system_prompt = updates.systemPrompt;
    if (updates.color !== undefined) updateData.color = updates.color;

    const { data, error } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      systemPrompt: data.system_prompt,
      color: data.color,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteFolder(folderId: string): Promise<void> {
    // Conversations will have folder_id set to null (ON DELETE SET NULL)
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  },

  // Conversation Management
  async getConversations(userId: string, folderId?: string | null): Promise<Conversation[]> {
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('Invalid userId in getConversations:', userId);
      return [];
    }

    let query = supabase
      .from('conversations')
      .select(`
        *,
        folders (
          name,
          color
        ),
        messages (count)
      `)
      .eq('user_id', userId);

    if (folderId === 'null' || folderId === 'undefined' || folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return (data || []).map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      messages: [], // Messages loaded separately
      folderId: conv.folder_id,
      userId: conv.user_id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      messageCount: conv.messages?.[0]?.count || 0,
      folderName: conv.folders?.name,
      folderColor: conv.folders?.color
    }));
  },

  async createConversation(userId: string, title: string, folderId?: string, conversationId?: string): Promise<Conversation> {
    const insertData: any = {
      user_id: userId,
      folder_id: folderId || null,
      title: title || 'New Chat'
    };

    // If a custom ID is provided, use it (for syncing from localStorage)
    if (conversationId) {
      insertData.id = conversationId;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([insertData])
      .select(`
        *,
        folders (
          name,
          color
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      messages: [],
      folderId: data.folder_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      folderName: data.folders?.name,
      folderColor: data.folders?.color
    };
  },

  async updateConversation(conversationId: string, updates: { title?: string }): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) throw error;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    // Messages and attachments will be cascade deleted
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  // Message Management
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      console.log('Invalid conversationId in getMessages:', conversationId);
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        file_attachments (*)
      `)
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return (data || []).map((msg: any) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      model: msg.model,
      attachments: (msg.file_attachments || []).map((att: any) => ({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        content: att.content,
        parsedContent: att.parsed_content
      })),
      artifact: msg.artifact_data ? {
        ...msg.artifact_data,
        createdAt: msg.artifact_data.createdAt ? new Date(msg.artifact_data.createdAt) : new Date()
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
    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role,
          content,
          model,
          artifact_type: artifact?.type || null,
          artifact_data: artifact || null
        }
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    // Insert attachments if any
    if (attachments && attachments.length > 0) {
      const attachmentInserts = attachments.map(att => ({
        message_id: messageData.id,
        name: att.name,
        type: att.type,
        size: att.size,
        content: att.content,
        parsed_content: att.parsedContent
      }));

      const { error: attachmentError } = await supabase
        .from('file_attachments')
        .insert(attachmentInserts);

      if (attachmentError) throw attachmentError;
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Fetch the complete message with attachments
    const messages = await this.getMessages(conversationId);
    const createdMessage = messages.find(m => m.id === messageData.id);

    if (!createdMessage) throw new Error('Failed to retrieve created message');

    return createdMessage;
  },

  // File Upload - Store files as base64 in database
  async uploadFile(file: File): Promise<{ id: string; name: string; type: string; size: number; path: string }> {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      path: base64 // Store as base64
    };
  },

  // Document Management
  async getDocuments(userId: string, folderId?: string | null) {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (folderId === 'null' || folderId === 'undefined' || folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
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
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          folder_id: folderId || null,
          name,
          type,
          size,
          content,
          parsed_content: parsedContent,
          file_path: filePath
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // Health check
  async checkHealth() {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      supabase: 'connected'
    };
  }
};

export default supabaseService;
