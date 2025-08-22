import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mapPaymentMethod } from '../utils/paymentMethodMapper';

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

  useEffect(() => {
    // Get payment details from URL parameters
    const orderId = searchParams.get('orderid');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const payment = searchParams.get('payment');

    // Debug: log all URL parameters
    console.log('PaymentSuccessPage - URL parameters:', {
      orderId,
      amount,
      currency,
      payment,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (orderId && amount && currency) {
      // Handle amount - our backend sends the amount in the correct format (euros)
      const finalAmount = parseFloat(amount).toFixed(2);

      setOrderDetails({
        orderId,
        amount: finalAmount,
        currency,
        paymentMethod: mapPaymentMethod(payment)
      });
    } else {
      console.log('Missing required parameters:', { orderId, amount, currency });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Ačiū už mokėjimą!
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Jūsų mokėjimas buvo sėkmingai apdorotas. Neužilgo atsiųsime kelionės dokumentus.
        </p>

        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Mokėjimo informacija
            </h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Užsakymo ID:</span>
                <span className="font-semibold">{orderDetails.orderId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Suma:</span>
                <span className="font-bold text-green-600">
                  {orderDetails.amount} {orderDetails.currency}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Mokėjimo metodas:</span>
                <span className="font-medium">{orderDetails.paymentMethod}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Ką toliau?
          </h3>
          <ul className="text-blue-700 text-left space-y-2">
            <li>• Patvirtinimo laiškas išsiųstas jūsų el. paštu</li>
            <li>• Kelionės dokumentai bus išsiųsti per 24-48 valandas</li>
            <li>• Jei turite klausimų, susisiekite su mumis</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Grįžti į pagrindinį puslapį
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Linkėjimai,</p>
            <p className="font-medium">UAB Koradius komanda</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a
            href="https://koradius-travel.com/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            koradius-travel.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
