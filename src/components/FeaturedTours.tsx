import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, X, Calendar, Users, Phone, Mail, User } from 'lucide-react';
import { travelPacketsApi, transformTravelPacket } from '../services/apiService';

const FeaturedTours = () => {
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
      
      // For now, just show success message and close form
      alert('Užsakymas sėkmingai išsiųstas! Netrukus susisieksime su jumis.');
      setShowBookingForm(false);
      
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
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 'Akcija': return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      case 'Populiaru': return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Išskirtinės <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">kelionės</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Atraskite mūsų populiariausius ir geriausiai įvertintus kelionių pasiūlymus
          </p>
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-3 text-gray-600">Kraunamos kelionės...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {tours.map((tour: any) => (
            <div
              key={tour.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-64">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold ${getBadgeColor(tour.badge)}`}>
                  {tour.badge}
                </div>

                {/* Available Spots */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
                  Likę {tour.availableSpots} vietos
                </div>

                {/* Price */}
                <div className="absolute bottom-4 right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-full font-bold text-lg">
                  {tour.price}€
                  {tour.originalPrice && (
                    <span className="text-sm line-through opacity-75 ml-2">{tour.originalPrice}€</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Location & Duration */}
                <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin size={16} />
                    <span>{tour.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{tour.duration}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors duration-300">
                  {tour.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {tour.description}
                </p>

                {/* Includes */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Įskaičiuota:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tour.includes.map((item: string, index: number) => (
                      <span
                        key={`${tour.id}-include-${index}`}
                        className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleBookNow(tour)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
                  >
                    Užsisakyti dabar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/search"
            className="inline-flex items-center space-x-2 bg-white hover:bg-teal-50 text-teal-600 font-bold py-4 px-8 rounded-xl border-2 border-teal-500 hover:border-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            <span>Žiūrėti visas keliones</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-full">
                  <Calendar className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Užsakyti kelionę</h2>
                  <p className="text-sm text-gray-600">{selectedTour.title}</p>
                </div>
              </div>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Jūsų vardas *
                </label>
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Įveskite savo vardą"
                  required
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Telefono numeris *
                </label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="+370 6XX XXXXX"
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  El. paštas *
                </label>
                <input
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder="Įveskite savo el. paštą"
                  required
                />
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Išvykimo data *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.departureDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Grįžimo data *
                  </label>
                  <input
                    type="date"
                    value={bookingForm.returnDate}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    min={bookingForm.departureDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Number of People */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users size={16} className="inline mr-2" />
                  Asmenų skaičius *
                </label>
                <input
                  type="number"
                  value={bookingForm.numberOfPeople}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  min="1"
                  max="20"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maksimalus asmenų skaičius: 20
                </p>
              </div>

              {/* Tour Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Kelionės informacija:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Kelionė:</span>
                    <p className="font-medium">{selectedTour.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Kaina:</span>
                    <p className="font-medium text-teal-600">{selectedTour.price}€</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vieta:</span>
                    <p className="font-medium">{selectedTour.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trukmė:</span>
                    <p className="font-medium">{selectedTour.duration}</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  <span>{isSubmitting ? 'Siunčiama...' : 'Perku'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedTours;