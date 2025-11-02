import React from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { User, LogIn } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isDarkMode } = useTheme();
  const { user } = useUser();

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/50 dark:from-awe-midnight dark:via-awe-midnight-light dark:to-awe-midnight flex items-center justify-center p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-awe-teal/10 to-blue-500/5 dark:from-awe-teal/20 dark:to-blue-500/10 rounded-full blur-3xl floating-animation"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/5 to-awe-teal/10 dark:from-purple-500/10 dark:to-awe-teal/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-awe-teal/5 via-transparent to-transparent dark:from-awe-teal/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Top Right Controls */}
          <div className="absolute top-8 right-8 flex items-center space-x-6 z-10">
            <img
              src="/assets/awe-logo.svg"
              alt="AWE Logo"
              className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105"
            />
            <ThemeToggle />
          </div>
          
          <div className="premium-card premium-shadow-xl p-12 w-full max-w-xl relative z-10 hover-lift">
            {/* Premium gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-awe-teal/30 via-purple-500/20 to-awe-teal/30 p-[2px] opacity-60">
              <div className="rounded-2xl bg-white dark:bg-awe-midnight-light h-full w-full"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-28 h-28 mb-8 bg-gradient-to-br from-awe-teal/15 to-purple-500/10 dark:from-awe-teal/25 dark:to-purple-500/15 rounded-3xl premium-shadow glow-effect">
                  <img
                    src="/assets/awe-logo.svg"
                    alt="AWE Logo"
                    className="w-18 h-18 object-contain"
                  />
                </div>
                <h1 className="movar-heading text-4xl mb-4 text-gray-900 dark:text-white">
                  AWE Brain
                </h1>
                <p className="movar-subheading text-xl mb-10 leading-relaxed text-gray-700 dark:text-gray-300">
                  Together, delivering solutions for a safe and secure future
                </p>
              </div>

              <SignInButton mode="modal">
                <button className="premium-button w-full py-5 px-8 text-lg flex items-center justify-center space-x-4">
                  <LogIn className="w-6 h-6" />
                  <span className="movar-body font-semibold">Sign In to Continue</span>
                </button>
              </SignInButton>

              <div className="mt-10 text-center">
                <div className="flex items-center justify-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse glow-effect"></div>
                    <span className="movar-body text-sm font-medium text-gray-600 dark:text-gray-300">Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse glow-effect" style={{ animationDelay: '0.5s' }}></div>
                    <span className="movar-body text-sm font-medium text-gray-600 dark:text-gray-300">Intelligent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full animate-pulse glow-effect" style={{ animationDelay: '1s' }}></div>
                    <span className="movar-body text-sm font-medium text-gray-600 dark:text-gray-300">Powerful</span>
                  </div>
                </div>
                <p className="movar-body text-sm text-gray-500 dark:text-gray-400">
                  Powered by advanced AI technology
                </p>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
};