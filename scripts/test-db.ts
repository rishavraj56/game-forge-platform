#!/usr/bin/env tsx

import { testConnection } from '../src/lib/db';
import { getMigrationStatus } from '../src/lib/migrations';

async function testDatabaseSetup() {
  console.log('🧪 Testing Game Forge Database Setup');
  console.log('====================================\n');
  
  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('   ✅ Database connection successful');
    } else {
      console.log('   ❌ Database connection failed');
      return false;
    }
    
    // Test 2: Migration Status
    console.log('\n2. Checking migration status...');
    const migrationStatus = await getMigrationStatus();
    console.log(`   📊 Applied migrations: ${migrationStatus.applied.length}/${migrationStatus.total}`);
    console.log(`   ⏳ Pending migrations: ${migrationStatus.pending.length}`);
    
    if (migrationStatus.pending.length > 0) {
      console.log('   ⚠️  There are pending migrations. Run "npm run migrate:up" to apply them.');
    } else {
      console.log('   ✅ All migrations are up to date');
    }
    
    console.log('\n🎉 Database setup test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up your actual Vercel Postgres database');
    console.log('2. Update your .env.local with real database credentials');
    console.log('3. Run "npm run migrate:up" to set up the schema');
    console.log('4. Test the health endpoint: http://localhost:3000/api/health');
    
    return true;
  } catch (error) {
    console.error('💥 Database setup test failed:', error);
    return false;
  }
}

testDatabaseSetup().then((success) => {
  process.exit(success ? 0 : 1);
});