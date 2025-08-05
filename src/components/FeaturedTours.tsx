import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight } from 'lucide-react';

const FeaturedTours = () => {
  const navigate = useNavigate();

  const handleBookNow = (tourId: number) => {
    navigate(`/tours?tour=${tourId}`);
  };

  const handleMoreInfo = (tourId: number) => {
    navigate(`/tours?tour=${tourId}&details=true`);
  };

  const featuredTours = [
    {
      id: 1,
      title: "Romantiškas savaitgalis Paryžiuje",
      location: "Prancūzija",
      duration: "3 dienos",
      price: "450",
      originalPrice: "520",
      rating: 4.9,
      reviews: 127,
      image: "https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "Top",
      description: "Atraskite meilės miestą su mūsų kruopščiai paruoštu maršrutu",
      includes: ["Skrydžiai", "3* viešbutis", "Pusryčiai", "Gidas"],
      availableSpots: 8
    },
    {
      id: 2,
      title: "Saulėtas poilsis Tenerifėje",
      location: "Ispanija",
      duration: "7 dienos",
      price: "680",
      originalPrice: "750",
      rating: 4.8,
      reviews: 89,
      image: "https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "Akcija",
      description: "Tropinis rojus su nuostabiais paplūdimiais ir šiltu oru",
      includes: ["Skrydžiai", "4* viešbutis", "All inclusive", "Transferai"],
      availableSpots: 12
    },
    {
      id: 3,
      title: "Plaukų transplantacija Stambule",
      location: "Turkija",
      duration: "5 dienos",
      price: "1200",
      originalPrice: "1400",
      rating: 4.7,
      reviews: 156,
      image: "https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800",
      badge: "Populiaru",
      description: "Profesionalus medicininis turizmas su aukščiausios kokybės paslaugomis",
      includes: ["Skrydžiai", "5* viešbutis", "Procedūra", "Aftercare"],
      availableSpots: 3
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredTours.map((tour) => (
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

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="text-yellow-400 fill-current" size={18} />
                    <span className="font-semibold text-gray-800">{tour.rating}</span>
                  </div>
                  <span className="text-gray-500">({tour.reviews} atsiliepimai)</span>
                </div>

                {/* Includes */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Įskaičiuota:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tour.includes.map((item, index) => (
                      <span
                        key={index}
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
                  <button 
                    onClick={() => handleMoreInfo(tour.id)}
                    className="px-6 py-3 border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 btn-hover-smooth"
                  >
                    Daugiau
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/tours"
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