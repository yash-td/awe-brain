import React, { useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Database, Brain, Menu, X } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DocumentManager } from './DocumentManager';
import { WelcomeScreen } from './WelcomeScreen';

export const ChatInterface: React.FC = () => {
  const { currentConversation, currentFolder, createNewConversation, ragMode, setRagMode, conversations } = useChat();
  const { user } = useUser();
  const [showDocumentManager, setShowDocumentManager] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Don't automatically create conversations - show welcome screen instead

  if (showDocumentManager) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-awe-midnight dark:via-awe-midnight-light dark:to-awe-midnight relative overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col relative z-10">
          {/* Header */}
          <div className="bg-white/95 dark:bg-awe-midnight/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-awe-midnight-light/50 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 md:space-x-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-awe-midnight-light rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDocumentManager(false)}
                className="text-sm font-medium text-awe-teal hover:text-awe-teal/80 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                Expand Knowledge
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:flex items-center space-x-3 bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200/50 dark:border-awe-midnight/50 shadow-sm">
                <div className="text-right">
                  <p className="text-sm font-medium text-awe-midnight dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 shadow-md"
                    }
                  }}
                />
              </div>
              <div className="sm:hidden">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 shadow-md"
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DocumentManager />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-awe-midnight dark:via-awe-midnight-light dark:to-awe-midnight relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-awe-teal/5 to-purple-500/5 dark:from-awe-teal/10 dark:to-purple-500/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/5 to-awe-teal/5 dark:from-blue-500/10 dark:to-awe-teal/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '3s' }}></div>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="bg-white/95 dark:bg-awe-midnight/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-awe-midnight-light/50 p-3 md:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-6 overflow-x-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-awe-midnight-light rounded-lg transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            {currentFolder && (
              <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentFolder.color || '#6b7280' }}
                />
                <span className="font-semibold whitespace-nowrap">{currentFolder.name}</span>
                <span className="text-gray-400">/</span>
              </div>
            )}
            <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white truncate">
              {currentConversation?.title || 'New Chat'}
            </h1>
            {currentFolder?.systemPrompt && (
              <div className="hidden md:flex text-xs font-medium bg-awe-teal/10 text-awe-teal px-3 py-1.5 rounded-full border border-awe-teal/30 whitespace-nowrap">
                System Prompt Active
              </div>
            )}
            {ragMode && (
              <div className="hidden md:flex items-center space-x-2 text-xs font-medium bg-gradient-to-r from-awe-teal/10 to-blue-600/10 text-awe-teal px-3 py-1.5 rounded-full border border-awe-teal/30 whitespace-nowrap">
                <Brain className="w-3 h-3" />
                <span>Knowledge Search Active</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            <button
              onClick={() => {
                const newMode = !ragMode;
                console.log(`🔄 Toggling RAG mode: ${ragMode} → ${newMode}`);
                setRagMode(newMode);
              }}
              className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                ragMode
                  ? 'bg-gradient-to-r from-awe-teal to-blue-600 text-white'
                  : 'bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-awe-midnight-light'
              }`}
              title={ragMode ? 'Knowledge Search ON' : 'Knowledge Search OFF'}
            >
              <Brain className={`w-4 h-4 ${ragMode ? 'text-white' : 'text-awe-teal'}`} />
              <span className="hidden sm:inline text-sm font-medium">
                {ragMode ? 'Knowledge: ON' : 'Knowledge: OFF'}
              </span>
            </button>
            <button
              onClick={() => setShowDocumentManager(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-lg hover:bg-gray-100 dark:hover:bg-awe-midnight-light transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Database className="w-4 h-4 text-awe-teal" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                Expand Knowledge
              </span>
            </button>
            <button
              onClick={() => setShowDocumentManager(true)}
              className="sm:hidden p-2 bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-lg hover:bg-gray-100 dark:hover:bg-awe-midnight-light transition-all duration-200"
              title="Expand Knowledge"
            >
              <Database className="w-4 h-4 text-awe-teal" />
            </button>
            <div className="hidden sm:flex items-center space-x-3 bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200/50 dark:border-awe-midnight/50 shadow-sm">
              <div className="text-right">
                <p className="text-sm font-medium text-awe-midnight dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 shadow-md"
                  }
                }}
              />
            </div>
            <div className="sm:hidden">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 shadow-md"
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Show Welcome Screen or Messages */}
        {!currentConversation || conversations.length === 0 ? (
          <WelcomeScreen onCreateChat={() => createNewConversation(currentFolder?.id)} />
        ) : (
          <>
            {/* Messages */}
            <MessageList />

            {/* Input */}
            <ChatInput />
          </>
        )}
      </div>
    </div>
  );
};