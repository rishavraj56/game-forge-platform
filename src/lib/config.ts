// Configuration and environment validation for Game Forge Platform

export interface DatabaseConfig {
  url: string;
  prismaUrl?: string;
  urlNoSsl?: string;
  urlNonPooling?: string;
  user?: string;
  host?: string;
  password?: string;
  database?: string;
}

export interface AuthConfig {
  secret: string;
  url: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  auth: AuthConfig;
  supabase: SupabaseConfig;
  email: EmailConfig;
  nodeEnv: string;
}

// Validate required environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get configuration from environment variables
export function getConfig(): AppConfig {
  return {
    database: {
      url: validateEnvVar('POSTGRES_URL', process.env.POSTGRES_URL),
      prismaUrl: process.env.POSTGRES_PRISMA_URL,
      urlNoSsl: process.env.POSTGRES_URL_NO_SSL,
      urlNonPooling: process.env.POSTGRES_URL_NON_POOLING,
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    },
    auth: {
      secret: validateEnvVar('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET),
      url: validateEnvVar('NEXTAUTH_URL', process.env.NEXTAUTH_URL),
    },
    supabase: {
      url: validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKey: validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    email: {
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      user: validateEnvVar('EMAIL_SERVER_USER', process.env.EMAIL_SERVER_USER),
      password: validateEnvVar('EMAIL_SERVER_PASSWORD', process.env.EMAIL_SERVER_PASSWORD),
      from: process.env.EMAIL_FROM || 'noreply@gameforge.dev',
    },
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

// Validate configuration on startup
export function validateConfig(): void {
  try {
    getConfig();
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
}

// Domain constants
export const DOMAINS = [
  'Game Development',
  'Game Design',
  'Game Art',
  'AI for Game Development',
  'Creative',
  'Corporate'
] as const;

// Role constants
export const USER_ROLES = ['member', 'domain_lead', 'admin'] as const;

// Quest type constants
export const QUEST_TYPES = ['daily', 'weekly'] as const;

// Difficulty constants
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

// XP and level constants
export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 100;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'application/zip'
];

// Rate limiting constants
export const RATE_LIMITS = {
  posts: { requests: 10, window: 60 * 1000 }, // 10 posts per minute
  comments: { requests: 20, window: 60 * 1000 }, // 20 comments per minute
  reactions: { requests: 50, window: 60 * 1000 }, // 50 reactions per minute
  api: { requests: 100, window: 60 * 1000 }, // 100 API calls per minute
} as const;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  leaderboard: 300, // 5 minutes
  user_profile: 600, // 10 minutes
  channels: 1800, // 30 minutes
  learning_modules: 3600, // 1 hour
  platform_stats: 900, // 15 minutes
} as const;