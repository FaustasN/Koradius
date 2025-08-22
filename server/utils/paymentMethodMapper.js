/**
 * Payment Method Mapper
 * Maps Paysera internal payment method identifiers to user-friendly names
 */

const PAYMENT_METHOD_MAP = {
  // Banks
  'hanza': 'Swedbank',
  'seb': 'SEB Bank',
  'luminor': 'Luminor Bank',
  'siauliu_bankas': 'Šiaulių Bankas',
  'citadele': 'Citadele Bank',
  'danske': 'Danske Bank',
  'nordea': 'Nordea Bank',
  'medicinos_bankas': 'Medicinos Bankas',
  
  // E-wallets and payment systems
  'wallet': 'Paysera Wallet',
  'revolut': 'Revolut',
  'paypal': 'PayPal',
  'paysafecard': 'Paysafecard',
  
  // Credit cards
  'visa': 'Visa',
  'mastercard': 'Mastercard',
  'maestro': 'Maestro',
  
  // Other payment methods
  'mokejimai.lt': 'Mokejimai.lt',
  'perlas': 'Perlas Terminals',
  'lpexpress': 'LP Express',
  'post': 'Lietuvos Paštas',
  
  // International
  'sofort': 'SOFORT Banking',
  'giropay': 'Giropay',
  'eps': 'EPS',
  'ideal': 'iDEAL',
  'bancontact': 'Bancontact',
  'przelewy24': 'Przelewy24',
  'trustly': 'Trustly',
  'blik': 'BLIK',
  
  // Crypto
  'bitcoin': 'Bitcoin',
  'ethereum': 'Ethereum',
  
  // Mobile payments
  'apple_pay': 'Apple Pay',
  'google_pay': 'Google Pay',
  'samsung_pay': 'Samsung Pay'
};

/**
 * Maps Paysera payment method identifier to user-friendly name
 * @param {string} payseraMethod - Paysera internal method identifier
 * @returns {string} User-friendly payment method name
 */
function mapPaymentMethod(payseraMethod) {
  if (!payseraMethod) {
    return 'Nenurodyta';
  }
  
  const method = payseraMethod.toLowerCase().trim();
  return PAYMENT_METHOD_MAP[method] || capitalizeMethod(payseraMethod);
}

/**
 * Capitalizes and formats unknown payment methods
 * @param {string} method - Payment method to format
 * @returns {string} Formatted payment method name
 */
function capitalizeMethod(method) {
  return method
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets all available payment methods for admin interface
 * @returns {Object} Object with method codes as keys and friendly names as values
 */
function getAllPaymentMethods() {
  return { ...PAYMENT_METHOD_MAP };
}

module.exports = {
  mapPaymentMethod,
  getAllPaymentMethods,
  PAYMENT_METHOD_MAP
};
