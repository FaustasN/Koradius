import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { travelPacketsApi, transformTravelPacket } from '../services/apiService';

const FeaturedTours = () => {
  const navigate = useNavigate();
  
  // Database state
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleBookNow = (tourId: number) => {
    navigate(`/search?tour=${tourId}`);
  };

  const handleMoreInfo = (tourId: number) => {
    navigate(`/search?tour=${tourId}&details=true`);
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
        <div className="text-center mb-16">x
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
                    onClick={() => handleBookNow(tour.id)}
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
    </section>
  );
};

export default FeaturedTours;