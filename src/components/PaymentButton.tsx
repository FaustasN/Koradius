import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
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
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  currency = 'EUR',
  orderId,
  description = '',
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const handlePayment = () => {
    setIsLoading(true);
    
    // Navigate to payment page with parameters
    const params = new URLSearchParams({
      amount: amount.toString(),
      orderId,
      description: encodeURIComponent(description)
    });
    
    navigate(`/payment?${params.toString()}`);
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
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
          {t('home.featuredTours.paymentSection.processing')}
        </>
      ) : (
        <>
          <CreditCardIcon className="h-5 w-5 mr-2" />
          {t('home.featuredTours.paymentSection.payAmount').replace('{amount}', amount.toFixed(2)).replace('{currency}', currency)}
        </>
      )}
    </button>
  );
};

export default PaymentButton;
