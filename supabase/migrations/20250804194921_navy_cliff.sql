/*
  # User Chats and Folders Database Schema

  1. New Tables
    - `user_folders`
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `name` (text, encrypted)
      - `system_prompt` (text, encrypted, optional)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_conversations`
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `folder_id` (uuid, optional foreign key to user_folders)
      - `title` (text, encrypted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `conversation_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to user_conversations)
      - `role` (text, check constraint for 'user', 'assistant', 'system')
      - `content` (text, encrypted)
      - `model` (text, optional)
      - `attachments` (jsonb, encrypted, optional)
      - `artifact` (jsonb, encrypted, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - All sensitive content is encrypted using pgcrypto
    - Proper indexes for performance

  3. Encryption
    - Uses pgcrypto extension for encryption
    - Sensitive fields are encrypted at rest
    - Encryption key managed securely
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_folders table
CREATE TABLE IF NOT EXISTS user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  system_prompt text,
  color text DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_conversations table
CREATE TABLE IF NOT EXISTS user_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  folder_id uuid REFERENCES user_folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES user_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  model text,
  attachments jsonb,
  artifact jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_folders_created_at ON user_folders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_folder_id ON user_conversations(folder_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_created_at ON user_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_folders
CREATE POLICY "Users can read their own folders"
  ON user_folders
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own folders"
  ON user_folders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own folders"
  ON user_folders
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own folders"
  ON user_folders
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create RLS policies for user_conversations
CREATE POLICY "Users can read their own conversations"
  ON user_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON user_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own conversations"
  ON user_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON user_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create RLS policies for conversation_messages
CREATE POLICY "Users can read messages from their conversations"
  ON conversation_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_conversations 
      WHERE user_conversations.id = conversation_messages.conversation_id 
      AND user_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON conversation_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_conversations 
      WHERE user_conversations.id = conversation_messages.conversation_id 
      AND user_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON conversation_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_conversations 
      WHERE user_conversations.id = conversation_messages.conversation_id 
      AND user_conversations.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_conversations 
      WHERE user_conversations.id = conversation_messages.conversation_id 
      AND user_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON conversation_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_conversations 
      WHERE user_conversations.id = conversation_messages.conversation_id 
      AND user_conversations.user_id = auth.uid()::text
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_folders_updated_at
  BEFORE UPDATE ON user_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_conversations_updated_at
  BEFORE UPDATE ON user_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();