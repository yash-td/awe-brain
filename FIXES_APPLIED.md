# Fixes Applied for Supabase Migration Issues

## Issues Found

1. **406 Error** - "Not Acceptable" error when checking if user exists
2. **Foreign Key Constraint Violation** - Trying to insert messages for conversations that don't exist in Supabase

## Root Causes

1. **406 Error**: The `.single()` method in Supabase returns a 406 error when no rows are found, instead of returning null
2. **Foreign Key Error**: Conversations were being created in localStorage before Supabase was initialized, then when messages were sent, the conversation didn't exist in Supabase

## Fixes Applied

### 1. Fixed User Creation (406 Error)

**File**: `src/services/supabaseService.ts`

**Change**: Replaced `.single()` with `.maybeSingle()` in the `createOrUpdateUser` function

```typescript
// Before:
const { data: existingUser, error: fetchError } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_user_id', clerkUserId)
  .single();  // ❌ Returns 406 if no rows found

// After:
const { data: existingUser, error: fetchError } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_user_id', clerkUserId)
  .maybeSingle();  // ✅ Returns null if no rows found
```

### 2. Added Custom ID Support for Conversations

**File**: `src/services/supabaseService.ts`

**Change**: Updated `createConversation` to accept an optional `conversationId` parameter

```typescript
async createConversation(
  userId: string,
  title: string,
  folderId?: string,
  conversationId?: string  // ✅ New parameter
): Promise<Conversation>
```

This allows preserving conversation IDs when syncing from localStorage to Supabase.

### 3. Added Automatic Sync from localStorage to Supabase

**File**: `src/contexts/ChatContext.tsx`

**Change**: Added a new `useEffect` hook that automatically syncs localStorage conversations to Supabase when Supabase becomes ready

```typescript
// Sync localStorage data to Supabase when Supabase becomes ready
useEffect(() => {
  const syncLocalStorageToSupabase = async () => {
    if (!isLocalApiReady || !user?.id) return;

    const localConversations = storageService.loadConversations(user.id);

    if (localConversations.length > 0) {
      for (const conv of localConversations) {
        const existingConvs = await supabaseService.getConversations(user.id);
        const exists = existingConvs.some(c => c.id === conv.id);

        if (!exists) {
          // Create conversation with the same ID
          await supabaseService.createConversation(
            user.id,
            conv.title,
            conv.folderId,
            conv.id  // ✅ Preserve ID
          );
        }
      }
    }
  };

  syncLocalStorageToSupabase();
}, [isLocalApiReady, user?.id]);
```

### 4. Added Safety Check Before Sending Messages

**File**: `src/contexts/ChatContext.tsx`

**Change**: Added a check in `sendMessage` to ensure the conversation exists in Supabase before trying to add messages

```typescript
// Ensure conversation exists in Supabase before saving messages
if (isLocalApiReady && user) {
  try {
    // Check if conversation exists
    const existingConvs = await supabaseService.getConversations(user.id);
    const conversationExists = existingConvs.some(c => c.id === currentConversation.id);

    if (!conversationExists) {
      // Create conversation with the same ID
      await supabaseService.createConversation(
        user.id,
        currentConversation.title,
        currentConversation.folderId,
        currentConversation.id  // ✅ Preserve ID
      );
    }

    // Now safe to save the message
    savedUserMessage = await supabaseService.addMessage(...);
  } catch (error) {
    // Handle error...
  }
}
```

## How It Works Now

1. **On App Load**:
   - Supabase initializes
   - User is created/updated in Supabase
   - Any existing localStorage conversations are automatically synced to Supabase

2. **When Creating Conversations**:
   - If Supabase is ready: conversation is created in Supabase
   - If Supabase is not ready yet: conversation is saved to localStorage and will be synced later

3. **When Sending Messages**:
   - Before saving a message, the app checks if the conversation exists in Supabase
   - If not, it creates the conversation first (preserving the ID)
   - Then saves the message
   - This prevents foreign key constraint violations

## Testing Steps

1. Clear your browser's localStorage and Supabase data
2. Refresh the app
3. Sign in with Clerk
4. Create a new folder (should work without errors)
5. Create a new conversation
6. Send a message
7. Check the browser console - you should see:
   - "Supabase is connected"
   - "Successfully created conversation in Supabase" (if needed)
   - No 406 or foreign key errors
8. Check Supabase Table Editor to verify data is saved

## Expected Console Output

```
✅ Supabase configured
✅ Initializing Supabase for user: user_xxx
✅ Supabase is connected
✅ Loading data from Supabase...
✅ Creating new conversation for user: user_xxx
✅ Successfully saved conversation to Supabase
✅ (When sending first message to old conversation) Conversation not found in Supabase, creating it...
✅ Successfully created conversation in Supabase
```

## Benefits

- ✅ No more 406 errors when checking users
- ✅ No more foreign key constraint violations
- ✅ Seamless sync from localStorage to Supabase
- ✅ Conversations created before Supabase initializes are automatically synced
- ✅ Robust error handling with fallback to localStorage
