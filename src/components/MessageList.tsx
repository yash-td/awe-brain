import React, { useEffect, useRef } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../contexts/ThemeContext';
import { DashboardRenderer } from './DashboardRenderer';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export const MessageList: React.FC = () => {
  const { messages, isLoading } = useChat();
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Filter out system messages from display
  const visibleMessages = messages.filter(message => message.role !== 'system');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isLoading]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex space-x-4 md:space-x-6 px-4 md:px-8 py-6 md:py-8 transition-colors ${
          isUser ? 'bg-transparent' : 'bg-white/20 dark:bg-white/[0.02] hover:bg-white/30 dark:hover:bg-white/[0.04]'
        }`}
      >
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center premium-shadow ${
          isUser
            ? 'premium-gradient text-white glow-effect'
            : 'bg-awe-teal/15 dark:bg-awe-teal/25 glow-effect'
        }`}>
          {isUser ? (
            <User className="w-6 h-6 text-white" />
          ) : (
            <img
              src={isDarkMode ? '/assets/M-Icon-2023-RGB-inverted.png' : '/assets/M-Icon-2023-RGB.png'}
              alt="AWE Assistant"
              className="w-7 h-7 object-contain"
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-3">
            <span className="movar-body text-base font-bold text-awe-midnight dark:text-white">
              {isUser ? 'You' : 'Assistant'}
            </span>
            {message.model && (
              <span className="movar-body text-sm font-semibold text-awe-teal bg-awe-teal/15 dark:bg-awe-teal/25 px-3 py-1.5 rounded-full premium-shadow">
                {message.model}
              </span>
            )}
            <span className="movar-body text-sm text-gray-500 dark:text-gray-400">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-base max-w-none dark:prose-invert">
            {isUser ? (
              <p className="movar-body text-base leading-relaxed text-awe-midnight dark:text-white whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                  input: ({ node, ...props }) => {
                    // Handle task list checkboxes
                    if (props.type === 'checkbox') {
                      return (
                        <input
                          {...props}
                          disabled
                          className="mr-2 cursor-default"
                        />
                      );
                    }
                    return <input {...props} />;
                  },
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={isDarkMode ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: '1rem 0',
                          borderRadius: '0.75rem',
                          fontSize: '0.9rem',
                          padding: '1.25rem',
                          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                          background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)'
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} movar-code bg-gray-100/60 dark:bg-white/[0.06] px-2 py-0.5 rounded text-sm font-medium border border-gray-200/50 dark:border-white/[0.08]`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-6 mt-8 first:mt-0 text-gray-900 dark:text-white border-b border-gray-200/40 dark:border-white/[0.08] pb-3">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-gray-900 dark:text-white border-b border-gray-200/40 dark:border-white/[0.08] pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-white">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-gray-700 dark:text-gray-300">
                      {children}
                    </h6>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0 text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 last:mb-0 list-disc list-outside ml-6 space-y-2 text-base text-gray-900 dark:text-gray-100">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 last:mb-0 list-decimal list-outside ml-6 space-y-2 text-base text-gray-900 dark:text-gray-100">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-1 text-gray-900 dark:text-gray-100">
                      {children}
                    </li>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-lg border border-gray-200/30 dark:border-white/[0.08]">
                      <table className="min-w-full divide-y divide-gray-200/30 dark:divide-white/[0.08]">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-white/[0.03] dark:to-white/[0.05]">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-white/30 dark:bg-white/[0.01] divide-y divide-gray-200/20 dark:divide-white/[0.05]">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-white/50 dark:hover:bg-white/[0.03] transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 pl-4 border-l-3 border-awe-teal/60 bg-awe-teal/5 dark:bg-awe-teal/10 py-3 rounded-r-lg italic text-gray-700 dark:text-gray-300">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="my-8 border-gray-200/40 dark:border-white/[0.08]" />
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900 dark:text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800 dark:text-gray-200">
                      {children}
                    </em>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-awe-teal hover:text-awe-teal-dark dark:text-awe-accent-light dark:hover:text-awe-teal underline transition-colors"
                    >
                      {children}
                    </a>
                  ),
                  del: ({ children }) => (
                    <del className="text-gray-500 dark:text-gray-400 line-through">
                      {children}
                    </del>
                  ),
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto my-4 bg-white/40 dark:bg-white/[0.03] rounded-lg p-4 border border-gray-200/30 dark:border-white/[0.06]">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* File attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-3">
                Attachments
              </p>
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-white/[0.03] hover:bg-white/60 dark:hover:bg-white/[0.06] px-4 py-3 rounded-lg transition-all border border-gray-100/50 dark:border-white/[0.05]"
                >
                  <div className="text-blue-500">
                    {attachment.type.startsWith('image/') ? '🖼️' :
                     attachment.type.includes('pdf') ? '📄' :
                     attachment.type.includes('word') ? '📝' :
                     attachment.type.includes('presentation') ? '📊' :
                     attachment.type.includes('spreadsheet') || attachment.type.includes('csv') || attachment.name.endsWith('.csv') ? '📊' : '📎'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {attachment.name}
                    </p>
                    {attachment.parsedContent?.metadata && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {attachment.parsedContent.metadata.fileType}
                        {attachment.parsedContent.metadata.wordCount > 0 &&
                          ` • ${attachment.parsedContent.metadata.wordCount} words`
                        }
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dashboard Artifact */}
          {message.artifact && (
            <div className="mt-6">
              <DashboardRenderer artifact={message.artifact} />
            </div>
          )}

          {/* Copy button for assistant messages */}
          {!isUser && (
            <button
              onClick={() => copyToClipboard(message.content, message.id)}
              className="mt-4 inline-flex items-center space-x-2 text-xs font-medium text-gray-400 hover:text-awe-teal dark:text-gray-500 dark:hover:text-awe-teal transition-all duration-200 hover:bg-awe-teal/5 dark:hover:bg-awe-teal/10 px-3 py-1.5 rounded-lg"
            >
              {copiedId === message.id ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {visibleMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center p-12 bg-gradient-to-br from-gray-50/50 via-white/50 to-blue-50/30 dark:from-awe-midnight/50 dark:via-awe-midnight-light/50 dark:to-awe-midnight/50 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-awe-teal/5 to-purple-500/5 dark:from-awe-teal/10 dark:to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tr from-blue-500/5 to-awe-teal/5 dark:from-blue-500/10 dark:to-awe-teal/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-xl relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-awe-teal/15 to-purple-500/10 dark:from-awe-teal/25 dark:to-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <img
                src={isDarkMode ? '/assets/M-Icon-2023-RGB-inverted.png' : '/assets/M-Icon-2023-RGB.png'}
                alt="AWE Assistant"
                className="w-11 h-11 object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Start a conversation
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              Ask me anything, upload documents, or request data visualizations to get started
            </p>
            
            {/* Quick action suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask a question</p>
              </div>
              <div className="bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Create a visualization</p>
              </div>
              <div className="bg-white dark:bg-awe-midnight-light p-4 rounded-lg border border-gray-200 dark:border-awe-midnight hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="text-2xl mb-2">📎</div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload documents</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-transparent via-white/5 to-transparent dark:from-transparent dark:via-white/[0.01] dark:to-transparent">
          {visibleMessages.map(renderMessage)}
          {isLoading && (
            <div className="flex space-x-4 md:space-x-6 px-4 md:px-8 py-6 md:py-8 bg-white/20 dark:bg-white/[0.02] message-bubble">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-awe-teal/15 to-purple-500/10 dark:from-awe-teal/25 dark:to-purple-500/15 flex items-center justify-center premium-shadow glow-effect">
                <img
                  src={isDarkMode ? '/assets/M-Icon-2023-RGB-inverted.png' : '/assets/M-Icon-2023-RGB.png'}
                  alt="AWE Assistant"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="movar-body text-base font-bold text-awe-midnight dark:text-white">Assistant</span>
                  <span className="movar-body text-sm font-semibold text-awe-teal bg-awe-teal/15 dark:bg-awe-teal/25 px-3 py-1.5 rounded-full premium-shadow glow-effect">
                    Thinking...
                  </span>
                </div>
                <div className="flex space-x-2 typing-indicator">
                  <div className="w-3 h-3 bg-awe-teal rounded-full animate-bounce glow-effect"></div>
                  <div className="w-3 h-3 bg-awe-teal rounded-full animate-bounce glow-effect" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-awe-teal rounded-full animate-bounce glow-effect" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};