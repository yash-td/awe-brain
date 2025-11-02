import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Settings, Folder, FolderPlus, Edit3, ChevronDown, ChevronRight } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { ThemeToggle } from './ThemeToggle';
import { FolderModal } from './FolderModal';
import { ModelSelector } from './ModelSelector';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    conversations,
    folders,
    currentConversation,
    currentFolder,
    createNewConversation,
    selectConversation,
    deleteConversation,
    deleteFolder,
    selectFolder,
  } = useChat();

  const { isDarkMode } = useTheme();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getConversationsInFolder = (folderId?: string) => {
    return conversations.filter(conv => conv.folderId === folderId);
  };

  const getUnorganizedConversations = () => {
    return conversations.filter(conv => !conv.folderId);
  };

  const handleEditFolder = (folderId: string) => {
    setEditingFolder(folderId);
    setShowFolderModal(true);
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const renderConversation = (conversation: any) => (
    <div
      key={conversation.id}
      className={`group flex items-center space-x-4 p-4 rounded-xl cursor-pointer hover:bg-white/50 dark:hover:bg-awe-midnight-light/50 transition-all duration-300 message-bubble hover-lift ${
        currentConversation?.id === conversation.id
          ? 'bg-gradient-to-r from-awe-teal/10 to-purple-500/5 dark:from-awe-teal/15 dark:to-purple-500/10 border border-awe-teal/30 premium-shadow glow-effect'
          : 'hover:premium-shadow'
      }`}
      onClick={() => {
        selectConversation(conversation.id);
        onClose(); // Close sidebar on mobile after selecting conversation
      }}
    >
      <MessageSquare className="w-5 h-5 text-awe-teal flex-shrink-0" />
      <span className="flex-1 movar-body text-base font-medium text-gray-700 dark:text-gray-300 truncate min-w-0" title={conversation.title}>
        {conversation.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteConversation(conversation.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 flex-shrink-0"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white/95 dark:bg-awe-midnight/95 backdrop-blur-xl
        border-r border-gray-200/50 dark:border-awe-midnight-light/50
        flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 dark:border-awe-midnight-light/50">
          {/* Logo */}
          <div className="flex items-center mb-6">
            <img
              src={isDarkMode
                ? "https://movar-reports.netlify.app/lovable-uploads/5d0a6ccd-eb16-4121-aef0-d583fe0bd181.png"
                : "https://movar.group/application/files/2517/0442/3523/Movar-Logo-2023-RGB.svg"
              }
              alt="Movar Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={() => createNewConversation(currentFolder?.id)}
            className="w-full bg-awe-teal hover:bg-awe-teal/90 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">New Chat</span>
          </button>
          
          {/* New Folder Button */}
          <button
            onClick={handleCreateFolder}
            className="w-full mt-3 bg-gray-100 dark:bg-awe-midnight-light hover:bg-gray-200 dark:hover:bg-awe-midnight-light/80 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 border border-gray-200 dark:border-awe-midnight font-medium"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-sm">New Folder</span>
          </button>
          
          {/* Model Selector */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">AI Model</p>
            <ModelSelector />
          </div>
        </div>

        {/* Folders and Conversations */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {/* Folders */}
            {folders.map((folder) => (
              <div key={folder.id}>
                <div
                  className={`group flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-awe-midnight-light/60 transition-all duration-200 ${
                    currentFolder?.id === folder.id
                      ? 'bg-awe-teal/10 border border-awe-teal/30'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="p-1 hover:bg-awe-teal/20 dark:hover:bg-awe-teal/30 rounded transition-all duration-200"
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-4 h-4 text-awe-teal" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-awe-teal" />
                    )}
                  </button>
                  
                  <div
                    className="flex items-center space-x-3 flex-1 min-w-0"
                    onClick={() => selectFolder(folder.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color || '#6b7280' }}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-200 truncate min-w-0" title={folder.name}>
                      {folder.name}
                    </span>
                    <span className="text-xs font-medium bg-gray-200 dark:bg-awe-midnight text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full flex-shrink-0">
                      {getConversationsInFolder(folder.id).length}
                    </span>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-all duration-200 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folder.id);
                      }}
                      className="p-1 text-gray-400 hover:text-awe-teal hover:bg-awe-teal/15 rounded transition-all duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Conversations in folder */}
                {expandedFolders.has(folder.id) && (
                  <div className="space-y-1 ml-6 mt-2">
                    {getConversationsInFolder(folder.id).map(renderConversation)}
                  </div>
                )}
              </div>
            ))}

            {/* Unorganized conversations */}
            {getUnorganizedConversations().length > 0 && (
              <div>
                <div className="flex items-center space-x-3 p-3 text-gray-500 dark:text-gray-400">
                  <Folder className="w-4 h-4" />
                  <span className="text-sm font-medium">Unorganized</span>
                  <span className="text-xs font-medium bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {getUnorganizedConversations().length}
                  </span>
                </div>
                <div className="space-y-1 ml-6">
                  {getUnorganizedConversations().map(renderConversation)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-awe-midnight-light/50">
          <div className="flex items-center justify-between mb-3">
            <button className="p-2 text-gray-500 hover:text-awe-teal hover:bg-awe-teal/15 dark:text-gray-400 dark:hover:text-awe-teal rounded-lg transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
          
          {/* Version info */}
          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Version 1.0 • AWE AI Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Folder Modal */}
      {showFolderModal && (
        <FolderModal
          folderId={editingFolder}
          onClose={() => {
            setShowFolderModal(false);
            setEditingFolder(null);
          }}
        />
      )}
    </>
  );
};