import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// Simple X Circle Icon component
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PaymentCancelledPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');

  useEffect(() => {
    // Get order ID and other details from URL parameters
    const orderIdParam = searchParams.get('orderid');
    const amountParam = searchParams.get('amount');
    const currencyParam = searchParams.get('currency');

    // Debug: log all URL parameters
    console.log('PaymentCancelledPage - URL parameters:', {
      orderId: orderIdParam,
      amount: amountParam,
      currency: currencyParam,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
    if (amountParam) {
      setAmount(amountParam);
    }
    if (currencyParam) {
      setCurrency(currencyParam);
    }
  }, [searchParams]);

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

        {(orderId || amount) && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Užsakymo informacija
            </h2>
            
            <div className="text-left space-y-3">
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Užsakymo ID:</span>
                  <span className="font-semibold">{orderId}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Suma:</span>
                  <span className="font-semibold text-red-600">
                    {parseFloat(amount) > 1000 ? (parseFloat(amount) / 100).toFixed(2) : parseFloat(amount).toFixed(2)} {currency || 'EUR'}
                  </span>
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
