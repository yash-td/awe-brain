import React from 'react';
import { MessageSquare, FolderOpen, Brain, Database, Sparkles, Zap, Lock, Globe } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateChat: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateChat }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-awe-teal to-awe-accent rounded-2xl mb-4 md:mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
            Welcome to AWE Brain
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Together, delivering solutions for a safe and secure future. Your AI-powered knowledge assistant for exploring AWE's knowledge base.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
          {/* Feature 1 */}
          <div className="bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-awe-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-awe-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Intelligent Conversations
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Engage with advanced AI models to analyze complex technical data and extract actionable insights that support AWE's mission.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-awe-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-awe-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Structured Organization
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create custom folders with unique system prompts. Organize conversations by project, capability, or operational area.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-awe-teal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-awe-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Knowledge Base Search
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable RAG mode to search through AWE's document repository. Access insights grounded in organizational knowledge and capabilities.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-awe-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-awe-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Document Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and analyze technical documents (PDF, DOCX, PPTX). Extract insights and discuss content with AI-powered precision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="bg-gradient-to-r from-awe-teal/5 to-awe-accent/5 dark:from-awe-teal/10 dark:to-awe-accent/10 rounded-xl p-6 border border-awe-teal/20 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 text-awe-teal mr-2" />
            Additional Capabilities
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-awe-teal mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                Defence-grade secure authentication
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <Globe className="w-4 h-4 text-awe-teal mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                Encrypted cloud database
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-awe-teal mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                Advanced AI models (O3 Mini, GPT OSS 120B, O4 Mini)
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center px-4">
          <button
            onClick={onCreateChat}
            className="group inline-flex items-center justify-center space-x-2 md:space-x-3 bg-gradient-to-r from-awe-teal to-awe-accent text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 touch-manipulation active:scale-95 w-full sm:w-auto"
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
            <span>Start Your First Conversation</span>
          </button>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-3 md:mt-4">
            Click the button above or use the "New Chat" button in the sidebar
          </p>
        </div>
      </div>
    </div>
  );
};
