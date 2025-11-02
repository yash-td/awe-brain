import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-awe-midnight-light border border-gray-200 dark:border-awe-midnight hover:bg-gray-200 dark:hover:bg-awe-midnight-light/80 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-awe-teal" />
      ) : (
        <Moon className="w-5 h-5 text-awe-midnight" />
      )}
    </button>
  );
};