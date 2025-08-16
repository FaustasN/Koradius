import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, X, Calendar, Users, Phone, Mail, User, CreditCard } from 'lucide-react';
import { travelPacketsApi, transformTravelPacket, apiService } from '../services/apiService';
import { notificationUtils } from '../utils/notificationUtils';

const FeaturedToursWithPayment = () => {
  const navigate = useNavigate();
  
  // Database state
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    departureDate: '',
    returnDate: '',
    numberOfPeople: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    name: '',
    email: ''
  });

  // Load featured tours from database
  useEffect(() => {
    const loadFeaturedTours = async () => {
      try {
        setLoading(true);
        const packets = await travelPacketsApi.getAll();
        const transformedTours = packets.map(transformTravelPacket);
        // Get first 3 tours as featured
        setTours(transformedTours.slice(0, 3));
      } catch (err) {
        console.error('Error loading featured tours:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTours();
  }, []);

  const handleBookNow = (tour: any) => {
    setSelectedTour(tour);
    setShowBookingForm(true);
    // Reset form
    setBookingForm({
      name: '',
      phone: '',
      email: '',
      departureDate: '',
      returnDate: '',
      numberOfPeople: 1
    });
  };

  const handleMoreInfo = (tourId: number) => {
    navigate(`/search?tour=${tourId}&details=true`);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingForm.name.trim() || !bookingForm.phone.trim() || !bookingForm.email.trim() || 
        !bookingForm.departureDate || !bookingForm.returnDate || bookingForm.numberOfPeople < 1) {
      alert('Prašome užpildyti visus laukus');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically send the booking data to your backend
      console.log('Booking submitted:', {
        tour: selectedTour,
        customer: bookingForm
      });
      
      // Auto-fill payment form with booking data
      setPaymentForm({
        name: bookingForm.name,
        email: bookingForm.email
      });
      
      // Show payment options after successful booking
      setBookingConfirmed(true);
      setShowPaymentOptions(true);
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Atsiprašome, įvyko klaida. Bandykite dar kartą.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setShowBookingForm(false);
    setSelectedTour(null);
    setShowPaymentOptions(false);
    setBookingConfirmed(false);
    setPaymentForm({ name: '', email: '' });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.name.trim() || !paymentForm.email.trim()) {
      notificationUtils.showError('Prašome užpildyti visus laukus');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const orderId = generateOrderId();
      const amount = calculateTotalPrice();
      const description = `${selectedTour?.title} - ${bookingForm.numberOfPeople} asm.`;

      const response = await apiService.post('/payment/create', {
        amount,
        currency: 'EUR',
        orderId,
        description,
        customerName: paymentForm.name,
        customerEmail: paymentForm.email,
        tourId: selectedTour?.id,
        numberOfPeople: bookingForm.numberOfPeople,
        departureDate: bookingForm.departureDate,
        returnDate: bookingForm.returnDate
      });

      if (response.paymentUrl) {
        // Redirect to Paysera
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Nepavyko gauti mokėjimo URL');
      }
      
    } catch (error) {
      console.error('Payment creation error:', error);
      notificationUtils.showError('Įvyko klaida kuriant mokėjimą');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `KOR-${timestamp}-${random}`.toUpperCase();
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 'New': return 'bg-gradient-to-r from-green-400 to-green-500 text-white';
      case 'Sale': return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedTour) return 0;
    const basePrice = selectedTour.price || 0;
    return basePrice * bookingForm.numberOfPeople;
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Kraunama...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Featured Tours Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Populiariausi kelionių paketai
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Atraskite geriausius kelionių pasiūlymus ir planuokite savo svajonių kelionę su mumis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Tour Image */}
                <div className="relative h-48 bg-gray-200">
                  {tour.image && (
                    <img
                      src={tour.image}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {tour.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(tour.badge)}`}>
                      {tour.badge}
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                </div>

                {/* Tour Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{tour.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{tour.description}</p>
                  
                  {/* Tour Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{tour.destination}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{tour.duration} dienų</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">Min. {tour.minPeople} asm.</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">€{tour.price}</span>
                      <span className="text-gray-500 text-sm"> / asmeniui</span>
                    </div>
                    <div className="space-x-2">
                    
                      <button
                        onClick={() => handleBookNow(tour)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Užsakyti
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Tours Button */}
          <div className="text-center mt-12">
            <Link
              to="/search"
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Peržiūrėti visus kelionių paketus
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {bookingConfirmed ? 'Mokėjimo pasirinkimas' : 'Kelionės užsakymas'}
                </h3>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {!bookingConfirmed ? (
                // Booking Form
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vardas ir pavardė *
                      </label>
                      <input
                        type="text"
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefono numeris *
                      </label>
                      <input
                        type="tel"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      El. pašto adresas *
                    </label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Išvykimo data *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.departureDate}
                        onChange={(e) => setBookingForm({...bookingForm, departureDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grįžimo data *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.returnDate}
                        onChange={(e) => setBookingForm({...bookingForm, returnDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Žmonių skaičius *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bookingForm.numberOfPeople}
                      onChange={(e) => setBookingForm({...bookingForm, numberOfPeople: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'Siunčiama...' : 'Patvirtinti užsakymą'}
                  </button>
                </form>
              ) : (
                // Payment Options
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <CheckIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">Užsakymas patvirtintas!</h4>
                        <p className="text-green-700 text-sm">Dabar galite atlikti mokėjimą</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Užsakymo informacija</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kelionė:</span>
                        <span className="font-medium">{selectedTour?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Žmonių skaičius:</span>
                        <span className="font-medium">{bookingForm.numberOfPeople}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bendra suma:</span>
                        <span className="font-bold text-lg text-blue-600">
                          €{calculateTotalPrice().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Mokėjimo informacija:</h4>
                    
                    {/* Payment Form */}
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vardas ir pavardė *
                        </label>
                        <input
                          type="text"
                          value={paymentForm.name}
                          onChange={(e) => setPaymentForm({...paymentForm, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          El. paštas *
                        </label>
                        <input
                          type="email"
                          value={paymentForm.email}
                          onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-800 font-medium">Bendra suma:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            €{calculateTotalPrice().toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessingPayment}
                        className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Apdorojama...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            Mokėti Paysera
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Arba susisiekite su mumis tiesiogiai:
                      </p>
                      <div className="flex justify-center space-x-4 mt-2">
                        <a
                          href={`tel:+370XXXXXXXX`}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          +370 XXX XXX XXX
                        </a>
                        <a
                          href={`mailto:info@koradius-travel.com`}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          info@koradius-travel.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Simple Check Icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default FeaturedToursWithPayment;

