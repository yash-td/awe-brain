export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  attachments?: FileAttachment[];
  artifact?: DashboardArtifact;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
  parsedContent?: {
    text: string;
    metadata: {
      pages?: number;
      wordCount: number;
      fileType: string;
      fileName: string;
    };
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  systemPrompt?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
}

export interface AzureOpenAIModel {
  id: string;
  name: string;
  deployment: string;
  description: string;
  maxTokens: number;
}

export interface DashboardArtifact {
  id: string;
  title: string;
  code: string;
  type: 'chart' | 'dashboard' | 'visualization';
  data: any[];
  createdAt: Date;
}

export interface ZapierConnection {
  id: string;
  name: string;
  type: string;
  connected: boolean;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  text: string;
  metadata: {
    fileName: string;
    chunkIndex: number;
    totalChunks: number;
    uploadedAt: string;
    userId: string;
  };
}

export interface ChatContextType {
  conversations: Conversation[];
  folders: Folder[];
  currentConversation: Conversation | null;
  currentFolder: Folder | null;
  messages: Message[];
  isLoading: boolean;
  selectedModel: AzureOpenAIModel;
  availableModels: AzureOpenAIModel[];
  ragMode: boolean;
  sendMessage: (content: string, attachments?: FileAttachment[]) => Promise<void>;
  createNewConversation: (folderId?: string) => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  createFolder: (name: string, systemPrompt?: string, color?: string) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  deleteFolder: (folderId: string) => void;
  selectFolder: (folderId: string | null) => void;
  setSelectedModel: (model: AzureOpenAIModel) => void;
  uploadFile: (file: File) => Promise<FileAttachment>;
}