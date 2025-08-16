import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';
import { notificationUtils } from '../utils/notificationUtils';

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    // Get payment details from URL parameters
    const amountParam = searchParams.get('amount');
    const orderIdParam = searchParams.get('orderId');
    const descriptionParam = searchParams.get('description');

    if (amountParam) {
      setAmount(parseFloat(amountParam));
    }
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
    if (descriptionParam) {
      setDescription(decodeURIComponent(descriptionParam));
    }
  }, [searchParams]);

  const handlePaymentSuccess = (paymentUrl: string) => {
    notificationUtils.showSuccess('Mokėjimas sėkmingai sukurtas!');
    console.log('Payment URL:', paymentUrl);
  };

  const handlePaymentError = (error: string) => {
    notificationUtils.showError(error);
  };

  if (!amount || !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Mokėjimo informacija nepilna
          </h2>
          <p className="text-gray-600 mb-4">
            Mokėjimo suma arba užsakymo ID nerastas URL parametruose.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Grįžti į pagrindinį puslapį
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Mokėjimo puslapis
            </h1>
            <p className="text-gray-600">
              Užpildykite formą ir atlikite mokėjimą saugiai per Paysera
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Payment Form */}
            <div>
              <PaymentForm
                amount={amount}
                currency="EUR"
                orderId={orderId}
                description={description}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Mokėjimo informacija
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Užsakymo ID:</span>
                  <span className="font-semibold">{orderId}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Suma:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {amount.toFixed(2)} EUR
                  </span>
                </div>

                {description && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Aprašymas:</span>
                    <span className="font-medium">{description}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Saugumas
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• SSL šifravimas</li>
                  <li>• Paysera saugumo standartai</li>
                  <li>• Jūsų duomenys saugomi saugiai</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  Mokėjimo metodai
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Kreditinės/debetinės kortelės</li>
                  <li>• Banko pavedimas</li>
                  <li>• Paysera piniginė</li>
                  <li>• SMS mokėjimas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Dažnai užduodami klausimai
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Ar mokėjimas yra saugus?
                </h4>
                <p className="text-gray-600 text-sm">
                  Taip, visi mokėjimai vyksta per Paysera, kuri yra licencijuota finansų institucija 
                  ir atitinka ES saugumo standartus.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Kiek laiko užtrunka mokėjimas?
                </h4>
                <p className="text-gray-600 text-sm">
                  Kortelių mokėjimai apdorojami iškart, banko pavedimai gali užtrukti 1-3 darbo dienas.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Ar galiu atšaukti mokėjimą?
                </h4>
                <p className="text-gray-600 text-sm">
                  Mokėjimą galite atšaukti iki jo patvirtinimo. Po patvirtinimo mokėjimo atšaukti negalima.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

