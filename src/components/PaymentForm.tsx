import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  orderId: string;
  description?: string;
  onSuccess?: (paymentUrl: string) => void;
  onError?: (error: string) => void;
}

interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerName: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency = 'EUR',
  orderId,
  description = '',
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<PaymentData>({
    amount,
    currency,
    orderId,
    description,
    customerEmail: '',
    customerName: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerEmail) {
      newErrors.customerEmail = 'El. pašto adresas yra privalomas';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Neteisingas el. pašto adresas';
    }

    if (!formData.customerName) {
      newErrors.customerName = 'Vardas ir pavardė yra privalomi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.post('/api/payment/create', formData);

      if (response.success) {
        onSuccess?.(response.paymentUrl);
        // Redirect to payment page
        window.location.href = response.paymentUrl;
      } else {
        onError?.(response.message || 'Mokėjimo kūrimas nepavyko');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      onError?.('Įvyko klaida kuriant mokėjimą');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Mokėjimo informacija
      </h2>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Užsakymo ID:</span>
          <span className="font-semibold">{orderId}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-600">Suma:</span>
          <span className="font-bold text-lg text-blue-600">
            {amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Vardas ir pavardė *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Įveskite vardą ir pavardę"
          />
          {errors.customerName && (
            <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            El. pašto adresas *
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customerEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Įveskite el. pašto adresą"
          />
          {errors.customerEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Aprašymas
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mokėjimo aprašymas (neprivaloma)"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Apdorojama...
            </div>
          ) : (
            'Mokėti'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Paspaudę "Mokėti" būsite nukreipti į saugų mokėjimo puslapį
        </p>
        <div className="mt-3 flex justify-center space-x-4">
          <img src="/images/payment/visa.png" alt="Visa" className="h-8" />
          <img src="/images/payment/mastercard.png" alt="Mastercard" className="h-8" />
          <img src="/images/payment/paysera.png" alt="Paysera" className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;

