import { Pool } from 'pg';
import { execSync } from 'child_process';

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'config_test_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

let testPool: Pool;

// Setup test database
export async function setupTestDatabase() {
  try {
    // Create test database if it doesn't exist
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres',
    });

    await adminPool.query(`CREATE DATABASE ${testDbConfig.database} WITH OWNER ${testDbConfig.user}`);
    await adminPool.end();

    // Connect to test database
    testPool = new Pool(testDbConfig);

    // Run migrations
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await testPool.query(migrationSQL);

    return testPool;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Teardown test database
export async function teardownTestDatabase() {
  if (testPool) {
    await testPool.end();
  }

  try {
    const adminPool = new Pool({
      ...testDbConfig,
      database: 'postgres',
    });

    await adminPool.query(`DROP DATABASE IF EXISTS ${testDbConfig.database}`);
    await adminPool.end();
  } catch (error) {
    console.error('Error tearing down test database:', error);
  }
}

// Clean up tables between tests
export async function cleanTables() {
  if (testPool) {
    await testPool.query('DELETE FROM configurations');
    await testPool.query('DELETE FROM applications');
  }
}

export { testPool };
