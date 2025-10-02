import { sql } from '@vercel/postgres';
import { Pool } from 'pg';

// Vercel Postgres connection for serverless functions
export const db = sql;

// Traditional pg Pool for local development and migrations
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

// Database connection test
export async function testConnection(): Promise<boolean> {
  try {
    const result = await db`SELECT 1 as test`;
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Close database connections (useful for cleanup)
export async function closeConnections(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Database error handling
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Query wrapper with error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new DatabaseError('Database query failed', error);
  }
}