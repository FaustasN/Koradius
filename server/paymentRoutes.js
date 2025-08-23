const express = require('express');
const WebToPay = require('./webtopay');
const router = express.Router();

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
        const { amount, currency, orderId, description, customerEmail, customerName } = req.body;

        // Validate required fields
        if (!amount || !currency || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Amount, currency, and orderId are required'
            });
        }

        // Get base URL for callbacks
        const baseUrl = `${req.protocol}://${req.get('host')}`;

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
 * GET /api/payment/accept
 * Handles successful payment redirect
 */
router.get('/accept', (req, res) => {
    try {
        // Log all query parameters to see what Paysera sends
        console.log('All query parameters from Paysera (accept):', req.query);
        
        const { orderid } = req.query;
        
        if (!orderid) {
            console.error('No orderid in accept callback');
            res.redirect('/payment-error');
            return;
        }

        // Try to get payment data from callback results
        let paymentData = null;
        if (global.paymentResults && global.paymentResults[orderid]) {
            paymentData = global.paymentResults[orderid];
            console.log('Found payment data from callback:', paymentData);
        } else {
            console.log('No payment data found for orderid:', orderid);
            // Fallback to query parameters if available
            const { amount, currency, payment } = req.query;
            paymentData = {
                amount: amount || '0',
                currency: currency || 'EUR',
                paymentMethod: payment || 'Nenurodyta'
            };
        }

        // Redirect to frontend success page with payment details
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const successUrl = `${frontendUrl}/payment-success?orderid=${orderid}&amount=${paymentData.amount}&currency=${paymentData.currency}&payment=${paymentData.paymentMethod}`;
        
        console.log('Redirecting to success page:', successUrl);
        res.redirect(successUrl);
        
    } catch (error) {
        console.error('Payment accept error:', error);
        res.redirect('/payment-error');
    }
});

/**
 * GET /api/payment/cancel
 * Handles cancelled payment redirect
 */
router.get('/cancel', (req, res) => {
    try {
        // Log all query parameters to see what Paysera sends
        console.log('All query parameters from Paysera (cancel):', req.query);
        
        const { orderid, amount, currency } = req.query;
        
        console.log('Processed cancel data:', { orderid, amount, currency });

        // Redirect to frontend cancel page with order ID and amount
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelUrl = `${frontendUrl}/payment-cancelled?orderid=${orderid}&amount=${amount}&currency=${currency}`;
        
        console.log('Redirecting to cancel page:', cancelUrl);
        res.redirect(cancelUrl);
        
    } catch (error) {
        console.error('Payment cancel error:', error);
        res.redirect('/payment-error');
    }
});

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

        if (response.status === '1') {
            // Payment successful
            const orderId = response.orderid;
            const payAmount = response.payamount ? response.payamount / 100 : response.amount / 100;
            const payCurrency = response.paycurrency || response.currency;
            const paymentMethod = response.payment;
            const customerEmail = response.p_email;

            // Store payment data in memory (in production, use database)
            global.paymentResults = global.paymentResults || {};
            global.paymentResults[orderId] = {
                status: 'success',
                amount: payAmount,
                currency: payCurrency,
                paymentMethod,
                customerEmail,
                timestamp: new Date().toISOString()
            };

            console.log('Payment successful and stored:', {
                orderId,
                amount: payAmount,
                currency: payCurrency,
                paymentMethod,
                customerEmail
            });

            // Send success response to WebToPay
            res.send('OK');
            
        } else {
            // Payment failed
            console.log('Payment failed:', response);
            res.send('OK'); // Still send OK to acknowledge receipt
        }

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
        
        // Here you should check the payment status from your database
        // For now, returning a mock response
        
        res.json({
            success: true,
            orderId,
            status: 'pending', // 'pending', 'completed', 'failed', 'cancelled'
            message: 'Payment status retrieved successfully'
        });

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
router.get('/data/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (global.paymentResults && global.paymentResults[orderId]) {
            res.json({
                success: true,
                data: global.paymentResults[orderId]
            });
        } else {
            res.json({
                success: false,
                message: 'Payment data not found'
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

module.exports = router;

