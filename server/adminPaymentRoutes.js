const express = require('express');
const { queuePaymentOperation } = require('./queues/paymentQueue');
const { QueueEvents } = require('bullmq');
const { redisConfig } = require('./queues/config');
const crypto = require('crypto');
const router = express.Router();

// Initialize queue events for waiting on job completion
const queueEvents = new QueueEvents('payment processing', { connection: redisConfig });

// Encryption utilities for decrypting payment data in admin panel
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
  Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : 
  crypto.randomBytes(32);

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
    console.error('Admin panel decryption failed:', error);
    return '[Decryption Failed]';
  }
};

/**
 * GET /api/admin/payments
 * Get paginated list of payments with decrypted data for admin view
 */
router.get('/payments', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate, 
      endDate,
      search 
    } = req.query;

    // Generate payment report with decrypted data
    const job = await queuePaymentOperation('generate-payment-report', {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 30 days
      endDate: endDate || new Date().toISOString(),
      includeDecrypted: true
    });

    const result = await job.waitUntilFinished(queueEvents);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment data'
      });
    }

    let payments = result.report.payments;

    // Apply filters
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(p => 
        p.order_id.toLowerCase().includes(searchLower) ||
        (p.customerEmail && p.customerEmail.toLowerCase().includes(searchLower)) ||
        (p.customerName && p.customerName.toLowerCase().includes(searchLower)) ||
        (p.transaction_id && p.transaction_id.toLowerCase().includes(searchLower))
      );
    }

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayments = payments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: payments.length,
          total_pages: Math.ceil(payments.length / limit)
        },
        summary: result.report.summary,
        filters: {
          status,
          startDate: result.report.period.startDate,
          endDate: result.report.period.endDate,
          search
        }
      }
    });

  } catch (error) {
    console.error('Admin payments list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/payments/:orderId
 * Get detailed payment information including history
 */
router.get('/payments/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const job = await queuePaymentOperation('get-payment-status', { orderId });
    const result = await job.waitUntilFinished(queueEvents);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Decrypt sensitive data for admin view
    const payment = {
      ...result.payment,
      customerEmail: result.payment.customerEmail ? decrypt(result.payment.customerEmail) : null,
      customerName: result.payment.customerName ? decrypt(result.payment.customerName) : null,
      customerPhone: result.payment.customerPhone ? decrypt(result.payment.customerPhone) : null,
      productInfo: result.payment.productInfo ? JSON.parse(decrypt(result.payment.productInfo)) : null
    };

    res.json({
      success: true,
      data: {
        payment,
        // You can add payment history here if needed
      }
    });

  } catch (error) {
    console.error('Admin payment detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment details',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/payments/:orderId/status
 * Update payment status (admin action)
 */
router.put('/payments/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user?.id; // From JWT token

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const job = await queuePaymentOperation('update-payment-status', {
      orderId,
      status,
      notes: notes || `Status updated by admin (ID: ${adminId})`
    });

    const result = await job.waitUntilFinished(queueEvents);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: {
          orderId: result.orderId,
          newStatus: result.status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }

  } catch (error) {
    console.error('Admin payment status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/payments/:orderId/refund
 * Process payment refund
 */
router.post('/payments/:orderId/refund', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, reason } = req.body;
    const adminId = req.user?.id; // From JWT token

    if (!refundAmount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount and reason are required'
      });
    }

    if (parseFloat(refundAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be greater than 0'
      });
    }

    const job = await queuePaymentOperation('refund-payment', {
      orderId,
      refundAmount: parseFloat(refundAmount),
      reason,
      adminId
    });

    const result = await job.waitUntilFinished(queueEvents);

    if (result.success) {
      res.json({
        success: true,
        message: 'Refund request processed successfully',
        data: {
          refundId: result.refundId,
          orderId: result.orderId,
          refundAmount: result.refundAmount,
          status: result.status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }

  } catch (error) {
    console.error('Admin payment refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/payments/:orderId/verify
 * Verify payment manually
 */
router.post('/payments/:orderId/verify', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { expectedAmount, expectedCurrency } = req.body;

    if (!expectedAmount || !expectedCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Expected amount and currency are required'
      });
    }

    const job = await queuePaymentOperation('verify-payment', {
      orderId,
      expectedAmount: parseFloat(expectedAmount),
      expectedCurrency
    });

    const result = await job.waitUntilFinished(queueEvents);

    res.json({
      success: true,
      data: {
        verified: result.verified,
        payment: result.payment,
        message: result.message
      }
    });

  } catch (error) {
    console.error('Admin payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/payments/reports/summary
 * Get payment summary statistics
 */
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const job = await queuePaymentOperation('generate-payment-report', {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      includeDecrypted: false
    });

    const result = await job.waitUntilFinished(queueEvents);

    if (result.success) {
      res.json({
        success: true,
        data: {
          summary: result.report.summary,
          period: result.report.period,
          generatedAt: result.report.generatedAt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate payment summary'
      });
    }

  } catch (error) {
    console.error('Admin payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment summary',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/payments/cleanup
 * Archive old completed payments
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { retentionDays = 365 } = req.body;
    const adminId = req.user?.id;

    const job = await queuePaymentOperation('cleanup-old-payments', {
      retentionDays: parseInt(retentionDays)
    });

    const result = await job.waitUntilFinished(queueEvents);

    if (result.success) {
      res.json({
        success: true,
        message: 'Payment cleanup completed successfully',
        data: {
          archivedCount: result.archivedCount,
          deletedCount: result.deletedCount,
          cutoffDate: result.cutoffDate,
          requestedBy: adminId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup payments'
      });
    }

  } catch (error) {
    console.error('Admin payment cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup payments',
      error: error.message
    });
  }
});

module.exports = router;
