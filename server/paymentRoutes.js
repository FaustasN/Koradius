const express = require('express');
const WebToPay = require('./webtopay');
const { queuePaymentOperation } = require('./queues/paymentQueue');
const { QueueEvents } = require('bullmq');
const { redisConfig } = require('./queues/config');
const router = express.Router();

// Initialize queue events for waiting on job completion
const queueEvents = new QueueEvents('payment processing', { connection: redisConfig });

// WebToPay configuration
const WEBTOPAY_CONFIG = {
    PROJECT_ID: process.env.WEBTOPAY_PROJECT_ID || '249340',
    PASSWORD: process.env.WEBTOPAY_PASSWORD || 'add08f927c0dec3bdf1f6d3af8db187e',
    TEST_MODE: process.env.WEBTOPAY_TEST_MODE === 'true' || false
};

/**
 * POST /api/payment/create
 * Creates a new payment request
 */
router.post('/create', async (req, res) => {
    try {
        const { amount, currency, orderId, description, customerEmail, customerName, customerPhone, productInfo } = req.body;

        // Validate required fields
        if (!amount || !currency || !orderId || !customerEmail || !customerName) {
            return res.status(400).json({
                success: false,
                message: 'Amount, currency, orderId, customerEmail, and customerName are required'
            });
        }

        // Get base URL for callbacks
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

        // Queue payment record creation
        await queuePaymentOperation('create-payment', {
            orderId,
            amount: parseFloat(amount),
            currency: currency.toUpperCase(),
            description: description || `Order ${orderId}`,
            customerEmail,
            customerName,
            customerPhone,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            productInfo
        });

        // Build payment request data
        const paymentData = {
            projectid: WEBTOPAY_CONFIG.PROJECT_ID,
            sign_password: WEBTOPAY_CONFIG.PASSWORD,
            orderid: orderId,
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase(),
            country: 'LT',
            accepturl: `${baseUrl}/api/payment/accept`,
            cancelurl: `${baseUrl}/api/payment/cancel`,
            callbackurl: `${baseUrl}/api/payment/callback`,
            test: WEBTOPAY_CONFIG.TEST_MODE ? 1 : 0,
            lang: 'lt',
            paytext: description || `Order ${orderId}`,
            p_email: customerEmail,
            p_firstname: customerName?.split(' ')[0] || '',
            p_lastname: customerName?.split(' ').slice(1).join(' ') || ''
        };

        // Build payment URL
        const paymentUrl = WebToPay.buildPaymentUrl(paymentData);

        res.json({
            success: true,
            paymentUrl,
            orderId,
            amount,
            currency
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment',
            error: error.message
        });
    }
});

/**
 * GET/POST /api/payment/accept
 * Handles successful payment redirect
 */
router.get('/accept', handlePaymentAccept);
router.post('/accept', handlePaymentAccept);

async function handlePaymentAccept(req, res) {
    try {
        // Log all query parameters and body to see what Paysera sends
        console.log('=== PAYMENT ACCEPT CALLBACK ===');
        console.log('Method:', req.method);
        console.log('Query parameters:', req.query);
        console.log('Body:', req.body);
        console.log('Request URL:', req.url);
        console.log('Request headers:', req.headers);
        
        // Paysera might use different parameter names - check both query and body
        const allParams = { ...req.query, ...req.body };
        let orderid = allParams.orderid || allParams.order_id || allParams.orderId || allParams.projectorder;
        
        // If no direct orderid found, try to extract from Paysera data parameter
        if (!orderid && allParams.data) {
            try {
                // Decode base64 data parameter
                const decodedData = Buffer.from(allParams.data, 'base64').toString('utf-8');
                console.log('Decoded Paysera data:', decodedData);
                
                // Parse URL-encoded parameters from decoded data
                const urlParams = new URLSearchParams(decodedData);
                orderid = urlParams.get('orderid');
                
                // Also extract other useful information
                const status = urlParams.get('status');
                const amount = urlParams.get('amount');
                const currency = urlParams.get('currency');
                const paymentMethod = urlParams.get('payment');
                
                console.log('Extracted from Paysera data:', {
                    orderid,
                    status,
                    amount,
                    currency,
                    paymentMethod
                });
            } catch (error) {
                console.error('Error decoding Paysera data parameter:', error);
            }
        }
        
        console.log('All combined params:', allParams);
        console.log('Final extracted orderid:', orderid);
        
        if (!orderid) {
            console.error('No orderid found in accept callback. Available params:', Object.keys(allParams));
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/payment-cancelled?error=missing_orderid`);
            return;
        }

        // Get payment data from database
        try {
            const job = await queuePaymentOperation('get-payment-status', { orderId: orderid });
            const result = await job.waitUntilFinished(queueEvents);
            
            let paymentData = {
                amount: '0',
                currency: 'EUR',
                paymentMethod: 'Nenurodyta'
            };

            if (result.success) {
                paymentData = {
                    amount: result.payment.amount,
                    currency: result.payment.currency,
                    paymentMethod: result.payment.paymentMethod || 'Nenurodyta'
                };
            }

            // Redirect to frontend success page with payment details
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const successUrl = `${frontendUrl}/payment-success?orderid=${orderid}&amount=${paymentData.amount}&currency=${paymentData.currency}&payment=${paymentData.paymentMethod}`;
            
            console.log('Redirecting to success page:', successUrl);
            res.redirect(successUrl);
            
        } catch (error) {
            console.error('Error retrieving payment data:', error);
            // Fallback to query parameters if available
            const allParams = { ...req.query, ...req.body };
            const amount = allParams.amount;
            const currency = allParams.currency;
            const payment = allParams.payment;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const successUrl = `${frontendUrl}/payment-success?orderid=${orderid}&amount=${amount || '0'}&currency=${currency || 'EUR'}&payment=${payment || 'Nenurodyta'}`;
            res.redirect(successUrl);
        }
        
    } catch (error) {
        console.error('Payment accept error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-cancelled?error=server_error`);
    }
}

/**
 * GET/POST /api/payment/cancel
 * Handles cancelled payment redirect
 */
router.get('/cancel', handlePaymentCancel);
router.post('/cancel', handlePaymentCancel);

function handlePaymentCancel(req, res) {
    try {
        // Log all query parameters and body to see what Paysera sends
        console.log('=== PAYMENT CANCEL CALLBACK ===');
        console.log('Method:', req.method);
        console.log('Query parameters:', req.query);
        console.log('Body:', req.body);
        console.log('Request URL:', req.url);
        
        // Paysera might use different parameter names - check both query and body
        const allParams = { ...req.query, ...req.body };
        let orderid = allParams.orderid || allParams.order_id || allParams.orderId || allParams.projectorder;
        let amount = allParams.amount;
        let currency = allParams.currency;
        
        // If no direct orderid found, try to extract from Paysera data parameter
        if (!orderid && allParams.data) {
            try {
                // Decode base64 data parameter
                const decodedData = Buffer.from(allParams.data, 'base64').toString('utf-8');
                console.log('Decoded Paysera data:', decodedData);
                
                // Parse URL-encoded parameters from decoded data
                const urlParams = new URLSearchParams(decodedData);
                orderid = urlParams.get('orderid');
                amount = amount || urlParams.get('amount');
                currency = currency || urlParams.get('currency');
                
                console.log('Extracted from Paysera data:', {
                    orderid,
                    amount,
                    currency
                });
            } catch (error) {
                console.error('Error decoding Paysera data parameter in cancel:', error);
            }
        }
        
        console.log('All combined params:', allParams);
        console.log('Processed cancel data:', { orderid, amount, currency });

        // Redirect to frontend cancel page with order ID and amount
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelUrl = `${frontendUrl}/payment-cancelled?orderid=${orderid}&amount=${amount}&currency=${currency}`;
        
        console.log('Redirecting to cancel page:', cancelUrl);
        res.redirect(cancelUrl);
        
    } catch (error) {
        console.error('Payment cancel error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-cancelled?error=server_error`);
    }
}

/**
 * POST /api/payment/callback
 * Handles WebToPay callback (server-to-server)
 */
router.post('/callback', async (req, res) => {
    try {
        // Validate and parse callback data
        const response = WebToPay.validateAndParseData(
            req.body,
            WEBTOPAY_CONFIG.PROJECT_ID,
            WEBTOPAY_CONFIG.PASSWORD
        );

        console.log('Payment callback received:', response);

        const orderId = response.orderid;
        const status = response.status === '1' ? 'completed' : 'failed';
        const payAmount = response.payamount ? response.payamount / 100 : response.amount / 100;
        const payCurrency = response.paycurrency || response.currency;
        const paymentMethod = response.payment;
        const transactionId = response.requestid || response.transaction || null;

        // Queue payment callback processing
        await queuePaymentOperation('process-callback', {
            orderId,
            status,
            amount: payAmount,
            currency: payCurrency,
            paymentMethod,
            transactionId,
            gatewayResponse: response,
            paidAt: status === 'completed' ? new Date() : null
        });

        console.log(`Payment callback queued for processing: ${orderId}, status: ${status}`);

        // Send success response to WebToPay
        res.send('OK');

    } catch (error) {
        console.error('Payment callback error:', error);
        res.status(400).send(`Error: ${error.message}`);
    }
});

/**
 * GET /api/payment/status/:orderId
 * Get payment status for an order
 */
router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Queue payment status check
        const job = await queuePaymentOperation('get-payment-status', { orderId });
        
        // Wait for job completion (with timeout)
        const result = await job.waitUntilFinished(queueEvents);
        
        if (result.success) {
            res.json({
                success: true,
                orderId,
                status: result.payment.status,
                amount: result.payment.amount,
                currency: result.payment.currency,
                message: 'Payment status retrieved successfully'
            });
        } else {
            res.json({
                success: false,
                orderId,
                status: 'not_found',
                message: result.message || 'Payment not found'
            });
        }

    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
});

/**
 * GET /api/payment/data/:orderId
 * Get payment data for an order
 */
router.get('/data/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Queue payment data retrieval
        const job = await queuePaymentOperation('get-payment-status', { orderId });
        const result = await job.waitUntilFinished(queueEvents);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    orderId: result.payment.orderId,
                    amount: result.payment.amount,
                    currency: result.payment.currency,
                    status: result.payment.status,
                    paymentMethod: result.payment.paymentMethod,
                    createdAt: result.payment.createdAt,
                    paidAt: result.payment.paidAt
                }
            });
        } else {
            res.json({
                success: false,
                message: result.message || 'Payment data not found'
            });
        }
    } catch (error) {
        console.error('Payment data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment data'
        });
    }
});

/**
 * GET /api/payment/methods
 * Get available payment methods
 */
router.get('/methods', async (req, res) => {
    try {
        // This would typically fetch from WebToPay API
        // For now, returning common payment methods
        
        const paymentMethods = [
            {
                key: 'bank',
                title: 'Bank Transfer',
                logo: '/images/payment/bank.png',
                minAmount: 1,
                maxAmount: 10000,
                currency: 'EUR'
            },
            {
                key: 'card',
                title: 'Credit/Debit Card',
                logo: '/images/payment/card.png',
                minAmount: 1,
                maxAmount: 10000,
                currency: 'EUR'
            },
            {
                key: 'wallet',
                title: 'Paysera Wallet',
                logo: '/images/payment/wallet.png',
                minAmount: 1,
                maxAmount: 10000,
                currency: 'EUR'
            }
        ];

        res.json({
            success: true,
            paymentMethods
        });

    } catch (error) {
        console.error('Payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment methods',
            error: error.message
        });
    }
});

/**
 * GET /api/payment/test-success/:orderId
 * Test endpoint to simulate successful payment callback
 */
router.get('/test-success/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        console.log('=== TEST PAYMENT SUCCESS SIMULATION ===');
        console.log('Simulating successful payment for orderId:', orderId);
        
        // Update payment status to completed
        await queuePaymentOperation('update-payment-status', {
            orderId,
            status: 'completed',
            paymentMethod: 'Test Bank',
            transactionId: `TEST-${Date.now()}`
        });
        
        // Redirect to frontend success page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const successUrl = `${frontendUrl}/payment-success?orderid=${orderId}&amount=200&currency=EUR&payment=Test Bank`;
        
        console.log('Redirecting to success page:', successUrl);
        res.redirect(successUrl);
        
    } catch (error) {
        console.error('Test payment success error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-cancelled?error=test_error`);
    }
});

/**
 * GET /api/payment/test-cancel/:orderId
 * Test endpoint to simulate cancelled payment callback
 */
router.get('/test-cancel/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        console.log('=== TEST PAYMENT CANCEL SIMULATION ===');
        console.log('Simulating cancelled payment for orderId:', orderId);
        
        // Update payment status to cancelled
        await queuePaymentOperation('update-payment-status', {
            orderId,
            status: 'cancelled',
            paymentMethod: null,
            transactionId: null
        });
        
        // Redirect to frontend cancelled page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelUrl = `${frontendUrl}/payment-cancelled?orderid=${orderId}&amount=200&currency=EUR`;
        
        console.log('Redirecting to cancel page:', cancelUrl);
        res.redirect(cancelUrl);
        
    } catch (error) {
        console.error('Test payment cancel error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/payment-cancelled?error=test_error`);
    }
});

module.exports = router;

