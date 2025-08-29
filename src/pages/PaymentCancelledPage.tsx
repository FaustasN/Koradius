import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

// Simple X Circle Icon component
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface PaymentData {
  orderId: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: string;
}

const PaymentCancelledPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    
    // Handle error cases (no token)
    if (errorParam) {
      if (errorParam === 'no_order_id') {
        setPaymentData({
          orderId: 'Nenurodyta',
          amount: '0',
          currency: 'EUR',
          paymentMethod: 'Atšaukta',
          status: 'cancelled'
        });
      } else {
        setError('Mokėjimo duomenų nėra arba nuoroda netinkama.');
      }
      setLoading(false);
      return;
    }

    if (!token) {
      // Fallback to old URL parameter system for backward compatibility
      const orderIdParam = searchParams.get('orderid');
      const amountParam = searchParams.get('amount');
      const currencyParam = searchParams.get('currency');

      console.log('PaymentCancelledPage - URL parameters (fallback):', {
        orderId: orderIdParam,
        amount: amountParam,
        currency: currencyParam,
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (orderIdParam) {
        setPaymentData({
          orderId: orderIdParam,
          amount: amountParam || '0',
          currency: currencyParam || 'EUR',
          paymentMethod: 'Nenurodyta',
          status: 'cancelled'
        });
      } else {
        setError('Mokėjimo duomenų nėra.');
      }
      setLoading(false);
      return;
    }

    // Verify secure token
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const endpoint = apiUrl ? `${apiUrl}/api/payment/verify-token` : '/api/payment/verify-token';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        setPaymentData(data.payment);
      } else {
        setError(data.message || 'Mokėjimo patvirtinimo žetonas netinkamas arba pasibaigė galiojimo laikas.');
      }
    })
    .catch(err => {
      console.error('Token verification error:', err);
      setError('Klaida tikrinant mokėjimo duomenis.');
    })
    .finally(() => {
      setLoading(false);
    });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kraunami mokėjimo duomenys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Mokėjimo patvirtinimo klaida</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-4">
            <Link
              to="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Susisiekti su mumis
            </Link>
            <br />
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Grįžti į pagrindinį puslapį
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Mokėjimas atšauktas
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Jūsų mokėjimas buvo atšauktas jūsų pačių iniciatyva. 
          Jei tai įvyko netyčia, kviečiame bandyti dar kartą.
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Užsakymo informacija
            </h2>
            
            <div className="text-left space-y-3">
              {paymentData.orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Užsakymo ID:</span>
                  <span className="font-semibold">{paymentData.orderId}</span>
                </div>
              )}
              {paymentData.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Suma:</span>
                  <span className="font-semibold text-red-600">
                    {parseFloat(paymentData.amount) > 1000 ? (parseFloat(paymentData.amount) / 100).toFixed(2) : parseFloat(paymentData.amount).toFixed(2)} {paymentData.currency || 'EUR'}
                  </span>
                </div>
              )}
              {paymentData.paymentMethod && paymentData.paymentMethod !== 'Nenurodyta' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mokėjimo būdas:</span>
                  <span className="font-semibold">{paymentData.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            Ar norite bandyti dar kartą?
          </h3>
          <p className="text-yellow-700 text-sm">
            Jei turite klausimų apie mokėjimą arba norite atlikti mokėjimą kitaip, 
            susisiekite su mumis. Mūsų komanda visada pasiruošusi padėti.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Grįžti į pagrindinį puslapį
          </Link>
          
          <Link
            to="/contact"
            className="inline-block bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium ml-4"
          >
            Susisiekti su mumis
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p>Jei turite klausimų, susisiekite:</p>
            <p className="font-medium">info@koradius-travel.com</p>
            <p>+370 XXX XXX XXX</p>
          </div>
          
          <a
            href="https://koradius-travel.com/"
            className="text-blue-600 hover:text-blue-800 text-sm block mt-2"
          >
            koradius-travel.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;
