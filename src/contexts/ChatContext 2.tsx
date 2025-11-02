import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storageService';
import { azureOpenAIService } from '../services/azureOpenAI';
import { fileParserService } from '../services/fileParser';
import { dashboardGeneratorService } from '../services/dashboardGenerator';
import { pineconeService } from '../services/pineconeService';
import { 
  Conversation, 
  Message, 
  Folder, 
  FileAttachment, 
  AzureOpenAIModel,
  ChatContextType 
} from '../types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const availableModels: AzureOpenAIModel[] = [
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    deployment: 'o3-mini',
    description: 'Fast and efficient model for general tasks',
    maxTokens: 4000
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT OSS 120B',
    deployment: 'gpt-oss-120b',
    description: 'Large-scale open source model with 120B parameters',
    maxTokens: 8000
  },
  {
    id: 'o4-mini',
    name: 'O4 Mini',
    deployment: 'o4-mini',
    description: 'Advanced reasoning model with improved capabilities',
    maxTokens: 8000
  }
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AzureOpenAIModel>(availableModels[0]);
  const [ragMode, setRagMode] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLocalApiReady, setIsLocalApiReady] = useState(false);

  // Debug Supabase configuration
  useEffect(() => {
    console.log('Supabase configured');
  }, []);

  // Initialize Supabase when user is available
  useEffect(() => {
    const initializeSupabase = async () => {
      console.log('Initializing Supabase for user:', user?.id);

      if (user) {
        try {
          // Check if Supabase is running
          await supabaseService.checkHealth();
          console.log('Supabase is connected');

          // Create or update user in Supabase
          await supabaseService.createOrUpdateUser(
            user.id,
            user.primaryEmailAddress?.emailAddress || '',
            user.firstName || '',
            user.lastName || ''
          );

          setIsLocalApiReady(true);
        } catch (error) {
          console.error('Supabase initialization error:', error);
          console.log('Falling back to localStorage');
          setIsLocalApiReady(false);
        }
      }
    };

    initializeSupabase();
  }, [user]);

  const loadUserData = useCallback(async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping data load');
      return;
    }

    try {
      let loadedFolders: Folder[] = [];
      let loadedConversations: Conversation[] = [];

      // Try to load from Supabase first if available
      if (isLocalApiReady) {
        try {
          console.log('Loading data from Supabase...');
          loadedFolders = await supabaseService.getFolders(user.id);
          loadedConversations = await supabaseService.getConversations(user.id);
          console.log('Loaded from Supabase:', { folders: loadedFolders.length, conversations: loadedConversations.length });
        } catch (error) {
          console.error('Failed to load from Supabase, falling back to localStorage:', error);
          // Fall back to localStorage
          loadedConversations = storageService.loadConversations(user.id);
          console.log('Loaded from localStorage:', { folders: loadedFolders.length, conversations: loadedConversations.length });
        }
      } else {
        loadedConversations = storageService.loadConversations(user.id);
        console.log('Loaded from localStorage:', { folders: loadedFolders.length, conversations: loadedConversations.length });
      }
      
      setFolders(loadedFolders);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Error loading user data:', error);
      setFolders([]);
      setConversations([]);
    }
  }, [user?.id, isLocalApiReady]);

  // Load data on user sign in
  useEffect(() => {
    if (isSignedIn && user?.id) {
      loadUserData();
    }
  }, [isSignedIn, user?.id, loadUserData]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages || []);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    if (!currentConversation || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments
    };

    try {
      let savedUserMessage: Message;
      let savedAssistantMessage: Message;

      // Save user message to local API if available
      if (isLocalApiReady && user) {
        try {
          savedUserMessage = await supabaseService.addMessage(
            currentConversation.id,
            'user',
            content,
            undefined,
            attachments
          );
          setMessages(prev => [...prev, savedUserMessage]);
        } catch (error) {
          console.error('Failed to save user message to Supabase:', error);
          setMessages(prev => [...prev, userMessage]);
          savedUserMessage = userMessage;
        }
      } else {
        setMessages(prev => [...prev, userMessage]);
        savedUserMessage = userMessage;
      }

      const updatedMessages = [...messages, savedUserMessage];

      let response: string;

      // If RAG mode is enabled, query Pinecone first
      if (ragMode) {
        try {
          const searchResults = await pineconeService.search(content, 5);

          if (searchResults.length > 0) {
            // Format context from search results
            const context = searchResults.map((result, idx) =>
              `[Document ${idx + 1}: ${result.fileName}]\n${result.textPreview}`
            ).join('\n\n');

            // Create enhanced user message with context
            const enhancedContent = `Using the following context from Movar's knowledge base, answer the user's question. If the context doesn't contain relevant information, say so and answer based on your general knowledge.

CONTEXT:
${context}

USER QUESTION:
${content}`;

            const enhancedMessage: Message = {
              ...savedUserMessage,
              content: enhancedContent
            };

            const messagesWithContext = [...messages, enhancedMessage];
            response = await azureOpenAIService.sendMessage(messagesWithContext, selectedModel, attachments);
          } else {
            // No relevant documents found, use regular response
            response = await azureOpenAIService.sendMessage(updatedMessages, selectedModel, attachments);
          }
        } catch (error) {
          console.error('Error querying knowledge base:', error);
          // Fallback to regular response if Pinecone search fails
          response = await azureOpenAIService.sendMessage(updatedMessages, selectedModel, attachments);
        }
      } else {
        // Regular mode - no knowledge base augmentation
        response = await azureOpenAIService.sendMessage(updatedMessages, selectedModel, attachments);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        model: selectedModel.name
      };

      // Check if we should create a dashboard
      const dashboardArtifact = dashboardGeneratorService.createDashboardArtifact(content, response);
      if (dashboardArtifact) {
        assistantMessage.artifact = dashboardArtifact;
      }

      // Save assistant message to local API if available
      if (isLocalApiReady && user) {
        try {
          savedAssistantMessage = await supabaseService.addMessage(
            currentConversation.id,
            'assistant',
            response,
            selectedModel.name,
            undefined,
            dashboardArtifact
          );
          setMessages(prev => [...prev, savedAssistantMessage]);
        } catch (error) {
          console.error('Failed to save assistant message to Supabase:', error);
          setMessages(prev => [...prev, assistantMessage]);
          savedAssistantMessage = assistantMessage;
        }
      } else {
        setMessages(prev => [...prev, assistantMessage]);
        savedAssistantMessage = assistantMessage;
      }

      const finalMessages = [savedUserMessage, savedAssistantMessage];

      // Update conversation with new messages
      const updatedConversation = {
        ...currentConversation,
        messages: [...(currentConversation.messages || []), ...finalMessages],
        updatedAt: new Date()
      };

      setCurrentConversation(updatedConversation);

      const updatedConversations = conversations.map(conv =>
        conv.id === currentConversation.id ? updatedConversation : conv
      );
      setConversations(updatedConversations);

      // Save to localStorage as backup if not using local API
      if (!isLocalApiReady && user) {
        console.log('Saving updated conversations to localStorage:', updatedConversations.length);
        const saved = storageService.saveConversations(user.id, updatedConversations);
        console.log('Save result:', saved);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          model: selectedModel.name
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentConversation, messages, isLoading, selectedModel, conversations, user, isLocalApiReady]);

  const createNewConversation = useCallback(async (folderId?: string) => {
    if (!user?.id) {
      console.log('User not available, cannot create conversation');
      return;
    }

    console.log('Creating new conversation for user:', user.id, 'in folder:', folderId);
    
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      folderId,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Supabase if available
    if (isLocalApiReady) {
      try {
        const savedConversation = await supabaseService.createConversation(
          user.id,
          newConversation.title,
          newConversation.folderId
        );

        const updatedConversations = [savedConversation, ...conversations];
        setConversations(updatedConversations);
        setCurrentConversation(savedConversation);
        setMessages([]);

        console.log('Successfully saved conversation to Supabase:', savedConversation.id);
      } catch (error) {
        console.error('Failed to save conversation to Supabase:', error);
        // Fallback to local state and localStorage
        const updatedConversations = [newConversation, ...conversations];
        setConversations(updatedConversations);
        setCurrentConversation(newConversation);
        setMessages([]);
        storageService.saveConversations(user.id, updatedConversations);
      }
    } else {
      // Use local state and localStorage
      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setCurrentConversation(newConversation);
      setMessages([]);
      storageService.saveConversations(user.id, updatedConversations);
    }
  }, [conversations, user, isLocalApiReady]);

  const selectConversation = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);

      // Load messages from Supabase if available
      if (isLocalApiReady) {
        try {
          const loadedMessages = await supabaseService.getMessages(conversationId);
          setMessages(loadedMessages);
          console.log('Loaded messages from Supabase:', loadedMessages.length);
        } catch (error) {
          console.error('Failed to load messages from Supabase:', error);
          setMessages(conversation.messages || []);
        }
      } else {
        setMessages(conversation.messages || []);
      }
    }
  }, [conversations, isLocalApiReady]);
    
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    // Delete from Supabase if available
    if (isLocalApiReady) {
      try {
        await supabaseService.deleteConversation(conversationId);
        console.log('Successfully deleted conversation from Supabase');
      } catch (error) {
        console.error('Failed to delete conversation from Supabase:', error);
      }
    }

    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }

    // Save to localStorage as backup if not using Supabase
    if (!isLocalApiReady) {
      storageService.saveConversations(user.id, updatedConversations);
    }
  }, [conversations, currentConversation, user, isLocalApiReady]);

  const createFolder = useCallback(async (name: string, systemPrompt?: string, color?: string) => {
    if (!user?.id) return;

    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      systemPrompt,
      color: color || '#6b7280',
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Supabase if available
    if (isLocalApiReady) {
      try {
        const savedFolder = await supabaseService.createFolder(
          user.id,
          name,
          systemPrompt,
          color
        );

        const updatedFolders = [...folders, savedFolder];
        setFolders(updatedFolders);

        console.log('Successfully saved folder to Supabase:', savedFolder.id);
      } catch (error) {
        console.error('Failed to save folder to Supabase:', error);
        // Fallback to local state and localStorage
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        storageService.saveFolders(user.id, updatedFolders);
      }
    } else {
      // Use local state and localStorage
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      storageService.saveFolders(user.id, updatedFolders);
    }
  }, [folders, user, isLocalApiReady]);

  const updateFolder = useCallback(async (folderId: string, updates: Partial<Folder>) => {
    if (!user?.id) return;

    // Update in Supabase if available
    if (isLocalApiReady) {
      try {
        const updatedFolder = await supabaseService.updateFolder(folderId, updates);

        const updatedFolders = folders.map(folder =>
          folder.id === folderId ? updatedFolder : folder
        );
        setFolders(updatedFolders);

        if (currentFolder?.id === folderId) {
          setCurrentFolder(updatedFolder);
        }

        console.log('Successfully updated folder in Supabase:', updatedFolder.id);
      } catch (error) {
        console.error('Failed to update folder in Supabase:', error);
        // Fallback to local state and localStorage
        const updatedFolders = folders.map(folder =>
          folder.id === folderId
            ? { ...folder, ...updates, updatedAt: new Date() }
            : folder
        );
        setFolders(updatedFolders);
        storageService.saveFolders(user.id, updatedFolders);
      }
    } else {
      // Use local state and localStorage
      const updatedFolders = folders.map(folder =>
        folder.id === folderId
          ? { ...folder, ...updates, updatedAt: new Date() }
          : folder
      );
      setFolders(updatedFolders);

      if (currentFolder?.id === folderId) {
        setCurrentFolder({ ...currentFolder, ...updates, updatedAt: new Date() });
      }

      storageService.saveFolders(user.id, updatedFolders);
    }
  }, [folders, currentFolder, user, isLocalApiReady]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user?.id) return;

    // Delete from Supabase if available
    if (isLocalApiReady) {
      try {
        await supabaseService.deleteFolder(folderId);
        console.log('Successfully deleted folder from Supabase');
      } catch (error) {
        console.error('Failed to delete folder from Supabase:', error);
      }
    }

    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);

    // Move conversations from deleted folder to unorganized
    const updatedConversations = conversations.map(c =>
      c.folderId === folderId ? { ...c, folderId: undefined } : c
    );
    setConversations(updatedConversations);

    if (currentFolder?.id === folderId) {
      setCurrentFolder(null);
    }

    // Save to localStorage as backup if not using Supabase
    if (!isLocalApiReady) {
      storageService.saveFolders(user.id, updatedFolders);
      storageService.saveConversations(user.id, updatedConversations);
    }
  }, [folders, conversations, currentFolder, user, isLocalApiReady]);

  const selectFolder = useCallback((folderId: string | null) => {
    const folder = folderId ? folders.find(f => f.id === folderId) : null;
    setCurrentFolder(folder);
  }, [folders]);

  const uploadFile = useCallback(async (file: File): Promise<FileAttachment> => {
    try {
      const parsedContent = await fileParserService.parseFile(file);
      
      return {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: await file.text(),
        parsedContent
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, []);

  const value: ChatContextType = {
    conversations,
    folders,
    currentConversation,
    currentFolder,
    messages,
    isLoading,
    selectedModel,
    availableModels,
    ragMode,
    setRagMode,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation,
    createFolder,
    updateFolder,
    deleteFolder,
    selectFolder,
    setSelectedModel,
    uploadFile
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};