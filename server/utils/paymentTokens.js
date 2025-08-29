const crypto = require('crypto');

// Secret key for signing tokens (should be from environment)
const SECRET_KEY = process.env.PAYMENT_TOKEN_SECRET || 'your-very-secure-secret-key-change-this';

/**
 * Creates a secure payment verification token
 * @param {Object} paymentData - Payment data to encode
 * @param {string} paymentData.orderId - Order ID
 * @param {string} paymentData.status - Payment status
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Payment currency
 * @param {number} expiryMinutes - Token expiry in minutes (default: 30)
 * @returns {string} Signed token
 */
function createPaymentToken(paymentData, expiryMinutes = 30) {
  const expiry = Date.now() + (expiryMinutes * 60 * 1000);
  
  const payload = {
    orderId: paymentData.orderId,
    status: paymentData.status,
    amount: paymentData.amount,
    currency: paymentData.currency,
    paymentMethod: paymentData.paymentMethod, // Include payment method in token
    timestamp: Date.now(),
    expiry: expiry
  };
  
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadString).toString('base64');
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('hex');
  
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies and decodes a payment token
 * @param {string} token - The token to verify
 * @returns {Object|null} Decoded payment data or null if invalid
 */
function verifyPaymentToken(token) {
  try {
    const [payloadBase64, signature] = token.split('.');
    
    if (!payloadBase64 || !signature) {
      return null;
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payloadBase64)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.log('Invalid token signature');
      return null;
    }
    
    // Decode payload
    const payloadString = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadString);
    
    // Check expiry
    if (Date.now() > payload.expiry) {
      console.log('Token expired');
      return null;
    }
    
    return payload;
    
  } catch (error) {
    console.error('Error verifying payment token:', error);
    return null;
  }
}

/**
 * Creates a one-time use payment URL with secure token
 * @param {Object} paymentData - Payment data
 * @param {string} baseUrl - Base frontend URL
 * @param {string} path - Path to redirect to (default: '/payment-success')
 * @returns {string} Secure payment URL
 */
function createSecurePaymentUrl(paymentData, baseUrl, path = '/payment-success') {
  const token = createPaymentToken(paymentData);
  return `${baseUrl}${path}?token=${token}`;
}

module.exports = {
  createPaymentToken,
  verifyPaymentToken,
  createSecurePaymentUrl
};
