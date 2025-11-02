import React, { useState, useRef } from 'react';
import { Send, Paperclip, Database, MessageSquare } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { FileUpload } from './FileUpload';
import { FileAttachment } from '../types';

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    if (isLoading) return;

    await sendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    setShowFileUpload(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleFilesAdded = (files: FileAttachment[]) => {
    setAttachments(files);
  };

  return (
    <div className="border-t border-gray-200/30 dark:border-white/[0.06] p-4 md:p-6 bg-white/80 dark:bg-awe-midnight/80 backdrop-blur-xl">
      {showFileUpload && (
        <div className="mb-4">
          <FileUpload onFilesAdded={handleFilesAdded} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
        <button
          type="button"
          onClick={() => setShowFileUpload(!showFileUpload)}
          className={`p-3 md:p-3.5 rounded-xl border transition-all duration-200 flex-shrink-0 touch-manipulation self-end mb-0.5 ${
            showFileUpload || attachments.length > 0
              ? 'bg-awe-teal/10 border-awe-teal/50 text-awe-teal'
              : 'border-gray-200/50 dark:border-awe-midnight-light/50 text-gray-500 hover:text-awe-teal dark:text-gray-400 dark:hover:text-awe-teal hover:border-awe-teal/50 hover:bg-awe-teal/5'
          }`}
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full px-4 py-3 md:px-5 md:py-3.5 text-sm md:text-base resize-none border-0 rounded-xl bg-white/80 dark:bg-awe-midnight-light/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-awe-teal/30 transition-all duration-200 touch-manipulation shadow-sm"
            rows={1}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || isLoading}
          className={`p-3 md:p-3.5 rounded-xl flex-shrink-0 transition-all duration-200 touch-manipulation self-end mb-0.5 ${
            (!message.trim() && attachments.length === 0) || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-awe-midnight-light dark:text-gray-600'
              : 'bg-gradient-to-r from-awe-teal to-blue-500 hover:from-awe-teal/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl active:scale-95'
          }`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};