const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Try to load .env file if it exists, but don't fail if it doesn't
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default configuration');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'koradius_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '', // No default password for security
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database schema initialization
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS travel_packets (
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('review', 'order', 'system')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(is_active)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_travel_packets_category ON travel_packets(category)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_travel_packets_active ON travel_packets(is_active)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)');

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error.message);
    throw error;
  }
};

// Test database connection and initialize schema
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Server will start but database operations will fail');
  } else {
    console.log('✅ Database connected successfully');
    // Initialize database schema after successful connection
    try {
      await initializeDatabase();
    } catch (initError) {
      console.error('❌ Database initialization failed:', initError.message);
    }
  }
});

// Gallery endpoints
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gallery WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { title, location, category, imageUrl, photographer } = req.body;
    const result = await pool.query(
      'INSERT INTO gallery (title, location, category, image_url, photographer) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, location, category, imageUrl, photographer]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

app.put('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location, category, imageUrl, photographer } = req.body;
    const result = await pool.query(
      'UPDATE gallery SET title = $1, location = $2, category = $3, image_url = $4, photographer = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [title, location, category, imageUrl, photographer, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE gallery SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

// Travel packets endpoints
app.get('/api/travel-packets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM travel_packets WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching travel packets:', error);
    res.status(500).json({ error: 'Failed to fetch travel packets' });
  }
});

app.post('/api/travel-packets', async (req, res) => {
  try {
    const { title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure } = req.body;
    const result = await pool.query(
      'INSERT INTO travel_packets (title, location, duration, price, original_price, category, badge, description, includes, available_spots, departure) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating travel packet:', error);
    res.status(500).json({ error: 'Failed to create travel packet' });
  }
});

app.put('/api/travel-packets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure } = req.body;
    const result = await pool.query(
      'UPDATE travel_packets SET title = $1, location = $2, duration = $3, price = $4, original_price = $5, category = $6, badge = $7, description = $8, includes = $9, available_spots = $10, departure = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12 RETURNING *',
      [title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating travel packet:', error);
    res.status(500).json({ error: 'Failed to update travel packet' });
  }
});

app.delete('/api/travel-packets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE travel_packets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    res.json({ message: 'Travel packet deleted successfully' });
  } catch (error) {
    console.error('Error deleting travel packet:', error);
    res.status(500).json({ error: 'Failed to delete travel packet' });
  }
});

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  pool.end();
  process.exit(0);
}); 