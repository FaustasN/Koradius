import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, X, Calendar, Users, Phone, Mail, User, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { travelPacketsApi, transformTravelPacket, apiService } from '../services/apiService';
import { notificationUtils } from '../utils/notificationUtils';
import { useLanguage } from '../hooks/useLanguage';

const FeaturedToursWithPayment = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Database state
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const toursPerPage = 3; 

  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [showTourDetails, setShowTourDetails] = useState(false);
  const [tourDetails, setTourDetails] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    departureDate: '',
    numberOfPeople: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [departureDateError, setDepartureDateError] = useState<string>('');
  const [durationError, setDurationError] = useState<string>('');

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
        // Show all tours for carousel navigation
        setTours(transformedTours);
      } catch (err) {
        console.error('Error loading featured tours:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTours();
  }, []);

  const nextPage = () => {
    setCurrentPage((prev) => 
      prev + 1 >= Math.ceil(tours.length / toursPerPage) ? 0 : prev + 1
    );
  };

  const prevPage = () => {
    setCurrentPage((prev) => 
      prev - 1 < 0 ? Math.ceil(tours.length / toursPerPage) - 1 : prev - 1
    );
  };

  const getCurrentTours = () => {
    const startIndex = currentPage * toursPerPage;
    return tours.slice(startIndex, startIndex + toursPerPage);
  };

  const handleBookNow = (tour: any) => {
    setSelectedTour(tour);
    setShowBookingForm(true);
    // Reset form
    setBookingForm({
      name: '',
      phone: '',
      email: '',
      departureDate: '',
      numberOfPeople: 1
    });
    setPhoneError('');
    setNameError('');
    setEmailError('');
    setDepartureDateError('');
    setDurationError('');
  };

  const handleMoreInfo = (tour: any) => {
    setTourDetails(tour);
    setShowTourDetails(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!bookingForm.name.trim() || !bookingForm.phone.trim() || !bookingForm.email.trim() || 
        !bookingForm.departureDate || bookingForm.numberOfPeople < 1) {
      alert(t('home.featuredTours.bookingForm.validation.fillAllFields'));
      return;
    }
    
    // Validate name
    if (!validateName(bookingForm.name)) {
      return;
    }
    
    // Validate phone number
    if (!validatePhone(bookingForm.phone)) {
      return;
    }
    
    // Validate email
    if (!validateEmail(bookingForm.email)) {
      return;
    }
    
    // Validate dates
    if (!validateDates()) {
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
      alert(t('home.featuredTours.bookingForm.validation.generalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateName = (name: string): boolean => {
    // Remove extra spaces and check length
    const trimmedName = name.trim();
    
    if (trimmedName.length < 3) {
      setNameError(t('home.featuredTours.bookingForm.validation.nameMinLength'));
      return false;
    }
    
    // Check if name contains only letters, spaces, and Lithuanian characters
    const nameRegex = /^[a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ\s]+$/;
    if (!nameRegex.test(trimmedName)) {
      setNameError(t('home.featuredTours.bookingForm.validation.nameOnlyLetters'));
      return false;
    }
    
    setNameError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setEmailError(t('home.featuredTours.bookingForm.validation.emailRequired'));
      return false;
    }
    
    if (!emailRegex.test(email.trim())) {
      setEmailError(t('home.featuredTours.bookingForm.validation.emailInvalid'));
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 6) {
      setPhoneError(t('home.featuredTours.bookingForm.validation.phoneMinLength'));
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const validateDates = (): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const departure = new Date(bookingForm.departureDate);
    
    // Clear previous errors
    setDepartureDateError('');
    setDurationError('');
    
    let isValid = true;
    
    // Check departure date
    if (departure <= today) {
      setDepartureDateError(t('home.featuredTours.bookingForm.validation.departureDateInvalid'));
      isValid = false;
    }
    
    // Check minimum duration (based on package duration)
    if (selectedTour && selectedTour.duration) {
      const minDuration = selectedTour.duration;
      // Calculate return date based on package duration
      const calculatedReturnDate = new Date(departure);
      calculatedReturnDate.setDate(departure.getDate() + minDuration);
      
      // No need to validate duration since it's fixed by package
      // Just show info about the calculated return date
    }
    
    return isValid;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBookingForm({...bookingForm, name: value});
    
    // Clear error when user starts typing
    if (nameError) {
      setNameError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBookingForm({...bookingForm, email: value});
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, spaces, +, -, (, )
    const cleanedValue = value.replace(/[^\d\s+\-()]/g, '');
    
    setBookingForm({...bookingForm, phone: cleanedValue});
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleDepartureDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBookingForm({...bookingForm, departureDate: value});
    
    // Clear errors when user changes date
    if (departureDateError) setDepartureDateError('');
    if (durationError) setDurationError('');
    
    // Auto-validate when departure date is set
    if (value) {
      validateDates();
    }
  };



  const handleFormClose = () => {
    setShowBookingForm(false);
    setSelectedTour(null);
    setShowPaymentOptions(false);
    setBookingConfirmed(false);
    setPaymentForm({ name: '', email: '' });
    setPhoneError('');
    setNameError('');
    setEmailError('');
    setDepartureDateError('');
    setDurationError('');
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
         departureDate: bookingForm.departureDate
       });

      if (response.paymentUrl) {
        // Redirect to Paysera
        window.location.href = response.paymentUrl;
      } else {
        throw new Error(t('home.featuredTours.paymentSection.paymentUrlError'));
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
              {t('home.featuredTours.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.featuredTours.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getCurrentTours().map((tour) => (
              <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                {/* Tour Image */}
                <div className="relative h-48 bg-gray-200 flex-shrink-0">
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
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{tour.title}</h3>
                  <div className="mb-4 min-h-[3rem]">
                    <p className="text-gray-600 line-clamp-2">{tour.description}</p>
                  </div>
                  
                  {/* Tour Details */}
                  <div className="space-y-2 mb-4 flex-shrink-0">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">{tour.duration} {t('home.featuredTours.days')}</span>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-end justify-between mt-auto flex-shrink-0">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600">€{tour.price}</span>
                        <span className="text-sm text-gray-400 line-through">€{(tour.price * 1.2).toFixed(0)}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{ t('home.featuredTours.person')}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleMoreInfo(tour)}
                        className="px-4 py-2.5 bg-white text-teal-600 border-2 border-teal-600 rounded-full font-bold hover:bg-teal-50 transition-colors flex items-center text-sm"
                      >
                        {t('home.featuredTours.moreInfo')}
                      </button>
                      <button
                        onClick={() => handleBookNow(tour)}
                        className="px-4 py-2.5 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-colors flex items-center text-sm"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {t('home.featuredTours.bookNow')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation */}
          {tours.length > toursPerPage && (
            <div className="flex justify-center items-center mt-8 space-x-4">
              <button
                onClick={prevPage}
                className="p-3 bg-white text-teal-600 border-2 border-teal-600 rounded-full hover:bg-teal-50 transition-colors"
                aria-label="Ankstesnis puslapis"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              {/* Page Indicators */}
              <div className="flex space-x-2">
                {Array.from({ length: Math.ceil(tours.length / toursPerPage) }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentPage 
                        ? 'bg-teal-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Puslapis ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextPage}
                className="p-3 bg-white text-teal-600 border-2 border-teal-600 rounded-full hover:bg-teal-50 transition-colors"
                aria-label="Kitas puslapis"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* View All Tours Button */}
                     <div className="text-center mt-12">
             <Link
               to="/search"
               className="inline-flex items-center px-8 py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-colors"
             >
               {t('home.featuredTours.viewAllTours')}
               <ArrowRight className="ml-2 h-5 w-5" />
             </Link>
           </div>
        </div>
      </section>

      {/* Tour Details Modal */}
      {showTourDetails && tourDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {tourDetails.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{t('home.featuredTours.viewFullDescription')}</p>
                </div>
                <button
                  onClick={() => setShowTourDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tour Image */}
              <div className="relative h-64 bg-gray-200 rounded-lg mb-6">
                {tourDetails.image && (
                  <img
                    src={tourDetails.image}
                    alt={tourDetails.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                {tourDetails.badge && (
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor(tourDetails.badge)}`}>
                    {tourDetails.badge}
                  </div>
                )}
              </div>

              {/* Tour Description */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('home.featuredTours.aprašymas')}</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words text-justify">
                    {tourDetails.description}
                  </p>
                </div>
              </div>

              {/* Tour Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                                      <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-3 text-blue-500" />
                      <div>
                        <span className="font-medium">{t('home.featuredTours.duration')}</span>
                        <span className="ml-2">{tourDetails.duration} {t('home.featuredTours.days')}</span>
                      </div>
                    </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">€{tourDetails.price}</div>
                      <div className="text-sm text-green-700">/ {t('home.featuredTours.perPerson')}</div>
                      <div className="text-xs text-green-600 line-through mt-1">€{(tourDetails.price * 1.2).toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowTourDetails(false);
                    handleBookNow(tourDetails);
                  }}
                  className="px-8 py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-colors flex items-center"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {t('home.featuredTours.bookNowButton')}
                </button>
                                  <button
                    onClick={() => setShowTourDetails(false)}
                    className="px-8 py-3 bg-white text-teal-600 border-2 border-teal-600 rounded-full font-bold hover:bg-teal-50 transition-colors"
                  >
                    {t('home.featuredTours.close')}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
               
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
                         {t('home.featuredTours.bookingForm.fullName')}
                       </label>
                       <input
                         type="text"
                         value={bookingForm.name}
                         onChange={handleNameChange}
                         placeholder="Jonas Jonaitis"
                         className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                           nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                         }`}
                         required
                       />
                       {nameError && (
                         <p className="mt-1 text-sm text-red-600">{nameError}</p>
                       )}
                       <p className="mt-1 text-xs text-gray-500">
                         {t('home.featuredTours.bookingForm.minLetters')}
                       </p>
                     </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('home.featuredTours.bookingForm.phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={bookingForm.phone}
                        onChange={handlePhoneChange}
                        placeholder="+370 6XX XXXXX"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {phoneError && (
                        <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {t('home.featuredTours.bookingForm.minDigits')}
                      </p>
                    </div>
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       {t('home.featuredTours.bookingForm.emailAddress')}
                     </label>
                     <input
                       type="email"
                       value={bookingForm.email}
                       onChange={handleEmailChange}
                       placeholder="jonas@example.com"
                       className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                         emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                       }`}
                       required
                     />
                     {emailError && (
                       <p className="mt-1 text-sm text-red-600">{emailError}</p>
                     )}
                     <p className="mt-1 text-xs text-gray-500">
                       {t('home.featuredTours.bookingForm.validEmail')}
                     </p>
                   </div>

                                                                                                                   <div className="w-1/2">
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         {t('home.featuredTours.bookingForm.departureDate')}
                       </label>
                       <input
                         type="date"
                         value={bookingForm.departureDate}
                         onChange={handleDepartureDateChange}
                         min={new Date().toISOString().split('T')[0]}
                         className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                           departureDateError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                         }`}
                         required
                       />
                       {departureDateError && (
                         <p className="mt-1 text-sm text-red-600">{departureDateError}</p>
                       )}
                     </div>
                    
                                         {/* Duration Error Display */}
                     {durationError && (
                       <div className="col-span-2">
                         <p className="mt-1 text-sm text-red-600">{durationError}</p>
                       </div>
                     )}
                     
                     {/* Duration Help Text */}
                     {selectedTour?.duration && (
                       <div>
                         <p className="mt-1 text-xs text-gray-500">
                           {t('home.featuredTours.tourDurationText')} {selectedTour.duration} {t('home.featuredTours.days')} {t('home.featuredTours.accordingToPackage')}
                         </p>
                       </div>
                     )}

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       {t('home.featuredTours.bookingForm.numberOfPeople')}
                     </label>
                     <input
                       type="number"
                       min="1"
                       max="50"
                       value={bookingForm.numberOfPeople}
                       onChange={(e) => {
                         const value = parseInt(e.target.value);
                         if (value >= 1) {
                           setBookingForm({...bookingForm, numberOfPeople: value});
                         }
                       }}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required
                     />
                     <p className="mt-1 text-xs text-gray-500">
                       {t('home.featuredTours.bookingForm.minPeople')}
                     </p>
                   </div>

                                     <button
                     type="submit"
                     disabled={isSubmitting}
                     className="w-full py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                   >
                     {isSubmitting ? t('home.featuredTours.paymentSection.submitting') : t('home.featuredTours.bookingForm.submitButton')}
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
                        <h4 className="font-semibold text-green-800">{t('home.paymentSection.bookingConfirmed')}</h4>
                        <p className="text-green-700 text-sm">{t('home.paymentSection.nowCanPay')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('home.paymentSection.orderInfo')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('home.paymentSection.tour')}</span>
                        <span className="font-medium">{selectedTour?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('home.paymentSection.numberOfPeople')}</span>
                        <span className="font-medium">{bookingForm.numberOfPeople}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('home.paymentSection.totalAmount')}</span>
                                                 <span className="font-bold text-lg text-green-600">
                           €{calculateTotalPrice().toFixed(2)}
                         </span>  
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">{t('home.paymentSection.paymentInfo')}</h4>
                    
                    {/* Payment Form */}
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('home.paymentSection.fullName')}
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
                          {t('home.paymentSection.email')}
                        </label>
                        <input
                          type="email"
                          value={paymentForm.email}
                          onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                                             <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                         <div className="flex justify-between items-center">
                           <span className="text-green-800 font-medium">{t('home.paymentSection.totalAmountLabel')}</span>
                                                     <span className="text-2xl font-bold text-green-600">
                             €{calculateTotalPrice().toFixed(2)}
                           </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessingPayment}
                        className="w-full py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {t('home.featuredTours.paymentSection.processing')}
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-5 w-5 mr-2" />
                            {t('home.paymentSection.submitbutton')}
                          </>
                        )}
                      </button>
                    </form>

                  
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

