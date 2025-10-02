import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  applied_at?: Date;
}

// Create migrations table if it doesn't exist
export async function createMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}

// Get list of applied migrations
export async function getAppliedMigrations(): Promise<string[]> {
  try {
    const result = await sql`
      SELECT id FROM migrations ORDER BY applied_at ASC
    `;
    return result.rows.map(row => row.id);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    return [];
  }
}

// Apply a single migration
export async function applyMigration(migration: Migration): Promise<void> {
  try {
    // Execute the migration SQL
    await sql.query(migration.sql);
    
    // Record the migration as applied
    await sql`
      INSERT INTO migrations (id, name, applied_at)
      VALUES (${migration.id}, ${migration.name}, NOW())
    `;
    
    console.log(`✅ Applied migration: ${migration.name}`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${migration.name}:`, error);
    throw error;
  }
}

// Run all pending migrations
export async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Ensure migrations table exists
    await createMigrationsTable();
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📋 Found ${appliedMigrations.length} applied migrations`);
    
    // Define available migrations
    const migrations: Migration[] = [
      {
        id: '001_initial_schema',
        name: 'Initial database schema',
        sql: readFileSync(join(process.cwd(), 'src/lib/schema.sql'), 'utf-8')
      },
      {
        id: '002_seed_data',
        name: 'Seed initial data',
        sql: readFileSync(join(process.cwd(), 'src/lib/seed.sql'), 'utf-8')
      }
    ];
    
    // Apply pending migrations
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    console.log(`📦 Applying ${pendingMigrations.length} pending migrations...`);
    
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Reset database (for development only)
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }
  
  console.log('🔄 Resetting database...');
  
  try {
    // Drop all tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS activities CASCADE`;
    await sql`DROP TABLE IF EXISTS notifications CASCADE`;
    await sql`DROP TABLE IF EXISTS event_registrations CASCADE`;
    await sql`DROP TABLE IF EXISTS events CASCADE`;
    await sql`DROP TABLE IF EXISTS mentorship_relationships CASCADE`;
    await sql`DROP TABLE IF EXISTS mentorship_programs CASCADE`;
    await sql`DROP TABLE IF EXISTS user_module_progress CASCADE`;
    await sql`DROP TABLE IF EXISTS learning_modules CASCADE`;
    await sql`DROP TABLE IF EXISTS comments CASCADE`;
    await sql`DROP TABLE IF EXISTS post_reactions CASCADE`;
    await sql`DROP TABLE IF EXISTS posts CASCADE`;
    await sql`DROP TABLE IF EXISTS channel_members CASCADE`;
    await sql`DROP TABLE IF EXISTS channels CASCADE`;
    await sql`DROP TABLE IF EXISTS user_titles CASCADE`;
    await sql`DROP TABLE IF EXISTS titles CASCADE`;
    await sql`DROP TABLE IF EXISTS user_badges CASCADE`;
    await sql`DROP TABLE IF EXISTS badges CASCADE`;
    await sql`DROP TABLE IF EXISTS user_quest_progress CASCADE`;
    await sql`DROP TABLE IF EXISTS quests CASCADE`;
    await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS migrations CASCADE`;
    
    console.log('🗑️ All tables dropped');
    
    // Run migrations to recreate everything
    await runMigrations();
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    throw error;
  }
}

// Check migration status
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
  total: number;
}> {
  const appliedMigrations = await getAppliedMigrations();
  
  const allMigrations = [
    '001_initial_schema',
    '002_seed_data'
  ];
  
  const pendingMigrations = allMigrations.filter(
    id => !appliedMigrations.includes(id)
  );
  
  return {
    applied: appliedMigrations,
    pending: pendingMigrations,
    total: allMigrations.length
  };
}