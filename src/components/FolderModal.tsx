import React, { useState, useEffect } from 'react';
import { X, Folder, MessageSquare } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface FolderModalProps {
  folderId?: string | null;
  onClose: () => void;
}

const FOLDER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export const FolderModal: React.FC<FolderModalProps> = ({ folderId, onClose }) => {
  const { folders, createFolder, updateFolder } = useChat();
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  const isEditing = !!folderId;
  const folder = isEditing ? folders.find(f => f.id === folderId) : null;

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSystemPrompt(folder.systemPrompt || '');
      setSelectedColor(folder.color || FOLDER_COLORS[0]);
    }
  }, [folder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && folderId) {
      updateFolder(folderId, {
        name: name.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        color: selectedColor,
      });
    } else {
      createFolder(name.trim(), systemPrompt.trim() || undefined, selectedColor);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-awe-midnight bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-awe-midnight-light rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-awe-midnight my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-awe-midnight">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-awe-teal" />
            <h2 className="movar-heading text-lg text-awe-midnight dark:text-white">
              {isEditing ? 'Edit Folder' : 'Create New Folder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-awe-teal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Folder Name */}
          <div>
            <label className="movar-body block text-sm font-medium text-awe-midnight dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name..."
              className="movar-body w-full p-3 border border-gray-300 dark:border-awe-midnight rounded-lg focus:ring-2 focus:ring-awe-teal focus:border-awe-teal dark:bg-awe-midnight dark:text-white transition-colors"
              required
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="movar-body block text-sm font-medium text-awe-midnight dark:text-gray-300 mb-2">
              Folder Color
            </label>
            <div className="flex space-x-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-awe-teal scale-110 ring-2 ring-awe-teal/30'
                      : 'border-gray-300 dark:border-awe-midnight hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="movar-body block text-sm font-medium text-awe-midnight dark:text-gray-300 mb-2">
              System Prompt (Optional)
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a system prompt that will be applied to all conversations in this folder..."
              rows={4}
              className="movar-body w-full p-3 border border-gray-300 dark:border-awe-midnight rounded-lg focus:ring-2 focus:ring-awe-teal focus:border-awe-teal dark:bg-awe-midnight dark:text-white resize-none transition-colors"
            />
            <p className="movar-body text-xs text-gray-500 dark:text-gray-400 mt-1">
              This prompt will be automatically added to the beginning of every new conversation in this folder.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="movar-body flex-1 py-2 px-4 border border-awe-teal text-awe-teal rounded-lg hover:bg-awe-teal/10 dark:hover:bg-awe-teal/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="movar-body flex-1 py-2 px-4 bg-awe-teal text-white rounded-lg hover:bg-awe-teal-dark transition-colors font-medium"
            >
              {isEditing ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};