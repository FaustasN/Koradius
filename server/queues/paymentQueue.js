const { Worker } = require('bullmq');
const { paymentQueue, redisConfig } = require('./config');
const { Pool } = require('pg');
const crypto = require('crypto');
const { mapPaymentMethod } = require('../utils/paymentMethodMapper');

// Database connection for payment operations
const createDbConnection = () => {
  return new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'koradius_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  });
};

// Encryption utilities for payment data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
  Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : 
  crypto.randomBytes(32);
const ENCRYPTION_IV_LENGTH = 16;

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Payment data decryption failed:', error);
    throw new Error('Failed to decrypt payment data');
  }
};

// Payment worker processor
const paymentWorker = new Worker('payment processing', async (job) => {
  const { operation, data } = job.data;
  
  console.log(`Processing payment job ${job.id}: ${operation}`);
  
  try {
    switch (operation) {
      case 'create-payment':
        return await createPaymentRecord(data);
      case 'update-payment-status':
        return await updatePaymentStatus(data);
      case 'process-callback':
        return await processPaymentCallback(data);
      case 'verify-payment':
        return await verifyPayment(data);
      case 'get-payment-status':
        return await getPaymentStatus(data);
      case 'get-recent-pending-payment':
        return await getRecentPendingPayment(data);
      case 'refund-payment':
        return await processRefund(data);
      case 'cleanup-old-payments':
        return await cleanupOldPayments(data);
      case 'timeout-pending-payments':
        return await timeoutPendingPayments(data);
      case 'generate-payment-report':
        return await generatePaymentReport(data);
      default:
        throw new Error(`Unknown payment operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Payment operation failed for job ${job.id}:`, error);
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 3, // Moderate concurrency for payment operations
});

// Payment operations
async function createPaymentRecord(data) {
  const pool = createDbConnection();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      orderId,
      amount,
      currency,
      description,
      customerEmail,
      customerName,
      customerPhone,
      ipAddress,
      userAgent,
      sessionId,
      productInfo
    } = data;

    // Encrypt sensitive customer data
    const encryptedEmail = encrypt(customerEmail);
    const encryptedName = encrypt(customerName);
    const encryptedPhone = customerPhone ? encrypt(customerPhone) : null;
    const encryptedProductInfo = productInfo ? encrypt(JSON.stringify(productInfo)) : null;

    // Insert payment record
    const paymentResult = await client.query(`
      INSERT INTO payments (
        order_id, 
        amount, 
        currency, 
        description, 
        customer_email_encrypted, 
        customer_name_encrypted,
        customer_phone_encrypted,
        ip_address, 
        user_agent, 
        session_id,
        product_info_encrypted,
        status, 
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', CURRENT_TIMESTAMP)
      RETURNING id, order_id, amount, currency, status, created_at
    `, [
      orderId, 
      parseFloat(amount).toFixed(2), // Ensure proper decimal format
      currency, 
      description, 
      encryptedEmail, 
      encryptedName,
      encryptedPhone,
      ipAddress, 
      userAgent, 
      sessionId,
      encryptedProductInfo
    ]);

    await client.query('COMMIT');
    
    const payment = paymentResult.rows[0];
    
    console.log(`Payment record created: ${payment.id} for order: ${orderId}`);
    
    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.created_at
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create payment record:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function processPaymentCallback(data) {
  const pool = createDbConnection();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      orderId,
      status,
      amount,
      currency,
      paymentMethod,
      transactionId,
      gatewayResponse,
      paidAt
    } = data;

    // Update payment status
    const updateResult = await client.query(`
      UPDATE payments 
      SET 
        status = $2,
        payment_method = $3,
        transaction_id = $4,
        gateway_response_encrypted = $5,
        paid_at = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING id, order_id, amount, currency, status
    `, [
      orderId,
      status,
      paymentMethod,
      transactionId,
      gatewayResponse ? encrypt(JSON.stringify(gatewayResponse)) : null,
      paidAt || (status === 'completed' ? new Date() : null)
    ]);

    if (updateResult.rows.length === 0) {
      throw new Error(`Payment not found for order ID: ${orderId}`);
    }

    const payment = updateResult.rows[0];

    // Create payment history record
    await client.query(`
      INSERT INTO payment_history (
        payment_id, 
        status, 
        notes, 
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [
      payment.id,
      status,
      `Payment callback processed - Status: ${status}, Method: ${paymentMethod}`
    ]);

    // If payment successful, create notification
    if (status === 'completed') {
      await client.query(`
        INSERT INTO notifications (
          type, 
          title, 
          message, 
          reference_id, 
          reference_type, 
          priority, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        'order',
        'Payment Received',
        `Payment of ${amount} ${currency} received for order ${orderId}`,
        payment.id,
        'payment',
        'medium'
      ]);
    }

    await client.query('COMMIT');
    
    console.log(`Payment callback processed for order: ${orderId}, status: ${status}`);
    
    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to process payment callback:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function updatePaymentStatus(data) {
  const pool = createDbConnection();
  const client = await pool.connect();
  
  try {
    const { orderId, status, paymentMethod, paidAt, transactionId, notes } = data;

    // Build dynamic update query
    let updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    let updateValues = [orderId, status];
    let paramIndex = 3;

    if (paymentMethod) {
      updateFields.push(`payment_method = $${paramIndex}`);
      updateValues.push(paymentMethod);
      paramIndex++;
    }

    if (paidAt) {
      updateFields.push(`paid_at = $${paramIndex}`);
      updateValues.push(paidAt);
      paramIndex++;
    }

    if (transactionId) {
      updateFields.push(`transaction_id = $${paramIndex}`);
      updateValues.push(transactionId);
      paramIndex++;
    }

    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE order_id = $1
      RETURNING id, order_id, status, payment_method
    `;

    const updateResult = await client.query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      throw new Error(`Payment not found for order ID: ${orderId}`);
    }

    const payment = updateResult.rows[0];

    // Add to payment history
    const historyNote = notes || `Status updated to ${status}` + (paymentMethod ? ` via ${paymentMethod}` : '');
    await client.query(`
      INSERT INTO payment_history (
        payment_id, 
        status, 
        notes, 
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [payment.id, status, historyNote]);

    const logMessage = `Payment status updated for order: ${orderId}, new status: ${status}` + (paymentMethod ? `, method: ${paymentMethod}` : '');
    console.log(logMessage);
    
    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      status: payment.status
    };
    
  } catch (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function getPaymentStatus(data) {
  const pool = createDbConnection();
  
  try {
    const { orderId } = data;

    const result = await pool.query(`
      SELECT 
        id,
        order_id,
        amount,
        currency,
        status,
        payment_method,
        transaction_id,
        created_at,
        paid_at,
        customer_email_encrypted,
        customer_name_encrypted,
        product_info_encrypted
      FROM payments 
      WHERE order_id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Payment not found'
      };
    }

    const payment = result.rows[0];
    
    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id,
        createdAt: payment.created_at,
        paidAt: payment.paid_at,
        // Include encrypted data for admin panel
        customerEmail: payment.customer_email_encrypted,
        customerName: payment.customer_name_encrypted,
        productInfo: payment.product_info_encrypted
      }
    };
    
  } catch (error) {
    console.error('Failed to get payment status:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function getRecentPendingPayment(data) {
  const pool = createDbConnection();
  
  try {
    const { ipAddress, userAgent, timeWindow = 30 } = data;
    
    // Calculate the time window
    const timeThreshold = new Date();
    timeThreshold.setMinutes(timeThreshold.getMinutes() - timeWindow);

    const result = await pool.query(`
      SELECT 
        id,
        order_id,
        amount,
        currency,
        status,
        created_at,
        ip_address,
        user_agent
      FROM payments 
      WHERE status = 'pending' 
        AND ip_address = $1 
        AND user_agent = $2
        AND created_at >= $3
      ORDER BY created_at DESC
      LIMIT 1
    `, [ipAddress, userAgent, timeThreshold]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'No recent pending payment found'
      };
    }

    const payment = result.rows[0];
    
    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.created_at
      }
    };
    
  } catch (error) {
    console.error('Failed to get recent pending payment:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function cleanupOldPayments(data) {
  const pool = createDbConnection();
  
  try {
    const { retentionDays = 365 } = data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Archive old completed payments (move to archive table)
    const archiveResult = await pool.query(`
      INSERT INTO payments_archive 
      SELECT * FROM payments 
      WHERE created_at < $1 AND status IN ('completed', 'cancelled', 'failed')
    `, [cutoffDate]);

    // Delete archived payments from main table
    const deleteResult = await pool.query(`
      DELETE FROM payments 
      WHERE created_at < $1 AND status IN ('completed', 'cancelled', 'failed')
    `, [cutoffDate]);

    console.log(`Archived ${archiveResult.rowCount} payments, deleted ${deleteResult.rowCount} from main table`);
    
    return {
      success: true,
      archivedCount: archiveResult.rowCount,
      deletedCount: deleteResult.rowCount,
      cutoffDate: cutoffDate.toISOString()
    };
    
  } catch (error) {
    console.error('Failed to cleanup old payments:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function timeoutPendingPayments(data) {
  const pool = createDbConnection();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { timeoutMinutes = 60 } = data;
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - timeoutMinutes);

    console.log(`Checking for pending payments older than ${timeoutMinutes} minutes (before ${timeoutDate.toISOString()})`);

    // Find all pending payments that are older than the timeout threshold
    const pendingPaymentsResult = await client.query(`
      SELECT id, order_id, amount, currency, created_at
      FROM payments 
      WHERE status = 'pending' AND created_at < $1
      ORDER BY created_at ASC
    `, [timeoutDate]);

    const expiredPayments = pendingPaymentsResult.rows;
    
    if (expiredPayments.length === 0) {
      console.log('No expired pending payments found');
      await client.query('ROLLBACK');
      return {
        success: true,
        expiredCount: 0,
        timeoutMinutes,
        cutoffTime: timeoutDate.toISOString(),
        message: 'No expired payments found'
      };
    }

    console.log(`Found ${expiredPayments.length} expired pending payments`);

    // Update expired payments to 'timed out' status
    const updateResult = await client.query(`
      UPDATE payments 
      SET 
        status = 'timed out',
        updated_at = CURRENT_TIMESTAMP,
        gateway_response_encrypted = $2
      WHERE status = 'pending' AND created_at < $1
      RETURNING id, order_id, amount, currency
    `, [
      timeoutDate,
      encrypt(JSON.stringify({ 
        reason: 'payment_timeout',
        timeout_minutes: timeoutMinutes,
        expired_at: new Date().toISOString(),
        original_created_at: timeoutDate.toISOString()
      }))
    ]);

    // Create payment history entries for each expired payment
    for (const payment of updateResult.rows) {
      await client.query(`
        INSERT INTO payment_history (payment_id, status, notes, created_at)
        VALUES ($1, 'timed out', $2, CURRENT_TIMESTAMP)
      `, [
        payment.id,
        `Payment timed out after ${timeoutMinutes} minutes of inactivity`
      ]);
    }

    await client.query('COMMIT');
    
    console.log(`Successfully marked ${updateResult.rowCount} payments as timed out`);
    
    // Log details of expired payments (without sensitive data)
    const expiredDetails = updateResult.rows.map(payment => ({
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency
    }));

    return {
      success: true,
      expiredCount: updateResult.rowCount,
      timeoutMinutes,
      cutoffTime: timeoutDate.toISOString(),
      expiredPayments: expiredDetails,
      message: `${updateResult.rowCount} pending payments timed out and marked as expired`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to timeout pending payments:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function generatePaymentReport(data) {
  const pool = createDbConnection();
  
  try {
    const { startDate, endDate, includeDecrypted = false } = data;

    // Convert date strings to full datetime ranges for proper querying
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    const reportQuery = `
      SELECT 
        id,
        order_id,
        amount,
        currency,
        status,
        payment_method,
        created_at,
        paid_at,
        ${includeDecrypted ? 'customer_email_encrypted, customer_name_encrypted, product_info_encrypted,' : ''}
        CASE WHEN status = 'completed' THEN amount ELSE 0 END as successful_amount
      FROM payments 
      WHERE created_at BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `;

    const result = await pool.query(reportQuery, [startDateTime, endDateTime]);
    
    const payments = result.rows.map(payment => ({
      ...payment,
      // Decrypt sensitive data if requested (for admin reports)
      ...(includeDecrypted && {
        customerEmail: payment.customer_email_encrypted ? decrypt(payment.customer_email_encrypted) : null,
        customerName: payment.customer_name_encrypted ? decrypt(payment.customer_name_encrypted) : null,
        productInfo: payment.product_info_encrypted ? JSON.parse(decrypt(payment.product_info_encrypted)) : null
      })
    }));

    // Calculate summary statistics
    const summary = {
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === 'completed').length,
      failedPayments: payments.filter(p => p.status === 'failed').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      timedOutPayments: payments.filter(p => p.status === 'timed out').length,
      cancelledPayments: payments.filter(p => p.status === 'cancelled').length,
      refundedPayments: payments.filter(p => p.status === 'refunded').length,
      totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.successful_amount || 0), 0),
      currencies: [...new Set(payments.map(p => p.currency))]
    };

    return {
      success: true,
      report: {
        summary,
        payments,
        period: { startDate, endDate },
        generatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Failed to generate payment report:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function processRefund(data) {
  const pool = createDbConnection();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { orderId, refundAmount, reason, adminId } = data;

    // Get original payment
    const paymentResult = await client.query(`
      SELECT * FROM payments WHERE order_id = $1
    `, [orderId]);

    if (paymentResult.rows.length === 0) {
      throw new Error(`Payment not found for order ID: ${orderId}`);
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'completed') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    // Create refund record
    const refundResult = await client.query(`
      INSERT INTO payment_refunds (
        payment_id,
        refund_amount,
        reason_encrypted,
        processed_by,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      payment.id,
      refundAmount,
      encrypt(reason),
      adminId
    ]);

    // Add to payment history
    await client.query(`
      INSERT INTO payment_history (
        payment_id, 
        status, 
        notes, 
        created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [
      payment.id,
      'refund_requested',
      `Refund requested: ${refundAmount} ${payment.currency}`
    ]);

    await client.query('COMMIT');
    
    console.log(`Refund requested for order: ${orderId}, amount: ${refundAmount}`);
    
    return {
      success: true,
      refundId: refundResult.rows[0].id,
      paymentId: payment.id,
      orderId: payment.order_id,
      refundAmount,
      status: 'pending'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to process refund:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function verifyPayment(data) {
  const pool = createDbConnection();
  
  try {
    const { orderId, expectedAmount, expectedCurrency } = data;

    const result = await pool.query(`
      SELECT 
        id, order_id, amount, currency, status, transaction_id, paid_at
      FROM payments 
      WHERE order_id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        verified: false,
        message: 'Payment not found'
      };
    }

    const payment = result.rows[0];
    const isVerified = payment.status === 'completed' &&
                      payment.amount == expectedAmount &&
                      payment.currency === expectedCurrency;

    return {
      success: true,
      verified: isVerified,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transaction_id,
        paidAt: payment.paid_at
      },
      message: isVerified ? 'Payment verified successfully' : 'Payment verification failed'
    };
    
  } catch (error) {
    console.error('Failed to verify payment:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Queue helper functions
const queuePaymentOperation = async (operation, data, options = {}) => {
  try {
    const job = await paymentQueue.add(operation, {
      operation,
      data,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 20,
      ...options
    });
    
    console.log(`Payment job queued: ${job.id} (${operation})`);
    return job;
  } catch (error) {
    console.error(`Failed to queue payment operation ${operation}:`, error);
    throw error;
  }
};

// Worker event handlers
paymentWorker.on('completed', (job, result) => {
  console.log(`✅ Payment job ${job.id} completed:`, result);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`❌ Payment job ${job?.id} failed:`, err);
});

paymentWorker.on('error', (err) => {
  console.error('Payment worker error:', err);
});

module.exports = {
  paymentWorker,
  queuePaymentOperation,
  // Export individual functions for direct use if needed
  createPaymentRecord,
  processPaymentCallback,
  updatePaymentStatus,
  getPaymentStatus,
  getRecentPendingPayment,
  verifyPayment,
  processRefund,
  cleanupOldPayments,
  timeoutPendingPayments,
  generatePaymentReport
};
