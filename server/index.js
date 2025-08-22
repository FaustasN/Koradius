const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const axios = require('axios');
const paymentRoutes = require('./paymentRoutes');

// Initialize queue system
const { queueEmail, emailQueue } = require('./queues/emailQueue');
const { queueFileOperation, fileQueue } = require('./queues/fileQueue');
const { queueNotification, notificationQueue } = require('./queues/notificationQueue');
const queueManager = require('./queues/manager');

// Logging system
const LoggingService = require('./services/logging/LoggingService');
const LoggingMiddleware = require('./services/logging/LoggingMiddleware');

// System monitoring
const SystemMonitor = require('./services/monitoring/SystemMonitor');
const BackendHealthMonitor = require('./services/monitoring/BackendHealthMonitor');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Try to load .env file if it exists, but don't fail if it doesn't
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default configuration');
}

const app = express();
const PORT = process.env.PORT || 3001;
const INSTANCE_ID = process.env.INSTANCE_ID || 'backend-main';

// Queue system initialization
console.log(`🔄 Initializing queue system for instance: ${INSTANCE_ID}...`);

// Initialize all queue workers
const { emailWorker } = require('./queues/emailQueue');
const { fileWorker } = require('./queues/fileQueue'); 
const { notificationWorker } = require('./queues/notificationQueue');
const LoggingQueueWorker = require('./queues/loggingQueue');
const { databaseWorker, queueDatabaseOperation } = require('./queues/databaseQueue');
const { analyticsWorker, queueAnalyticsOperation } = require('./queues/analyticsQueue');
const { monitoringWorker, queueMonitoringOperation } = require('./queues/monitoringQueue');
const { loggingQueue } = require('./queues/config');

console.log(`✅ Queue workers initialized: email, file, notification, logging, database, analytics, monitoring`);

// Initialize system monitoring
console.log(`📊 Initializing system monitoring for instance: ${INSTANCE_ID}...`);
const systemMonitor = new SystemMonitor();
console.log(`✅ System monitoring initialized`);

// Initialize backend health monitoring
console.log(`🏥 Initializing backend health monitoring...`);
const backendHealthMonitor = new BackendHealthMonitor();

// Set up notification callbacks for backend health events
backendHealthMonitor.setNotificationCallbacks({
  onBackendDown: async (backend, details) => {
    console.log('🚨 Backend down callback triggered:', backend.name);
    const message = `Backend ${backend.name} (${backend.id}) is DOWN. Error: ${details.error}. Last seen: ${backend.lastSeen}`;
    
    console.error(`🚨 CRITICAL: ${message}`);
    
    // Log to audit trail
    console.log('📝 Logging to audit trail...', !!loggingService);
    if (loggingService) {
      try {
        await loggingService.getApplicationLogger().error('Backend health critical: Backend instance down', {
          backendId: backend.id,
          backendName: backend.name,
          error: details.error,
          consecutiveFailures: details.consecutiveFailures,
          lastSeen: backend.lastSeen,
          eventType: 'backend_down',
          severity: 'critical',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Audit log created successfully');
      } catch (auditError) {
        console.error('❌ Error creating audit log:', auditError.message);
      }
    }
    
    // Create admin notification
    console.log('🔔 Starting notification creation process...');
    try {
      console.log('🔔 Creating backend down notification...');
      const result = await pool.query(
        'INSERT INTO notifications (type, title, message, priority, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [
          'system',
          'Backend Server Down',
          message,
          'high'
        ]
      );
      console.log('✅ Backend down notification created successfully:', result.rowCount);
    } catch (error) {
      console.error('❌ Error creating backend down notification:', error.message);
      console.error('Full error:', error);
    }
    console.log('🔔 Notification creation process finished');
  },
  
  onBackendRecovered: async (backend, details) => {
    const downtime = details.downtime ? `${Math.round(details.downtime / 1000)}s` : 'unknown';
    const message = `Backend ${backend.name} (${backend.id}) has RECOVERED after ${downtime} downtime. Response time: ${details.responseTime}ms`;
    
    console.log(`✅ RECOVERY: ${message}`);
    
    // Log to audit trail
    if (loggingService) {
      try {
        await loggingService.getApplicationLogger().info('Backend health recovered: Backend instance restored', {
          backendId: backend.id,
          backendName: backend.name,
          downtime: details.downtime,
          responseTime: details.responseTime,
          previousStatus: details.previousStatus,
          eventType: 'backend_recovered',
          severity: 'info',
          timestamp: new Date().toISOString()
        });
      } catch (auditError) {
        console.error('❌ Error creating recovery audit log:', auditError.message);
      }
    }
    
    // Create admin notification
    try {
      console.log('🔔 Creating backend recovery notification...');
      const result = await pool.query(
        'INSERT INTO notifications (type, title, message, priority, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [
          'system',
          'Backend Server Recovered',
          message,
          'medium'
        ]
      );
      console.log('✅ Backend recovery notification created successfully:', result.rowCount);
    } catch (error) {
      console.error('❌ Error creating backend recovery notification:', error.message);
      console.error('Full error:', error);
    }
  },
  
  onBackendUp: async (backend) => {
    console.log(`🟢 Backend ${backend.name} (${backend.id}) is operational`);
    
    // Log initial startup
    if (loggingService) {
      const auditLogger = loggingService.getAuditLogger();
      await auditLogger.logAdminOperation(
        null,
        'backend_started',
        'system',
        {
          backendId: backend.id,
          backendName: backend.name,
          responseTime: backend.responseTime
        }
      );
    }
  }
});

// Start backend health monitoring
backendHealthMonitor.startMonitoring();
console.log(`✅ Backend health monitoring initialized and started`);

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
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Payment routes
app.use('/api/payment', paymentRoutes);

// Add logging middleware after basic setup
app.use((req, res, next) => {
  if (loggingMiddleware) {
    loggingMiddleware.requestLogger()(req, res, next);
  } else {
    next();
  }
});

// Add auth logging middleware
app.use((req, res, next) => {
  if (loggingMiddleware) {
    loggingMiddleware.authLogger()(req, res, next);
  } else {
    next();
  }
});

// Add rate limit logging middleware
app.use((req, res, next) => {
  if (loggingMiddleware) {
    loggingMiddleware.rateLimitLogger()(req, res, next);
  } else {
    next();
  }
});

// Simple queue API endpoint for our custom dashboard
app.get('/api/queue-status', authenticateToken, async (req, res) => {
  try {
    const queueStats = {
      email: {
        waiting: await emailQueue.getWaiting().then(jobs => jobs.length),
        active: await emailQueue.getActive().then(jobs => jobs.length),
        completed: await emailQueue.getCompleted().then(jobs => jobs.length),
        failed: await emailQueue.getFailed().then(jobs => jobs.length)
      },
      file: {
        waiting: await fileQueue.getWaiting().then(jobs => jobs.length),
        active: await fileQueue.getActive().then(jobs => jobs.length),
        completed: await fileQueue.getCompleted().then(jobs => jobs.length),
        failed: await fileQueue.getFailed().then(jobs => jobs.length)
      },
      notification: {
        waiting: await notificationQueue.getWaiting().then(jobs => jobs.length),
        active: await notificationQueue.getActive().then(jobs => jobs.length),
        completed: await notificationQueue.getCompleted().then(jobs => jobs.length),
        failed: await notificationQueue.getFailed().then(jobs => jobs.length)
      }
    };
    
    res.json({ success: true, queues: queueStats });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Email endpoint - now using queue
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, priority = 'normal' } = req.body;
    
    // Add email to queue instead of sending directly
    const job = await queueEmail({
      to,
      subject,
      text,
      html
    }, { priority });
    
    res.json({ 
      success: true, 
      message: 'Laiškas sėkmingai įtrauktas į eilę!',
      jobId: job.id 
    });
  } catch (error) {
    console.error('Email queueing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'koradius_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '', // No default password for security
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Initialize logging system
let loggingService;
let loggingMiddleware;
let loggingQueueWorker;

// This will be initialized after database connection is established
const initializeLogging = async () => {
  // Initialize logging queue worker first
  loggingQueueWorker = new LoggingQueueWorker(pool);
  await loggingQueueWorker.start();
  
  // Initialize logging service with queue
  loggingService = new LoggingService(pool, loggingQueue);
  loggingMiddleware = new LoggingMiddleware(loggingService);
  
  console.log('✅ Logging system initialized with queue worker');
};

// Initialize scheduled jobs for maintenance and monitoring
const LogCleanupScheduler = require('./services/logCleanupScheduler');
let logCleanupScheduler = null;

const initializeScheduledJobs = async () => {
  console.log('🔄 Initializing automated maintenance jobs...');
  
  try {
    // Initialize log cleanup scheduler with the queue function
    logCleanupScheduler = new LogCleanupScheduler(queueDatabaseOperation);
    
    // Set the logging service if available
    if (loggingService) {
      logCleanupScheduler.setLoggingService(loggingService);
    }
    
    logCleanupScheduler.start();
    
    console.log('✅ Automated maintenance jobs initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize scheduled jobs:', error.message);
    console.error('Error details:', error);
  }
};

// Helper function to calculate delay to specific time today
function getDelayToTime(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  
  // If target time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// Helper function to calculate delay to specific weekly time
function getDelayToWeeklyTime(dayOfWeek, hour, minute) {
  const now = new Date();
  const target = new Date();
  
  // Set to target day of week (0 = Sunday, 1 = Monday, etc.)
  const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + daysUntilTarget);
  target.setHours(hour, minute, 0, 0);
  
  // If target time has passed this week, schedule for next week
  if (target <= now) {
    target.setDate(target.getDate() + 7);
  }
  
  return target.getTime() - now.getTime();
}

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

    // Create logs table for central logging system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
        message TEXT NOT NULL,
        log_type VARCHAR(50) NOT NULL CHECK (log_type IN ('application', 'audit')),
        instance_id VARCHAR(100) NOT NULL,
        metadata JSONB,
        trace_id UUID,
        span_id UUID,
        user_id INTEGER REFERENCES admins(id),
        ip_address INET,
        user_agent TEXT,
        request_id UUID,
        session_id VARCHAR(255),
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
    
    // Create indexes for logs table
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(log_type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_instance ON logs(instance_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_trace ON logs(trace_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_request ON logs(request_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_compound ON logs(log_type, level, timestamp)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_logs_metadata ON logs USING GIN(metadata)');

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

// Test database connection and initialize schema with retry logic
const initializeDatabaseWithRetry = async (maxRetries = 10, delay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting database connection (${attempt}/${maxRetries})...`);
      
      // Test database connection
      await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
      
      // Initialize database schema after successful connection
      await initializeDatabase();
      
      // Initialize logging system after database schema is ready
      await initializeLogging();
      
      // Initialize scheduled jobs for maintenance and monitoring
      await initializeScheduledJobs();
      
      console.log('✅ All systems initialized successfully');
      return;
      
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ Max retries reached. Database initialization failed.');
        console.log('⚠️  Server will start but database operations will fail');
        return;
      }
      
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Start database initialization with retry
initializeDatabaseWithRetry();

// Authentication endpoints
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      if (loggingService) {
        await loggingService.getAuditLogger().logLoginAttempt(
          username || 'unknown',
          false,
          req.ip,
          req.get('User-Agent'),
          { error: 'Missing credentials' },
          req.trace
        );
      }
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get admin from database
    const result = await pool.query(
      'SELECT id, username, password_hash, email, role, is_active FROM admins WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      if (loggingService) {
        await loggingService.getAuditLogger().logLoginAttempt(
          username,
          false,
          req.ip,
          req.get('User-Agent'),
          { error: 'User not found' },
          req.trace
        );
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      if (loggingService) {
        await loggingService.getAuditLogger().logLoginAttempt(
          username,
          false,
          req.ip,
          req.get('User-Agent'),
          { error: 'Invalid password', userId: admin.id },
          req.trace
        );
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    // Log successful login
    if (loggingService) {
      await loggingService.getAuditLogger().logLoginAttempt(
        username,
        true,
        req.ip,
        req.get('User-Agent'),
        { userId: admin.id, role: admin.role },
        req.trace
      );
    }

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
    
    if (loggingService) {
      await loggingService.getApplicationLogger().error('Login endpoint error', {
        error: error.message,
        stack: error.stack,
        username: req.body.username,
        ipAddress: req.ip
      }, req.trace);
    }
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

// Token validation endpoint
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticateToken middleware passed)
    // Double-check that the user still exists and is active
    const result = await pool.query(
      'SELECT id, username, email, role, is_active FROM admins WHERE id = $1 AND is_active = true',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists or is inactive' });
    }

    const admin = result.rows[0];
    res.json({
      valid: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Token validation failed' });
  }
});

// Contact form submission endpoint - now with queue notifications
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

    // Create database notification for admins
    const notificationTitle = `New Contact Message: ${subject}`;
    const notificationMessage = `New contact form submission from ${name}. Subject: ${subject}. Urgency: ${urgency || 'normal'}`;
    
    let priority = 'low';
    if (urgency === 'emergency') {
      priority = 'urgent';
    } else if (urgency === 'urgent') {
      priority = 'high';
    }

    await pool.query(
      `INSERT INTO notifications 
       (type, title, message, reference_id, reference_type, priority) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['contact', notificationTitle, notificationMessage, contactId, 'contact', priority]
    );

    // Queue notifications using the notification system
    try {
      // Send email notification to admin
      await queueNotification('email', ['systemsairbag@gmail.com'], 
        notificationTitle, 
        `${notificationMessage}\n\nContact Details:\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`, 
        {
          contactId,
          urgency,
          actionUrl: `http://localhost:5173/dashboard?tab=zinutes&highlight=${contactId}`,
          actionText: 'View Contact'
        }, 
        { priority }
      );

      // Send admin alert notification
      await queueNotification('admin-alert', ['admin'], 
        'New Contact Submission', 
        `${name} submitted a ${urgency || 'normal'} priority contact form: ${subject}`, 
        {
          contactId,
          urgency,
          email,
          phone
        }, 
        { priority }
      );

      // For emergency/urgent messages, also send SMS if phone available
      if ((urgency === 'emergency' || urgency === 'urgent') && phone) {
        await queueNotification('sms', ['+1234567890'], // Replace with admin phone
          `URGENT: New contact form from ${name}: ${subject}`, 
          null,
          { contactId, urgency },
          { priority: 'urgent' }
        );
      }
    } catch (queueError) {
      console.warn('Notification queue failed, but contact saved:', queueError.message);
    }

    res.json({ 
      success: true, 
      message: 'Your message has been sent successfully. We will contact you within 24 hours.',
      contactId,
      notifications_queued: true
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

// File upload endpoints - now with queue processing
app.post('/api/upload/:type', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct the file URL with proper base URL for load balancer
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (process.env.BASE_URL || `http://localhost:8080`) :
      `http://localhost:${PORT}`;
    const fileUrl = `${baseUrl}/uploads/${req.params.type}/${req.file.filename}`;
    const filePath = req.file.path;
    
    // Queue file processing operations
    try {
      // Queue file validation
      await queueFileOperation('validate', filePath, {
        allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 10 * 1024 * 1024 // 10MB
      }, { priority: 'high' });

      // Queue file optimization (compression, resizing if needed)
      await queueFileOperation('optimize', filePath, {
        type: req.params.type,
        originalName: req.file.originalname
      }, { priority: 'medium' });

      // Send notification about successful upload
      await queueNotification('admin-alert', ['admin'], 
        'File Upload', 
        `New file uploaded: ${req.file.originalname}`, 
        {
          fileUrl,
          fileSize: req.file.size,
          uploadType: req.params.type
        }, 
        { priority: 'low' }
      );
    } catch (queueError) {
      console.warn('Queue processing failed, but upload succeeded:', queueError.message);
    }
    
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      queued: true
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete uploaded file endpoint - now with queue cleanup
app.delete('/api/upload/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', type, filename);
    
    if (fs.existsSync(filePath)) {
      // Queue file cleanup instead of immediate deletion
      try {
        await queueFileOperation('cleanup', filePath, {
          type,
          filename
        }, { priority: 'low' });
        
        res.json({ 
          success: true, 
          message: 'File deletion queued successfully',
          queued: true 
        });
      } catch (queueError) {
        // Fallback to immediate deletion if queue fails
        fs.unlinkSync(filePath);
        res.json({ 
          success: true, 
          message: 'File deleted successfully (immediate)',
          queued: false 
        });
      }
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

// Like/unlike gallery item
app.post('/api/gallery/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    
    if (action === 'like') {
      const result = await pool.query(
        'UPDATE gallery SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING likes',
        [id]
      );
      res.json({ likes: result.rows[0].likes });
    } else if (action === 'unlike') {
      const result = await pool.query(
        'UPDATE gallery SET likes = GREATEST(likes - 1, 0), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING likes',
        [id]
      );
      res.json({ likes: result.rows[0].likes });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "like" or "unlike"' });
    }
  } catch (error) {
    console.error('Error updating gallery item likes:', error);
    res.status(500).json({ error: 'Failed to update gallery item likes' });
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

app.put('/api/admin/contacts/:id/unresolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE contacts SET is_resolved = false, resolved_by = NULL, resolved_at = NULL WHERE id = $1',
      [id]
    );

    res.json({ message: 'Contact marked as unresolved' });
  } catch (error) {
    console.error('Error unresolving contact:', error);
    res.status(500).json({ error: 'Failed to unresolve contact' });
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

app.put('/api/admin/reviews/:id/unapprove', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE user_reviews SET is_approved = false, is_featured = false, approved_by = NULL, approved_at = NULL WHERE id = $1',
      [id]
    );

    res.json({ message: 'Review unapproved successfully' });
  } catch (error) {
    console.error('Error unapproving review:', error);
    res.status(500).json({ error: 'Failed to unapprove review' });
  }
});

app.put('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, rating, comment, trip_reference } = req.body;

    // Encrypt sensitive data
    const nameEncrypted = encrypt(name);
    const emailEncrypted = encrypt(email);
    const commentEncrypted = encrypt(comment);

    await pool.query(
      `UPDATE user_reviews 
       SET name_encrypted = $1, email_encrypted = $2, rating = $3, comment_encrypted = $4, trip_reference = $5
       WHERE id = $6`,
      [nameEncrypted, emailEncrypted, rating, commentEncrypted, trip_reference, id]
    );

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
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
    const { sortBy = 'priority' } = req.query;
    
    let orderClause;
    switch (sortBy) {
      case 'date':
        orderClause = 'n.timestamp DESC';
        break;
      case 'type':
        orderClause = 'n.type ASC, n.timestamp DESC';
        break;
      case 'priority':
      default:
        orderClause = `
          CASE WHEN n.priority = 'high' THEN 1 
               WHEN n.priority = 'medium' THEN 2 
               ELSE 3 END,
          n.timestamp DESC
        `;
        break;
    }
    
    const result = await pool.query(`
      SELECT n.*, a.username as read_by_username 
      FROM notifications n 
      LEFT JOIN admins a ON n.read_by = a.id 
      ORDER BY ${orderClause}
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

// Queue management endpoints (protected)
app.post('/api/admin/queue/:queueName/retry-failed', authenticateToken, async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = queueManager.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }
    
    const failedJobs = await queue.getFailed();
    let retriedCount = 0;
    
    for (const job of failedJobs) {
      await job.retry();
      retriedCount++;
    }
    
    res.json({ 
      success: true, 
      message: `Retried ${retriedCount} failed jobs in ${queueName} queue`,
      retriedCount 
    });
  } catch (error) {
    console.error('Error retrying failed jobs:', error);
    res.status(500).json({ error: 'Failed to retry failed jobs' });
  }
});

app.post('/api/admin/queue/:queueName/clean', authenticateToken, async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = queueManager.queues[queueName];
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }
    
    await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24h
    await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
    
    res.json({ 
      success: true, 
      message: `Cleaned old jobs from ${queueName} queue` 
    });
  } catch (error) {
    console.error('Error cleaning queue:', error);
    res.status(500).json({ error: 'Failed to clean queue' });
  }
});

// New queue operation endpoints

// Manual database maintenance endpoint
app.post('/api/admin/database/:operation', authenticateToken, async (req, res) => {
  try {
    const { operation } = req.params;
    const { retentionDays, tables } = req.body;
    
    const validOperations = [
      'cleanup-logs', 'cleanup-sessions', 'analyze-tables', 
      'reindex-tables', 'backup-critical-data', 'archive-old-data', 
      'update-stats'
    ];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        error: 'Invalid operation', 
        validOperations 
      });
    }
    
    const jobData = {};
    if (retentionDays) jobData.retentionDays = retentionDays;
    if (tables) jobData.tables = tables;
    
    const job = await queueDatabaseOperation(operation, jobData, { priority: 'medium' });
    
    res.json({ 
      success: true, 
      message: `Database ${operation} operation queued`,
      jobId: job.id 
    });
  } catch (error) {
    console.error('Database operation error:', error.message);
    res.status(500).json({ error: 'Failed to queue database operation' });
  }
});

// TEST ENDPOINT - minimal database operation
app.post('/api/admin/test-database', authenticateToken, async (req, res) => {
  try {
    console.log('Testing minimal database queue operation...');
    const job = await queueDatabaseOperation('cleanup-logs', { retentionDays: 30 }, { priority: 'low' });
    res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error('Test database error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Manual analytics generation endpoint
app.post('/api/admin/analytics/:operation', authenticateToken, async (req, res) => {
  try {
    const { operation } = req.params;
    const { timeframe = 'weekly' } = req.body;
    
    const validOperations = [
      'contact-analytics', 'review-analytics', 'upload-analytics',
      'performance-metrics', 'user-engagement', 'system-health-report',
      'security-audit'
    ];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        error: 'Invalid operation', 
        validOperations 
      });
    }
    
    const job = await queueAnalyticsOperation(operation, {}, timeframe, { priority: 'medium' });
    
    res.json({ 
      success: true, 
      message: `Analytics ${operation} queued for ${timeframe} timeframe`,
      jobId: job.id 
    });
  } catch (error) {
    console.error('Analytics operation error:', error.message);
    res.status(500).json({ error: 'Failed to queue analytics operation' });
  }
});

// Manual monitoring check endpoint
app.post('/api/admin/monitoring/:operation', authenticateToken, async (req, res) => {
  try {
    const { operation } = req.params;
    const { thresholds = {} } = req.body;
    
    const validOperations = [
      'health-check', 'resource-monitoring', 'database-monitoring',
      'queue-monitoring', 'error-detection', 'performance-monitoring',
      'disk-usage-check', 'memory-pressure-check'
    ];
    
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ 
        error: 'Invalid operation', 
        validOperations 
      });
    }
    
    const jobData = {
      // Only pass simple data, not complex objects with circular references
      instanceId: INSTANCE_ID
    };
    // The worker will access systemMonitor, backendHealthMonitor, pool, queueManager directly
    // since they're not JSON serializable due to circular references
    
    const job = await queueMonitoringOperation(operation, jobData, thresholds, { priority: 'high' });
    
    res.json({ 
      success: true, 
      message: `Monitoring ${operation} queued`,
      jobId: job.id 
    });
  } catch (error) {
    console.error('Error queuing monitoring operation:', error.message);
    console.error('Operation type:', typeof operation !== 'undefined' ? operation : 'undefined');
    res.status(500).json({ error: 'Failed to queue monitoring operation', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check queue health
    const queueHealth = await queueManager.getHealthStatus();
    
    // Get basic system metrics
    const systemMetrics = systemMonitor.getCurrentMetrics();
    const systemHealth = systemMonitor.isHealthy();
    
    const isHealthy = Object.values(queueHealth).every(queue => queue.healthy) && 
                     systemHealth.healthy;
    
    res.json({ 
      status: isHealthy ? 'OK' : 'DEGRADED',
      message: 'Server is running',
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString(),
      database: 'connected',
      queues: queueHealth,
      system: {
        cpu: systemMetrics.cpu.usage,
        memory: systemMetrics.memory.usagePercentage,
        uptime: systemMetrics.uptime.process,
        healthy: systemHealth.healthy
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      message: 'Health check failed',
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Queue statistics endpoint (protected)
app.get('/api/admin/queue-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await queueManager.getQueueStats();
    const health = await queueManager.getHealthStatus();
    
    res.json({
      stats,
      health,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString(),
      workers: {
        email: emailWorker.isRunning(),
        file: fileWorker.isRunning(),
        notification: notificationWorker.isRunning(),
        logging: LoggingQueueWorker.isRunning(),
        database: databaseWorker.isRunning(),
        analytics: analyticsWorker.isRunning(),
        monitoring: monitoringWorker.isRunning()
      }
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

// Instance information endpoint (protected)
app.get('/api/admin/instance-info', authenticateToken, async (req, res) => {
  try {
    res.json({
      instance: INSTANCE_ID,
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching instance info:', error);
    res.status(500).json({ error: 'Failed to fetch instance information' });
  }
});

// Comprehensive server monitoring endpoint (protected)
app.get('/api/admin/server-status', authenticateToken, async (req, res) => {
  try {
    // Get database status
    let dbStatus = 'connected';
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      dbStatus = 'disconnected';
    }
    
    // Get queue health
    const queueHealth = await queueManager.getHealthStatus();
    const queueStats = await queueManager.getQueueStats();
    
    // Get backend health status
    const backendHealth = backendHealthMonitor.getBackendStatus();
    const backendAllHealthy = backendHealth.summary.down === 0 && backendHealth.summary.unhealthy === 0;
    
    // Calculate system health including backend infrastructure
    const isHealthy = dbStatus === 'connected' && 
                     Object.values(queueHealth).every(queue => queue.healthy) &&
                     backendAllHealthy;
    
    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      instance: {
        id: INSTANCE_ID,
        port: PORT,
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: dbStatus,
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'koradius_db'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      queues: {
        health: queueHealth,
        stats: queueStats
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        status: queueHealth.email?.healthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching server status:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced system monitoring endpoints (protected)
app.get('/api/admin/system-metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = systemMonitor.getCurrentMetrics();
    const health = systemMonitor.isHealthy();
    const performance = systemMonitor.getPerformanceSummary();
    const alerts = systemMonitor.getAlerts();

    res.json({
      metrics,
      health,
      performance,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ 
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/system-history', authenticateToken, async (req, res) => {
  try {
    const points = parseInt(req.query.points) || 60;
    const history = systemMonitor.getHistory(points);
    
    res.json({
      history,
      points: history.length,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system history:', error);
    res.status(500).json({ 
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/server-status-enhanced', authenticateToken, async (req, res) => {
  try {
    // Get database status
    let dbStatus = 'connected';
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.error('Database connection error:', dbError.message);
      dbStatus = 'disconnected';
    }
    
    // Get queue health
    const queueHealth = await queueManager.getHealthStatus();
    const queueStats = await queueManager.getQueueStats();
    
    // Get system metrics
    const systemMetrics = systemMonitor.getCurrentMetrics();
    const systemHealth = systemMonitor.isHealthy();
    const performance = systemMonitor.getPerformanceSummary();
    
    // Get backend health status
    const backendHealth = backendHealthMonitor.getBackendStatus();
    const backendAllHealthy = backendHealth.summary.down === 0 && backendHealth.summary.unhealthy === 0;
    
    // Calculate overall system health including backend infrastructure
    const coreSystemsHealthy = dbStatus === 'connected' && 
                               Object.values(queueHealth).every(queue => queue.healthy) &&
                               systemHealth.healthy;
    
    const allBackendsHealthy = backendHealth.summary.down === 0 && backendHealth.summary.unhealthy === 0;
    const anyBackendsRunning = backendHealth.summary.healthy > 0;
    const allBackendsDown = backendHealth.summary.healthy === 0;
    
    // Determine system status with three levels
    let systemStatus;
    let isHealthy;
    
    if (!coreSystemsHealthy || allBackendsDown) {
      // Critical: Core systems failing or all backends down
      systemStatus = 'critical';
      isHealthy = false;
    } else if (!allBackendsHealthy && anyBackendsRunning) {
      // Warning: Some backends down but at least one healthy
      systemStatus = 'warning';
      isHealthy = true; // Still operational
    } else {
      // Healthy: All systems operational
      systemStatus = 'healthy';
      isHealthy = true;
    }
    
    console.log('HEALTH DEBUG:', {
      systemStatus,
      isHealthy,
      coreSystemsHealthy,
      allBackendsHealthy,
      anyBackendsRunning,
      allBackendsDown,
      backendSummary: backendHealth.summary
    });
    
    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      statusDetails: {
        database: dbStatus === 'connected',
        queues: Object.values(queueHealth).every(queue => queue.healthy),
        system: systemHealth.healthy,
        backends: backendAllHealthy,
        summary: isHealthy ? 'All systems operational' : 
                 !backendAllHealthy ? `System degraded: ${backendHealth.summary.down} backend(s) down, ${backendHealth.summary.unhealthy} unhealthy` :
                 dbStatus !== 'connected' ? 'System degraded: Database connection issues' :
                 !systemHealth.healthy ? 'System degraded: Resource constraints' :
                 'System degraded: Queue health issues'
      },
      backendHealth: backendHealth,
      instance: {
        id: INSTANCE_ID,
        port: PORT,
        uptime: systemMetrics.uptime.process,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        platform: systemMetrics.processes.platform,
        arch: systemMetrics.processes.arch,
        pid: systemMetrics.processes.pid
      },
      database: {
        status: dbStatus,
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'koradius_db'
      },
      system: {
        cpu: {
          usage: systemMetrics.cpu.usage,
          cores: systemMetrics.cpu.cores,
          loadAverage: systemMetrics.cpu.loadAverage
        },
        memory: {
          total: systemMetrics.memory.total,
          used: systemMetrics.memory.used,
          free: systemMetrics.memory.free,
          usagePercentage: systemMetrics.memory.usagePercentage,
          heap: systemMetrics.memory.heap
        },
        uptime: {
          system: systemMetrics.uptime.system,
          process: systemMetrics.uptime.process
        },
        health: {
          healthy: isHealthy,  // Overall system health including backends
          issues: systemStatus === 'healthy' ? [] : [
            ...(!allBackendsHealthy ? [`${backendHealth.summary.down} backend(s) down, ${backendHealth.summary.unhealthy} unhealthy`] : []),
            ...(dbStatus !== 'connected' ? ['Database connection issues'] : []),
            ...(!systemHealth.healthy ? ['Resource constraints'] : []),
            ...(!Object.values(queueHealth).every(queue => queue.healthy) ? ['Queue health issues'] : [])
          ],
          status: systemStatus  // Use the calculated system status (healthy/warning/critical)
        },
        performance: performance
      },
      queues: {
        health: queueHealth,
        stats: queueStats
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        status: queueHealth.email?.healthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching enhanced server status:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

// Backend health monitoring endpoints (protected)
app.get('/api/admin/backend-health', authenticateToken, async (req, res) => {
  try {
    const backendStatus = backendHealthMonitor.getBackendStatus();
    
    res.json({
      ...backendStatus,
      instance: INSTANCE_ID
    });
  } catch (error) {
    console.error('Error fetching backend health:', error);
    res.status(500).json({ 
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/backend-health/force-check', authenticateToken, async (req, res) => {
  try {
    const backendStatus = await backendHealthMonitor.forceCheck();
    
    res.json({
      message: 'Backend health check completed',
      ...backendStatus,
      instance: INSTANCE_ID
    });
  } catch (error) {
    console.error('Error forcing backend health check:', error);
    res.status(500).json({ 
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/admin/load-balancer-health', authenticateToken, async (req, res) => {
  try {
    const loadBalancerHealth = backendHealthMonitor.getLoadBalancerHealth();
    
    res.json({
      ...loadBalancerHealth,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching load balancer health:', error);
    res.status(500).json({ 
      error: error.message,
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  }
});

// Load balancer status endpoint (protected)
app.get('/api/admin/load-balancer-status', authenticateToken, async (req, res) => {
  try {
    // Simple response for load balancer status
    // In a production environment, this could query nginx status or service discovery
    
    res.json({
      loadBalancer: {
        status: 'active',
        backendServers: 2, // This could be dynamic based on running containers
        method: 'least_conn with ip_hash',
        nginxProxy: 'enabled'
      },
      currentInstance: INSTANCE_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching load balancer status:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Logging API endpoints (protected)
app.get('/api/admin/logs', authenticateToken, async (req, res) => {
  try {
    if (!loggingService) {
      return res.status(503).json({ error: 'Logging service not initialized' });
    }

    const {
      startDate,
      endDate,
      level,
      logTypes,
      instanceId,
      userId,
      traceId,
      limit = 100,
      offset = 0,
      orderBy = 'timestamp',
      orderDirection = 'DESC'
    } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      level,
      logTypes: logTypes ? logTypes.split(',') : undefined,
      instanceId,
      userId: userId ? parseInt(userId) : undefined,
      traceId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      orderDirection
    };

    const result = await loggingService.getCombinedLogs(filters);
    
    res.json({
      ...result,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/admin/logs/stats', authenticateToken, async (req, res) => {
  try {
    if (!loggingService) {
      return res.status(503).json({ error: 'Logging service not initialized' });
    }

    const { timeRange = '24h' } = req.query;
    const stats = await loggingService.getLoggingStats(timeRange);
    
    res.json({
      ...stats,
      currentInstance: INSTANCE_ID
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Failed to fetch log statistics' });
  }
});

app.get('/api/admin/logs/audit/:userId', authenticateToken, async (req, res) => {
  try {
    if (!loggingService) {
      return res.status(503).json({ error: 'Logging service not initialized' });
    }

    const { userId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;
    
    const auditLogger = loggingService.getAuditLogger();
    const auditTrail = await auditLogger.getUserAuditTrail(
      parseInt(userId),
      startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default 7 days
      endDate ? new Date(endDate) : new Date(),
      parseInt(limit)
    );
    
    res.json({
      userId: parseInt(userId),
      auditTrail,
      total: auditTrail.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

app.get('/api/admin/logs/compliance', authenticateToken, async (req, res) => {
  try {
    if (!loggingService) {
      return res.status(503).json({ error: 'Logging service not initialized' });
    }

    const { startDate, endDate, regulation } = req.query;
    
    const auditLogger = loggingService.getAuditLogger();
    const complianceReport = await auditLogger.getComplianceReport(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
      endDate ? new Date(endDate) : new Date(),
      regulation
    );
    
    res.json({
      regulation,
      report: complianceReport,
      total: complianceReport.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

app.delete('/api/admin/logs/cleanup', authenticateToken, async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body;
    
    // Queue the cleanup operation instead of doing it directly
    const job = await queueDatabaseOperation('cleanup-logs', { 
      retentionDays: parseInt(retentionDays) 
    }, { 
      priority: 'medium' 
    });
    
    // Don't wait for completion, just return success with job info
    res.json({
      success: true,
      message: `Log cleanup operation queued successfully`,
      jobId: job.id,
      retentionDays: parseInt(retentionDays),
      timestamp: new Date().toISOString(),
      note: "Cleanup is being processed in the background"
    });
  } catch (error) {
    console.error('Error queuing log cleanup:', error);
    res.status(500).json({ error: 'Failed to queue log cleanup operation' });
  }
});

// Log cleanup scheduler management endpoints
app.get('/api/admin/logs/scheduler/status', authenticateToken, async (req, res) => {
  try {
    if (!logCleanupScheduler) {
      return res.json({
        success: false,
        message: 'Log cleanup scheduler not initialized'
      });
    }

    const status = logCleanupScheduler.getStatus();
    res.json({
      success: true,
      scheduler: status
    });
    
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

app.post('/api/admin/logs/scheduler/start', authenticateToken, async (req, res) => {
  try {
    if (!logCleanupScheduler) {
      return res.status(400).json({
        success: false,
        message: 'Log cleanup scheduler not initialized'
      });
    }

    logCleanupScheduler.start();
    res.json({
      success: true,
      message: 'Log cleanup scheduler started'
    });
    
  } catch (error) {
    console.error('Failed to start scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
});

app.post('/api/admin/logs/scheduler/stop', authenticateToken, async (req, res) => {
  try {
    if (!logCleanupScheduler) {
      return res.status(400).json({
        success: false,
        message: 'Log cleanup scheduler not initialized'
      });
    }

    logCleanupScheduler.stop();
    res.json({
      success: true,
      message: 'Log cleanup scheduler stopped'
    });
    
  } catch (error) {
    console.error('Failed to stop scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
});

app.post('/api/admin/logs/scheduler/cleanup-now', authenticateToken, async (req, res) => {
  try {
    if (!logCleanupScheduler) {
      return res.status(400).json({
        success: false,
        message: 'Log cleanup scheduler not initialized'
      });
    }

    await logCleanupScheduler.runCleanupNow();
    res.json({
      success: true,
      message: 'Manual log cleanup initiated'
    });
    
  } catch (error) {
    console.error('Failed to run manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run manual cleanup',
      error: error.message
    });
  }
});

app.put('/api/admin/logs/scheduler/time', authenticateToken, async (req, res) => {
  try {
    const { hour, minute } = req.body;
    
    if (!logCleanupScheduler) {
      return res.status(400).json({
        success: false,
        message: 'Log cleanup scheduler not initialized'
      });
    }

    if (typeof hour !== 'number' || typeof minute !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Hour and minute must be numbers'
      });
    }

    logCleanupScheduler.setCleanupTime(hour, minute);
    res.json({
      success: true,
      message: `Log cleanup time updated to ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    });
    
  } catch (error) {
    console.error('Failed to update cleanup time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cleanup time',
      error: error.message
    });
  }
});

// Add error logging middleware at the end
app.use((error, req, res, next) => {
  if (loggingMiddleware) {
    loggingMiddleware.errorLogger()(error, req, res, next);
  } else {
    next(error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server instance ${INSTANCE_ID} running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    // Stop log cleanup scheduler
    if (logCleanupScheduler && logCleanupScheduler.isRunning) {
      logCleanupScheduler.stop();
    }
    
    // Close queue connections
    await queueManager.shutdown();
    
    // Close database connection
    await pool.end();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}); 