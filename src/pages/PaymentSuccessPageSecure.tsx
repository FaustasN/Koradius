import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

// Simple Check Circle Icon component
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    amount: string;
    currency: string;
    paymentMethod: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPaymentToken = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token');
        
        if (!token) {
          setError('No payment verification token found. This may be an invalid or expired link.');
          setLoading(false);
          return;
        }

        // Verify token with backend
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/payment/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.message || 'Payment verification failed');
          setLoading(false);
          return;
        }

        // Set verified payment details
        setOrderDetails({
          orderId: result.payment.orderId,
          amount: parseFloat(result.payment.amount).toFixed(2),
          currency: result.payment.currency,
          paymentMethod: result.payment.paymentMethod
        });

        setLoading(false);

      } catch (error) {
        console.error('Payment verification error:', error);
        setError('Failed to verify payment. Please contact support if you believe this is an error.');
        setLoading(false);
      }
    };

    verifyPaymentToken();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900">Verifying payment...</h2>
            <p className="text-sm text-gray-600 mt-2">Please wait while we confirm your payment details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Payment Verification Failed</h2>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <Link 
                to="/contact" 
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link 
                to="/" 
                className="block w-full text-blue-600 hover:text-blue-500 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p>No payment details available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Ačiū už mokėjimą!
        </h1>

        <p className="text-gray-600 mb-8">
          Jūsų mokėjimas buvo sėkmingai apdorotas. Neužilgo atsitysime kelionės dokumentus.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Mokėjimo informacija</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Užsakymo ID:</span>
              <span className="font-medium text-gray-800">{orderDetails.orderId}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Suma:</span>
              <span className="font-medium text-gray-800 text-green-600">
                {orderDetails.amount} {orderDetails.currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mokėjimo metodas:</span>
              <span className="font-medium text-gray-800">{orderDetails.paymentMethod}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Ką toliau?</h3>
          <ul className="text-left text-blue-700 space-y-2">
            <li>• Patvirtinimo laiškas išsiųstas jūsų el. paštą</li>
            <li>• Kelionės dokumentai bus išsiųsti per 24-48 valandas</li>
            <li>• Jei turite klausimų, susisiekite su mumis</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Grįžti į pagrindinį puslapį
          </Link>
          <Link
            to="/contact"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Susisiekti su mumis
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Linkėjimai,</p>
          <p>UAB Koradius komanda</p>
          <div className="mt-4">
            <a 
              href="https://koradius-travel.com" 
              className="text-blue-600 hover:text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              koradius-travel.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
