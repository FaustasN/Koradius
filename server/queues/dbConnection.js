const { Pool } = require('pg');

// Database connection utility for workers
class DatabaseConnection {
  static getPool() {
    return new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'koradius_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      max: 5, // Maximum number of clients in the pool for workers
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  
  static async executeWithConnection(callback) {
    const pool = this.getPool();
    try {
      return await callback(pool);
    } finally {
      await pool.end();
    }
  }
}

module.exports = DatabaseConnection;
