interface StorageData {
  conversations: any[];
  folders: any[];
  lastSync: number;
}

class StorageService {
  private readonly STORAGE_VERSION = '1.0';
  private readonly SYNC_INTERVAL = 5000; // 5 seconds

  // Get storage key for user
  private getStorageKey(userId: string, type: 'conversations' | 'folders'): string {
    return `movar_ai_${type}_${userId}_v${this.STORAGE_VERSION}`;
  }

  // Save conversations with error handling and versioning
  saveConversations(userId: string, conversations: any[]): boolean {
    try {
      console.log('Attempting to save conversations for user:', userId, 'Count:', conversations.length);
      const key = this.getStorageKey(userId, 'conversations');
      const data = {
        conversations,
        lastSync: Date.now(),
        version: this.STORAGE_VERSION
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log('Successfully saved conversations to localStorage');
      
      // Also save a backup
      localStorage.setItem(`${key}_backup`, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Failed to save conversations:', error);
      return false;
    }
  }

  // Load conversations with fallback to backup
  loadConversations(userId: string): any[] {
    if (!userId) {
      console.log('No userId provided to loadConversations');
      return [];
    }
    
    try {
      const key = this.getStorageKey(userId, 'conversations');
      let data = localStorage.getItem(key);
      
      console.log('Loading conversations for user:', userId, 'Data found:', !!data);
      
      // Try backup if main storage fails
      if (!data) {
        data = localStorage.getItem(`${key}_backup`);
        console.log('Trying backup, found:', !!data);
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        
        // Handle both old and new format
        if (Array.isArray(parsed)) {
          console.log('Loaded conversations (old format):', parsed.length);
          return parsed; // Old format
        } else if (parsed.conversations) {
          console.log('Loaded conversations (new format):', parsed.conversations.length);
          return parsed.conversations; // New format
        }
      }
      
      console.log('No conversations found, returning empty array');
      return [];
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  // Save folders with error handling and versioning
  saveFolders(userId: string, folders: any[]): boolean {
    try {
      const key = this.getStorageKey(userId, 'folders');
      const data = {
        folders,
        lastSync: Date.now(),
        version: this.STORAGE_VERSION
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also save a backup
      localStorage.setItem(`${key}_backup`, JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('Failed to save folders:', error);
      return false;
    }
  }

  // Load folders with fallback to backup
  loadFolders(userId: string): any[] {
    if (!userId) {
      console.log('No userId provided to loadFolders');
      return [];
    }
    
    try {
      const key = this.getStorageKey(userId, 'folders');
      let data = localStorage.getItem(key);
      
      console.log('Loading folders for user:', userId, 'Data found:', !!data);
      
      // Try backup if main storage fails
      if (!data) {
        data = localStorage.getItem(`${key}_backup`);
        console.log('Trying backup, found:', !!data);
      }
      
      if (data) {
        const parsed = JSON.parse(data);
        
        // Handle both old and new format
        if (Array.isArray(parsed)) {
          console.log('Loaded folders (old format):', parsed.length);
          return parsed; // Old format
        } else if (parsed.folders) {
          console.log('Loaded folders (new format):', parsed.folders.length);
          return parsed.folders; // New format
        }
      }
      
      console.log('No folders found, returning empty array');
      return [];
    } catch (error) {
      console.error('Failed to load folders:', error);
      return [];
    }
  }

  // Clear all data for a user
  clearUserData(userId: string): void {
    try {
      const conversationsKey = this.getStorageKey(userId, 'conversations');
      const foldersKey = this.getStorageKey(userId, 'folders');
      
      localStorage.removeItem(conversationsKey);
      localStorage.removeItem(`${conversationsKey}_backup`);
      localStorage.removeItem(foldersKey);
      localStorage.removeItem(`${foldersKey}_backup`);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Get storage usage info
  getStorageInfo(userId: string): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      const conversationsKey = this.getStorageKey(userId, 'conversations');
      const foldersKey = this.getStorageKey(userId, 'folders');
      
      const conversationsData = localStorage.getItem(conversationsKey);
      const foldersData = localStorage.getItem(foldersKey);
      
      if (conversationsData) used += conversationsData.length;
      if (foldersData) used += foldersData.length;
      
      // Estimate total localStorage capacity (usually 5-10MB)
      const available = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Migrate old data format to new format
  migrateOldData(userId: string): void {
    try {
      // Check for old format data
      const oldConversations = localStorage.getItem(`conversations_${userId}`);
      const oldFolders = localStorage.getItem(`folders_${userId}`);
      
      if (oldConversations) {
        const conversations = JSON.parse(oldConversations);
        this.saveConversations(userId, conversations);
        localStorage.removeItem(`conversations_${userId}`);
      }
      
      if (oldFolders) {
        const folders = JSON.parse(oldFolders);
        this.saveFolders(userId, folders);
        localStorage.removeItem(`folders_${userId}`);
      }
    } catch (error) {
      console.error('Failed to migrate old data:', error);
    }
  }
}

export const storageService = new StorageService();