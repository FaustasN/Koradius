import React, { useState, useEffect } from 'react';

// Import the existing admin API service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Get auth token from cookie (same as in adminApiService)
const getAuthToken = (): string | null => {
  const nameEQ = "adminToken=";
  const ca = document.cookie.split(';');
  for (const cookie of ca) {
    let c = cookie;
    while (c.startsWith(' ')) c = c.substring(1, c.length);
    if (c.startsWith(nameEQ)) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Create authenticated request headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

interface Payment {
  id: number;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  paid_at?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  productInfo?: any;
}

interface PaymentSummary {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalAmount: number;
  currencies: string[];
}

interface PaymentListResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
    summary: PaymentSummary;
    filters: {
      status?: string;
      startDate: string;
      endDate: string;
      search?: string;
    };
  };
}

const AdminPaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        startDate,
        endDate,
      });

      if (statusFilter) params.append('status', statusFilter);
      if (searchFilter) params.append('search', searchFilter);

      const response = await fetch(`/api/admin/payments/payments?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data: PaymentListResponse = await response.json();
      
      if (data.success) {
        setPayments(data.data.payments);
        setSummary(data.data.summary);
        setTotalPages(data.data.pagination.total_pages);
      } else {
        throw new Error('Failed to load payment data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter, searchFilter, startDate, endDate]);

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/payments/payments/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          notes: `Status updated via admin panel`
        }),
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list
        alert('Payment status updated successfully');
      } else {
        alert('Failed to update payment status');
      }
    } catch (error) {
      alert('Error updating payment status');
    }
  };

  const processRefund = async (orderId: string, refundAmount: number, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/payments/${orderId}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          refundAmount,
          reason
        }),
      });

      if (response.ok) {
        fetchPayments(); // Refresh the list
        alert('Refund processed successfully');
      } else {
        alert('Failed to process refund');
      }
    } catch (error) {
      alert('Error processing refund');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'refunded': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const PaymentDetailsModal = ({ payment, onClose }: { payment: Payment; onClose: () => void }) => {
    const [newStatus, setNewStatus] = useState(payment.status);
    const [refundAmount, setRefundAmount] = useState(payment.amount.toString());
    const [refundReason, setRefundReason] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Payment Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order ID</label>
              <p className="mt-1 text-sm text-gray-900">{payment.order_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <p className="mt-1 text-sm text-gray-900">{payment.amount} {payment.currency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                {payment.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <p className="mt-1 text-sm text-gray-900">{payment.payment_method || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <p className="mt-1 text-sm text-gray-900">{payment.transaction_id || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created At</label>
              <p className="mt-1 text-sm text-gray-900">{new Date(payment.created_at).toLocaleString()}</p>
            </div>
            {payment.paid_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Paid At</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(payment.paid_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{payment.customerName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{payment.customerEmail || 'N/A'}</p>
              </div>
              {payment.customerPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{payment.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          {payment.productInfo && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Product Information</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(payment.productInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">Actions</h3>
              
              {/* Update Status */}
              <div className="flex items-center space-x-3 mb-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                <button
                  onClick={() => updatePaymentStatus(payment.order_id, newStatus)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>

              {/* Process Refund */}
              {payment.status === 'completed' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Process Refund</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Refund Amount</label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        step="0.01"
                        max={payment.amount}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                        rows={3}
                        placeholder="Reason for refund..."
                      />
                    </div>
                    <button
                      onClick={() => processRefund(payment.order_id, parseFloat(refundAmount), refundReason)}
                      disabled={!refundAmount || !refundReason}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Process Refund
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Successful</h3>
              <p className="text-2xl font-bold text-green-600">{summary.successfulPayments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Failed</h3>
              <p className="text-2xl font-bold text-red-600">{summary.failedPayments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-2xl font-bold text-gray-900">€{summary.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Order ID, email, name..."
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.order_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{payment.customerName || 'N/A'}</div>
                    <div className="text-gray-400">{payment.customerEmail || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.amount} {payment.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => {
            setShowDetails(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminPaymentManagement;
