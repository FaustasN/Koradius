// Database service for PostgreSQL integration
// This file contains the database connection and utility functions

import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// Default database configuration
export const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mydatabase',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  ssl: process.env.NODE_ENV === 'production'
};

// Database connection pool
let pool: Pool | null = null;

export const initializeDatabase = async (config: DatabaseConfig = defaultConfig) => {
  try {
    console.log('Initializing database connection...', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });
    
    // Create a new connection pool
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
    
    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection established successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const getDatabasePool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};

// Utility functions for common database operations
export const executeQuery = async (query: string, params?: any[]): Promise<any[]> => {
  const db = getDatabasePool();
  try {
    const result: QueryResult = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const executeTransaction = async (queries: { text: string; params?: any[] }[]): Promise<any[][]> => {
  const db = getDatabasePool();
  const client: PoolClient = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const query of queries) {
      const result: QueryResult = await client.query(query.text, query.params);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Database schema creation (for initial setup)
export const createTables = async () => {
  const queries = [
    // Gallery table
    `CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image_url TEXT NOT NULL,
      photographer VARCHAR(255) NOT NULL,
      date DATE DEFAULT CURRENT_DATE,
      likes INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Travel packets table
    `CREATE TABLE IF NOT EXISTS travel_packets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      duration VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      rating DECIMAL(3,2) DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      image_url TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      badge VARCHAR(100),
      description TEXT,
      includes TEXT[],
      available_spots INTEGER DEFAULT 0,
      departure DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL CHECK (type IN ('review', 'order', 'system')),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT false,
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Reviews table
    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      location VARCHAR(255),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      text TEXT NOT NULL,
      trip VARCHAR(255),
      image_url TEXT,
      date DATE DEFAULT CURRENT_DATE,
      category VARCHAR(100),
      helpful INTEGER DEFAULT 0,
      verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      travel_packet_id INTEGER REFERENCES travel_packets(id),
      participants INTEGER DEFAULT 1,
      total_price DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      special_requests TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  try {
    await executeTransaction(queries.map(query => ({ text: query })));
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

// Index creation for better performance
export const createIndexes = async () => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)',
    'CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_travel_packets_category ON travel_packets(category)',
    'CREATE INDEX IF NOT EXISTS idx_travel_packets_active ON travel_packets(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews(category)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)'
  ];
  
  try {
    await executeTransaction(indexes.map(index => ({ text: index })));
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
};

// Database initialization function
export const initializeDatabaseSchema = async () => {
  try {
    await createTables();
    await createIndexes();
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

export default {
  initializeDatabase,
  getDatabasePool,
  closeDatabase,
  executeQuery,
  executeTransaction,
  createTables,
  createIndexes,
  initializeDatabaseSchema
}; 