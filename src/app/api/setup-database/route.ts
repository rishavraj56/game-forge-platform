import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET() {
  const client = createClient();
  
  try {
    await client.connect();

    // Create users table
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        avatar_url TEXT,
        bio TEXT,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes
    await client.sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await client.sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await client.sql`CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain)`;

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! Users table created successfully.',
      tables: ['users'],
      indexes: ['idx_users_email', 'idx_users_username', 'idx_users_domain']
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to set up database. Check if tables already exist or if there are permission issues.'
    }, { status: 500 });
  }
}
