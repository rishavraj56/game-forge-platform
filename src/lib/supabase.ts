import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client (for real-time subscriptions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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