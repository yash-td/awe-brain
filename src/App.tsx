import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';
import { AuthWrapper } from './components/AuthWrapper';
import { ChatInterface } from './components/ChatInterface';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_aW50ZW5zZS1yZWluZGVlci02NC5jbGVyay5hY2NvdW50cy5kZXYk';

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ThemeProvider>
        <ChatProvider>
          <AuthWrapper>
            <ChatInterface />
          </AuthWrapper>
        </ChatProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;