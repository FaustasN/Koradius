import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Calendar, ChevronDown } from 'lucide-react';
import NovaturIframe from '../components/NovaturIframe';
import { travelPacketsApi, transformTravelPacket } from '../services/apiService';

const ToursPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  
  // Database state
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tours from database
  useEffect(() => {
    const loadTours = async () => {
      try {
        setLoading(true);
        setError(null);
        const packets = await travelPacketsApi.getAll();
        const transformedTours = packets.map(transformTravelPacket);
        setTours(transformedTours);
      } catch (err) {
        console.error('Error loading tours:', err);
        setError('Failed to load tours. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTours();
  }, []);

  const handleBookNow = (tourId: number) => {
    navigate(`/tours?tour=${tourId}`);
  };

  const handleMoreInfo = (tourId: number) => {
    navigate(`/tours?tour=${tourId}&details=true`);
  };

  const handleClearFilters = () => {
    setActiveFilter('all');
    setSearchTerm('');
    setPriceRange([0, 2000]);
  };

  const filters = [
    { id: 'all', label: 'Visos kelionės', count: tours.length },
    { id: 'weekend', label: 'Savaitgalio kelionės', count: tours.filter(t => t.category === 'weekend').length },
    { id: 'vacation', label: 'Poilsinės kelionės', count: tours.filter(t => t.category === 'vacation').length },
    { id: 'medical', label: 'Medicininis turizmas', count: tours.filter(t => t.category === 'medical').length },
    { id: 'nature', label: 'Gamtos kelionės', count: tours.filter(t => t.category === 'nature').length }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Populiariausi' },
    { value: 'price-low', label: 'Kaina: nuo mažiausios' },
    { value: 'price-high', label: 'Kaina: nuo didžiausios' },
    { value: 'rating', label: 'Geriausiai įvertinti' },
    { value: 'duration', label: 'Trukmė' }
  ];

  const filteredTours = tours
    .filter(tour => activeFilter === 'all' || tour.category === activeFilter)
    .filter(tour => tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   tour.location.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(tour => parseInt(tour.price) >= priceRange[0] && parseInt(tour.price) <= priceRange[1])
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return parseInt(a.price) - parseInt(b.price);
        case 'price-high': return parseInt(b.price) - parseInt(a.price);
        case 'rating': return b.rating - a.rating;
        case 'duration': return parseInt(a.duration) - parseInt(b.duration);
        default: return b.reviews - a.reviews;
      }
    });

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 'Nauja': return 'bg-gradient-to-r from-green-400 to-green-500 text-white';
      case 'Populiaru': return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white';
      case 'Akcija': return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      case 'Likę 2 vietos': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Mūsų <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">kelionės</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Atraskite kruopščiai parinktus kelionių pasiūlymus visoms progoms
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Ieškoti kelionių pagal pavadinimą ar šalį..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 appearance-none bg-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kaina: {priceRange[0]}€ - {priceRange[1]}€
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-md'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Kraunamos kelionės...</span>
            </div>
          )}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Bandyti dar kartą
              </button>
            </div>
          )}
          {!loading && !error && (
            <p className="text-gray-600">
              Rasta <span className="font-bold text-teal-600">{filteredTours.length}</span> kelionių
            </p>
          )}
        </div>

        {/* Tours Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold ${getBadgeColor(tour.badge)}`}>
                  {tour.badge}
                </div>

                {/* Available Spots */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
                  Likę {tour.availableSpots}
                </div>

                {/* Price */}
                <div className="absolute bottom-3 right-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-3 py-1 rounded-full font-bold">
                  {tour.price}€
                  {tour.originalPrice && (
                    <span className="text-xs line-through opacity-75 ml-1">{tour.originalPrice}€</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Location & Duration */}
                <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin size={12} />
                    <span>{tour.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{tour.duration}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors duration-300 line-clamp-2">
                  {tour.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="text-yellow-400 fill-current" size={14} />
                    <span className="font-semibold text-sm text-gray-800">{tour.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">({tour.reviews})</span>
                </div>

                {/* Includes */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {tour.includes.slice(0, 2).map((item: string, index: number) => (
                      <span
                        key={`${tour.id}-include-${index}`}
                        className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {item}
                      </span>
                    ))}
                    {tour.includes.length > 2 && (
                      <span className="text-xs text-gray-500">+{tour.includes.length - 2} daugiau</span>
                    )}
                  </div>
                </div>

                {/* Departure Date */}
                <div className="flex items-center space-x-1 mb-4 text-xs text-gray-600">
                  <Calendar size={12} />
                  <span>Išvykimas: {tour.departure}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleBookNow(tour.id)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
                  >
                    Užsisakyti dabar
                  </button>
                  <button 
                    onClick={() => handleMoreInfo(tour.id)}
                    className="px-4 py-2 border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white font-semibold rounded-lg transition-all duration-300 text-sm btn-hover-smooth"
                  >
                    Daugiau
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredTours.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Kelionių nerasta</h3>
            <p className="text-gray-600 mb-6">Pabandykite pakeisti paieškos kriterijus</p>
            <button
              onClick={handleClearFilters}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Išvalyti filtrus
            </button>
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center mt-12">
          <button 
            onClick={NovaturIframe}
            className="bg-white hover:bg-teal-50 text-teal-600 font-bold py-4 px-8 rounded-xl border-2 border-teal-500 hover:border-teal-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            Rodyti daugiau kelionių
          </button>
        </div>
     
      </div>
    </div>
  );
};

export default ToursPage;