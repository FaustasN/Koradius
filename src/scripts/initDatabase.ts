// Database initialization script
// This script connects to the PostgreSQL database and sets up the schema

import { initializeDatabase, initializeDatabaseSchema, closeDatabase } from '../services/database';

const initializeDatabaseWithData = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Create schema (tables and indexes)
    await initializeDatabaseSchema();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await closeDatabase();
  }
};

// Run the initialization if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  initializeDatabaseWithData()
    .then(() => {
      console.log('🎉 Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export default initializeDatabaseWithData; 