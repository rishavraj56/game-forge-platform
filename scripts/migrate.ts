#!/usr/bin/env tsx

import { runMigrations, resetDatabase, getMigrationStatus, testConnection } from '../src/lib/migrations';
import { testConnection as testDbConnection } from '../src/lib/db';

async function main() {
  const command = process.argv[2];
  
  console.log('🔧 Game Forge Database Migration Tool');
  console.log('=====================================\n');
  
  // Test database connection first
  console.log('🔍 Testing database connection...');
  const isConnected = await testDbConnection();
  
  if (!isConnected) {
    console.error('❌ Database connection failed. Please check your environment variables.');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful\n');
  
  switch (command) {
    case 'up':
    case 'migrate':
      console.log('📦 Running migrations...');
      await runMigrations();
      break;
      
    case 'status':
      console.log('📊 Checking migration status...');
      const status = await getMigrationStatus();
      console.log(`Applied migrations: ${status.applied.length}/${status.total}`);
      console.log(`Pending migrations: ${status.pending.length}`);
      
      if (status.applied.length > 0) {
        console.log('\n✅ Applied:');
        status.applied.forEach(id => console.log(`  - ${id}`));
      }
      
      if (status.pending.length > 0) {
        console.log('\n⏳ Pending:');
        status.pending.forEach(id => console.log(`  - ${id}`));
      }
      break;
      
    case 'reset':
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Database reset is not allowed in production');
        process.exit(1);
      }
      
      console.log('🔄 Resetting database...');
      console.log('⚠️  This will delete all data. Are you sure? (This action cannot be undone)');
      
      // In a real CLI, you'd want to add a confirmation prompt
      await resetDatabase();
      break;
      
    default:
      console.log('Usage: npm run migrate [command]');
      console.log('');
      console.log('Commands:');
      console.log('  up, migrate  Run pending migrations');
      console.log('  status       Show migration status');
      console.log('  reset        Reset database (development only)');
      console.log('');
      console.log('Examples:');
      console.log('  npm run migrate up');
      console.log('  npm run migrate status');
      console.log('  npm run migrate reset');
      break;
  }
}

main().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});