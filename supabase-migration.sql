-- Movar Brain Supabase Migration Script
-- This script creates all necessary tables for the Movar Brain application
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table to store Clerk user sessions
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table for organizing conversations
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  system_prompt TEXT,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users (clerk_user_id) ON DELETE CASCADE
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  folder_id UUID,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users (clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  artifact_type TEXT,
  artifact_data JSONB,
  FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
);

-- File attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  content TEXT,
  parsed_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
);

-- Documents table for uploaded files
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  folder_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  content TEXT,
  parsed_content TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users (clerk_user_id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_folder_id ON conversations(folder_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_message_id ON file_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow users to access only their own data
-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

-- Folders table policies
CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (true);

-- Conversations table policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (true);

-- Messages table policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update messages in their conversations" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete messages in their conversations" ON messages
  FOR DELETE USING (true);

-- File attachments table policies
CREATE POLICY "Users can view file attachments" ON file_attachments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert file attachments" ON file_attachments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete file attachments" ON file_attachments
  FOR DELETE USING (true);

-- Documents table policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (true);
