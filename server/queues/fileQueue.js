const fs = require('fs').promises;
const path = require('path');
const { Worker } = require('bullmq');
const { fileQueue, redisConfig } = require('./config');

// File processing job processor
const fileWorker = new Worker('file processing', async (job) => {
  const { operation, filePath, metadata } = job.data;
  
  console.log(`Processing file job ${job.id}: ${operation} for ${filePath}`);
  
  try {
    switch (operation) {
      case 'optimize':
        return await optimizeFile(filePath, metadata);
      case 'resize':
        return await resizeImage(filePath, metadata);
      case 'compress':
        return await compressFile(filePath, metadata);
      case 'cleanup':
        return await cleanupFile(filePath);
      case 'validate':
        return await validateFile(filePath, metadata);
      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
  } catch (error) {
    console.error(`File processing failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 3,
});

// File processing functions
async function optimizeFile(filePath, metadata) {
  // Placeholder for file optimization logic
  const stats = await fs.stat(filePath);
  return {
    success: true,
    operation: 'optimize',
    originalSize: stats.size,
    optimizedSize: stats.size, // Would be smaller after optimization
    path: filePath
  };
}

async function resizeImage(filePath, metadata) {
  // Placeholder for image resizing logic
  const { width, height } = metadata;
  return {
    success: true,
    operation: 'resize',
    dimensions: { width, height },
    path: filePath
  };
}

async function compressFile(filePath, metadata) {
  // Placeholder for file compression logic
  const stats = await fs.stat(filePath);
  return {
    success: true,
    operation: 'compress',
    originalSize: stats.size,
    compressedSize: Math.floor(stats.size * 0.8), // Simulated compression
    path: filePath
  };
}

async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    return {
      success: true,
      operation: 'cleanup',
      message: `File ${filePath} deleted successfully`
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        operation: 'cleanup',
        message: 'File already deleted'
      };
    }
    throw error;
  }
}

async function validateFile(filePath, metadata) {
  const stats = await fs.stat(filePath);
  const { allowedTypes, maxSize } = metadata;
  
  const ext = path.extname(filePath).toLowerCase();
  const isValidType = allowedTypes.includes(ext);
  const isValidSize = stats.size <= maxSize;
  
  return {
    success: isValidType && isValidSize,
    operation: 'validate',
    checks: {
      validType: isValidType,
      validSize: isValidSize,
      fileSize: stats.size,
      fileType: ext
    }
  };
}

// Worker event listeners
fileWorker.on('completed', (job, result) => {
  console.log(`File job ${job.id} completed:`, result);
});

fileWorker.on('failed', (job, err) => {
  console.error(`File job ${job.id} failed:`, err.message);
});

fileWorker.on('stalled', (job) => {
  console.warn(`File job ${job.id} stalled`);
});

// Helper function to add file processing job to queue
const queueFileOperation = async (operation, filePath, metadata = {}, options = {}) => {
  const priority = options.priority || 'normal';
  
  let jobPriority;
  switch (priority) {
    case 'high':
      jobPriority = 3;
      break;
    case 'medium':
      jobPriority = 2;
      break;
    default:
      jobPriority = 1;
  }
  
  const jobOptions = {
    priority: jobPriority,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  };
  
  const job = await fileQueue.add('process-file', {
    operation,
    filePath,
    metadata
  }, jobOptions);
  
  console.log(`File operation '${operation}' queued with ID: ${job.id}, Priority: ${priority}`);
  return job;
};

module.exports = {
  fileQueue,
  fileWorker,
  queueFileOperation,
};
