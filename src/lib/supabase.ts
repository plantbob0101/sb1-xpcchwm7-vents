import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          if (!value) return null;
          
          // For auth sessions, validate the data structure
          if (key.includes('auth.token')) {
            const session = JSON.parse(value);
            const hasValidTokens = session?.access_token && session?.refresh_token;
            const isExpired = session?.expires_at && new Date(session.expires_at) < new Date();
            
            if (!hasValidTokens || isExpired) {
              localStorage.removeItem(key);
              return null;
            }
          }
          
          return value;
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  }
});

// Initialize and maintain auth state
const initializeAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Clear any stale data if no valid session exists
      localStorage.clear();
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED' || event === 'TOKEN_REFRESHED') {
        // Clear local storage on sign out or user deletion
        localStorage.clear();
      }
      
      if (event === 'SIGNED_IN') {
        // Ensure we have a valid session after sign in
        supabase.auth.getSession();
      }
    });

    return () => subscription.unsubscribe();
  } catch (error) {
    console.error('Error initializing auth:', error);
    localStorage.clear();
  }
};

// Initialize auth immediately
initializeAuth().catch(console.error);

// Export a function to handle auth errors and retry
export const handleAuthError = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // If no session, clear storage and redirect to sign in
      localStorage.clear();
      window.location.reload();
    }
  } catch (error) {
    console.error('Auth error:', error);
    localStorage.clear();
    window.location.reload();
  }
};