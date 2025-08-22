import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Simple Credit Card Icon component
const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

interface PaymentButtonProps {
  amount: number;
  currency?: string;
  orderId: string;
  description?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  productInfo?: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  onPaymentCreated?: (paymentUrl: string) => void;
  onError?: (error: string) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  currency = 'EUR',
  orderId,
  description = '',
  customerEmail,
  customerName,
  customerPhone,
  productInfo,
  className = '',
  size = 'md',
  variant = 'primary',
  onPaymentCreated,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  };

  const handlePayment = async () => {
    if (!customerEmail || !customerName) {
      const error = 'Customer email and name are required for payment';
      onError?.(error);
      alert(error);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          description: description || `Order ${orderId}`,
          customerEmail,
          customerName,
          customerPhone,
          productInfo
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        onPaymentCreated?.(data.paymentUrl);
        // Redirect to payment gateway
        window.location.href = data.paymentUrl;
      } else {
        const error = data.message || 'Failed to create payment';
        onError?.(error);
        alert(`Payment creation failed: ${error}`);
      }
    } catch (error) {
      const errorMessage = 'Failed to connect to payment service';
      onError?.(errorMessage);
      console.error('Payment creation error:', error);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || !customerEmail || !customerName}
      className={`
        inline-flex items-center justify-center font-medium rounded-md transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Apdorojama...
        </>
      ) : (
        <>
          <CreditCardIcon className="h-5 w-5 mr-2" />
          Mokėti {amount.toFixed(2)} {currency}
        </>
      )}
    </button>
  );
};

export default PaymentButton;
