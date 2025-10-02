import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);

// Create a mock client for when Supabase is not configured
const createMockClient = (): any => {
  return {
    channel: () => ({
      send: () => Promise.resolve({ error: null }),
      subscribe: () => {},
      unsubscribe: () => Promise.resolve('ok'),
    }),
    removeChannel: () => Promise.resolve('ok'),
    realtime: {
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
      disconnect: () => {},
    },
  };
};

// Initialize clients
let _supabase: SupabaseClient | any = null;
let _supabaseAdmin: SupabaseClient | any = null;

// Lazy initialization
const getSupabase = () => {
  if (_supabase) return _supabase;
  
  if (isSupabaseConfigured) {
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } else {
    _supabase = createMockClient();
  }
  
  return _supabase;
};

const getSupabaseAdmin = () => {
  if (_supabaseAdmin) return _supabaseAdmin;
  
  if (isSupabaseConfigured) {
    _supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } else {
    _supabaseAdmin = createMockClient();
  }
  
  return _supabaseAdmin;
};

// Export clients - will be mock clients if Supabase is not configured
export const supabase = getSupabase();
export const supabaseAdmin = getSupabaseAdmin();

// Helper to check if Supabase is available
export const isSupabaseAvailable = () => isSupabaseConfigured;

// Real-time channel types
export type RealtimeChannel = ReturnType<typeof supabase.channel>;

// Real-time event types
export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new?: T;
  old?: T;
  eventType: string;
}

// Connection status type
export type ConnectionStatus = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';
