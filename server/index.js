const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Try to load .env file if it exists, but don't fail if it doesn't
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default configuration');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables for security
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
  Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : 
  crypto.randomBytes(32);
const ENCRYPTION_KEY_STRING = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_IV_LENGTH = 16;

// Encryption utilities for sensitive data
const encrypt = (text) => {
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  try {
    // Try new method first (proper IV handling)
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    try {
      // Fallback to old method for legacy data (uses string key)
      const textParts = text.split(':');
      textParts.shift(); // Remove IV part (not used in createDecipher)
      const encryptedText = textParts.join(':');
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY_STRING);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (fallbackError) {
      console.error('Decryption failed with both methods:', {
        newMethod: error.message,
        oldMethod: fallbackError.message,
        textPreview: text.substring(0, 50) + '...'
      });
      throw new Error('Failed to decrypt data');
    }
  }
};

// JWT middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectoryExists(path.join(__dirname, 'uploads', 'gallery'));
ensureDirectoryExists(path.join(__dirname, 'uploads', 'travel-packets'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.params.type || req.body.uploadType || 'gallery';
    const uploadPath = path.join(__dirname, 'uploads', uploadType);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'koradius_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '', // No default password for security
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Database schema initialization
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database schema...');
    
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table for secure storage
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name_encrypted TEXT NOT NULL,
        email_encrypted TEXT NOT NULL,
        phone_encrypted TEXT,
        subject VARCHAR(255) NOT NULL,
        message_encrypted TEXT NOT NULL,
        preferred_contact VARCHAR(50) DEFAULT 'email',
        urgency VARCHAR(20) DEFAULT 'normal',
        ip_address INET,
        user_agent TEXT,
        is_resolved BOOLEAN DEFAULT false,
        resolved_by INTEGER REFERENCES admins(id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reviews/comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_reviews (
        id SERIAL PRIMARY KEY,
        name_encrypted TEXT NOT NULL,
        email_encrypted TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment_encrypted TEXT NOT NULL,
        trip_reference VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        is_approved BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES admins(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        type VARCHAR(50) NOT NULL CHECK (type IN ('contact', 'review', 'order', 'system')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reference_id INTEGER,
        reference_type VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false,
        read_by INTEGER REFERENCES admins(id),
        read_at TIMESTAMP,
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
    await pool.query('CREATE INDEX IF NOT EXISTS idx_contacts_resolved ON contacts(is_resolved)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_reviews_approved ON user_reviews(is_approved)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active)');

    // Create default admin if none exists
    const adminExists = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminExists.rows[0].count) === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await pool.query(
        'INSERT INTO admins (username, password_hash, email, role) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin@koradius.com', 'admin']
      );
      
      console.log('✅ Default admin account created. Username: admin, Password:', defaultPassword);
    }

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

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get admin from database
    const result = await pool.query(
      'SELECT id, username, password_hash, email, role, is_active FROM admins WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        username: admin.username,
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Verify current password
    const result = await pool.query(
      'SELECT password_hash FROM admins WHERE id = $1',
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, adminId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message, preferredContact, urgency } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    // Encrypt sensitive data
    const nameEncrypted = encrypt(name);
    const emailEncrypted = encrypt(email);
    const phoneEncrypted = phone ? encrypt(phone) : null;
    const messageEncrypted = encrypt(message);

    // Get client IP and user agent for security tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Insert contact into database
    const contactResult = await pool.query(
      `INSERT INTO contacts 
       (name_encrypted, email_encrypted, phone_encrypted, subject, message_encrypted, 
        preferred_contact, urgency, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [nameEncrypted, emailEncrypted, phoneEncrypted, subject, messageEncrypted, 
       preferredContact || 'email', urgency || 'normal', ipAddress, userAgent]
    );

    const contactId = contactResult.rows[0].id;

    // Create notification for admins
    const notificationTitle = `New Contact Message: ${subject}`;
    const notificationMessage = `New contact form submission from ${name}. Subject: ${subject}. Urgency: ${urgency || 'normal'}`;
    
    let priority = 'low';
    if (urgency === 'emergency') {
      priority = 'high';
    } else if (urgency === 'urgent') {
      priority = 'medium';
    }

    await pool.query(
      `INSERT INTO notifications 
       (type, title, message, reference_id, reference_type, priority) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['contact', notificationTitle, notificationMessage, contactId, 'contact', priority]
    );

    res.json({ 
      success: true, 
      message: 'Your message has been sent successfully. We will contact you within 24 hours.',
      contactId 
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Review submission endpoint
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, email, rating, comment, tripReference } = req.body;

    if (!name || !email || !rating || !comment) {
      return res.status(400).json({ error: 'Name, email, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Encrypt sensitive data
    const nameEncrypted = encrypt(name);
    const emailEncrypted = encrypt(email);
    const commentEncrypted = encrypt(comment);

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Insert review into database
    const reviewResult = await pool.query(
      `INSERT INTO user_reviews 
       (name_encrypted, email_encrypted, rating, comment_encrypted, trip_reference, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [nameEncrypted, emailEncrypted, rating, commentEncrypted, tripReference || null, ipAddress, userAgent]
    );

    const reviewId = reviewResult.rows[0].id;

    // Create notification for admins
    const notificationTitle = `New Review: ${rating} Stars`;
    const tripInfo = tripReference ? ` Trip: ${tripReference}` : '';
    const notificationMessage = `New review submitted by ${name}. Rating: ${rating}/5 stars.${tripInfo}`;

    await pool.query(
      `INSERT INTO notifications 
       (type, title, message, reference_id, reference_type, priority) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['review', notificationTitle, notificationMessage, reviewId, 'review', 'medium']
    );

    res.json({ 
      success: true, 
      message: 'Thank you for your review! It will be published after moderation.',
      reviewId 
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// File upload endpoints
app.post('/api/upload/:type', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${PORT}/uploads/${req.params.type}/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete uploaded file endpoint
app.delete('/api/upload/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', type, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
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
    const { title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure, imageUrl } = req.body;
    const result = await pool.query(
      'INSERT INTO travel_packets (title, location, duration, price, original_price, category, badge, description, includes, available_spots, departure, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure, imageUrl]
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
    const { title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure, imageUrl } = req.body;
    const result = await pool.query(
      'UPDATE travel_packets SET title = $1, location = $2, duration = $3, price = $4, original_price = $5, category = $6, badge = $7, description = $8, includes = $9, available_spots = $10, departure = $11, image_url = $12, updated_at = CURRENT_TIMESTAMP WHERE id = $13 RETURNING *',
      [title, location, duration, price, originalPrice, category, badge, description, includes, availableSpots, departure, imageUrl, id]
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

// Admin Dashboard Endpoints (Protected)

// Admin contacts management
app.get('/api/admin/contacts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, subject, preferred_contact, urgency, ip_address, is_resolved, 
             resolved_by, resolved_at, created_at,
             name_encrypted, email_encrypted, phone_encrypted, message_encrypted
      FROM contacts 
      ORDER BY 
        CASE WHEN urgency = 'emergency' THEN 1 
             WHEN urgency = 'urgent' THEN 2 
             ELSE 3 END,
        created_at DESC
    `);

    // Decrypt sensitive data for admin view
    const contacts = result.rows.map(contact => ({
      ...contact,
      name: decrypt(contact.name_encrypted),
      email: decrypt(contact.email_encrypted),
      phone: contact.phone_encrypted ? decrypt(contact.phone_encrypted) : null,
      message: decrypt(contact.message_encrypted),
      // Remove encrypted fields from response
      name_encrypted: undefined,
      email_encrypted: undefined,
      phone_encrypted: undefined,
      message_encrypted: undefined
    }));

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.put('/api/admin/contacts/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    await pool.query(
      'UPDATE contacts SET is_resolved = true, resolved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2',
      [adminId, id]
    );

    res.json({ message: 'Contact marked as resolved' });
  } catch (error) {
    console.error('Error resolving contact:', error);
    res.status(500).json({ error: 'Failed to resolve contact' });
  }
});

// Admin reviews management
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, rating, trip_reference, ip_address, is_approved, is_featured,
             approved_by, approved_at, created_at,
             name_encrypted, email_encrypted, comment_encrypted
      FROM user_reviews 
      ORDER BY created_at DESC
    `);

    // Decrypt sensitive data for admin view
    const reviews = result.rows.map(review => ({
      ...review,
      name: decrypt(review.name_encrypted),
      email: decrypt(review.email_encrypted),
      comment: decrypt(review.comment_encrypted),
      // Remove encrypted fields from response
      name_encrypted: undefined,
      email_encrypted: undefined,
      comment_encrypted: undefined
    }));

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.put('/api/admin/reviews/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const adminId = req.user.id;

    await pool.query(
      'UPDATE user_reviews SET is_approved = true, is_featured = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
      [featured || false, adminId, id]
    );

    res.json({ message: 'Review approved successfully' });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

app.delete('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM user_reviews WHERE id = $1', [id]);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get approved reviews for public display
app.get('/api/reviews/approved', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rating, trip_reference, created_at, is_featured,
             name_encrypted, comment_encrypted
      FROM user_reviews 
      WHERE is_approved = true
      ORDER BY is_featured DESC, created_at DESC
    `);

    // Decrypt only necessary data for public view
    const reviews = result.rows.map(review => ({
      rating: review.rating,
      trip_reference: review.trip_reference,
      created_at: review.created_at,
      is_featured: review.is_featured,
      name: decrypt(review.name_encrypted),
      comment: decrypt(review.comment_encrypted)
    }));

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    res.status(500).json({ error: 'Failed to fetch approved reviews' });
  }
});

// Notifications endpoints (Protected)
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, a.username as read_by_username 
      FROM notifications n 
      LEFT JOIN admins a ON n.read_by = a.id 
      ORDER BY 
        CASE WHEN n.priority = 'high' THEN 1 
             WHEN n.priority = 'medium' THEN 2 
             ELSE 3 END,
        n.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    await pool.query(
      'UPDATE notifications SET is_read = true, read_by = $1, read_at = CURRENT_TIMESTAMP WHERE id = $2',
      [adminId, id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.put('/api/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    await pool.query(
      'UPDATE notifications SET is_read = true, read_by = $1, read_at = CURRENT_TIMESTAMP WHERE is_read = false',
      [adminId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = false');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
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