/**
 * Payment Method Mapper (Frontend)
 * Maps Paysera internal payment method identifiers to user-friendly names
 */

const PAYMENT_METHOD_MAP: Record<string, string> = {
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
 * @param payseraMethod - Paysera internal method identifier
 * @returns User-friendly payment method name
 */
export function mapPaymentMethod(payseraMethod: string | null | undefined): string {
  if (!payseraMethod) {
    return 'Nenurodyta';
  }
  
  const method = payseraMethod.toLowerCase().trim();
  return PAYMENT_METHOD_MAP[method] || capitalizeMethod(payseraMethod);
}

/**
 * Capitalizes and formats unknown payment methods
 * @param method - Payment method to format
 * @returns Formatted payment method name
 */
function capitalizeMethod(method: string): string {
  return method
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets all available payment methods for UI
 * @returns Object with method codes as keys and friendly names as values
 */
export function getAllPaymentMethods(): Record<string, string> {
  return { ...PAYMENT_METHOD_MAP };
}

export { PAYMENT_METHOD_MAP };
