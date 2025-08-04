import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Star, Users, Calendar, Thermometer } from 'lucide-react';

const DestinationsPage = () => {
  const navigate = useNavigate();

  const handleViewTours = (destinationName: string) => {
    navigate(`/tours?destination=${encodeURIComponent(destinationName)}`);
  };

  const handleMoreInfo = (destinationName: string) => {
    navigate(`/destinations?destination=${encodeURIComponent(destinationName)}`);
  };

  const handleContactConsultant = () => {
    navigate('/contact');
  };

  const [selectedRegion, setSelectedRegion] = useState('all');

  const destinations = [
    {
      id: 1,
      name: "Santorini",
      country: "Graikija",
      region: "europe",
      image: "https://images.pexels.com/photos/161815/santorini-travel-greece-island-161815.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 590€",
      trend: "+15%",
      rating: 4.9,
      reviews: 234,
      temperature: "24°C",
      bestTime: "Balandis - Spalis",
      description: "Romantiškas saulėlydis ir baltieji namai ant vulkaninio krašto",
      highlights: ["Oia saulėlydis", "Vulkaniniai paplūdimiai", "Vyno degustacijos", "Tradiciniai kaimai"],
      tourCount: 12
    },
    {
      id: 2,
      name: "Dubajus",
      country: "JAE",
      region: "asia",
      image: "https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 890€",
      trend: "+22%",
      rating: 4.8,
      reviews: 189,
      temperature: "28°C",
      bestTime: "Lapkritis - Kovas",
      description: "Prabangos ir modernumo miestas su neįtikėtais dangoraižiais",
      highlights: ["Burj Khalifa", "Aukso turgus", "Dykumos safari", "Prabangūs viešbučiai"],
      tourCount: 8
    },
    {
      id: 3,
      name: "Tokijas",
      country: "Japonija",
      region: "asia",
      image: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 1200€",
      trend: "+8%",
      rating: 4.7,
      reviews: 156,
      temperature: "18°C",
      bestTime: "Kovas - Gegužė",
      description: "Tradicijų ir technologijų susitikimas su unikalia kultūra",
      highlights: ["Sakuros žydėjimas", "Sushi turgūs", "Šventyklos", "Technologijų muziejai"],
      tourCount: 6
    },
    {
      id: 4,
      name: "Maledivai",
      country: "Indijos vandenynas",
      region: "asia",
      image: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 1650€",
      trend: "+12%",
      rating: 4.9,
      reviews: 298,
      temperature: "30°C",
      bestTime: "Lapkritis - Balandis",
      description: "Tropinis rojus kristalinio vandens su prabangiais resort'ais",
      highlights: ["Vandens vilos", "Koralų rifai", "Spa procedūros", "Privatūs paplūdimiai"],
      tourCount: 15
    },
    {
      id: 5,
      name: "Islandija",
      country: "Šiaurės Europa",
      region: "europe",
      image: "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 750€",
      trend: "+18%",
      rating: 4.8,
      reviews: 167,
      temperature: "8°C",
      bestTime: "Birželis - Rugpjūtis",
      description: "Šiaurės pašvaistė ir geizerai neįtikėtinoje gamtoje",
      highlights: ["Šiaurės pašvaistė", "Geizerai", "Ledynai", "Vulkanai"],
      tourCount: 9
    },
    {
      id: 6,
      name: "Bali",
      country: "Indonezija",
      region: "asia",
      image: "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 980€",
      trend: "+25%",
      rating: 4.8,
      reviews: 203,
      temperature: "28°C",
      bestTime: "Balandis - Spalis",
      description: "Egzotiška sala su šventyklomis ir ryžių terasomis",
      highlights: ["Ryžių terasų", "Šventyklos", "Vulkanai", "Spa kultūra"],
      tourCount: 11
    },
    {
      id: 7,
      name: "Paryžius",
      country: "Prancūzija",
      region: "europe",
      image: "https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 420€",
      trend: "+10%",
      rating: 4.7,
      reviews: 445,
      temperature: "15°C",
      bestTime: "Balandis - Spalis",
      description: "Meilės miestas su neįtikėta architektūra ir kultūra",
      highlights: ["Eifelio bokštas", "Luvras", "Šan Elizė", "Montmartre"],
      tourCount: 18
    },
    {
      id: 8,
      name: "Roma",
      country: "Italija",
      region: "europe",
      image: "https://images.pexels.com/photos/2064827/pexels-photo-2064827.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 480€",
      trend: "+14%",
      rating: 4.8,
      reviews: 356,
      temperature: "20°C",
      bestTime: "Kovas - Gegužė",
      description: "Amžinasis miestas su neįtikėta istorija ir architektūra",
      highlights: ["Koliziejus", "Vatikanas", "Fontana di Trevi", "Panteona"],
      tourCount: 14
    }
  ];

  const regions = [
    { id: 'all', label: 'Visos kryptys', count: destinations.length },
    { id: 'europe', label: 'Europa', count: destinations.filter(d => d.region === 'europe').length },
    { id: 'asia', label: 'Azija', count: destinations.filter(d => d.region === 'asia').length },
    { id: 'america', label: 'Amerika', count: destinations.filter(d => d.region === 'america').length },
    { id: 'africa', label: 'Afrika', count: destinations.filter(d => d.region === 'africa').length }
  ];

  const filteredDestinations = selectedRegion === 'all' 
    ? destinations 
    : destinations.filter(dest => dest.region === selectedRegion);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="text-teal-500" size={32} />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Populiariausios <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">kryptys</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Atraskite šį mėnesį daugiausiai užsakomas keliones ir sparčiausiai augančias kryptis
          </p>
        </div>

        {/* Region Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedRegion === region.id
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-600 shadow-md'
              }`}
            >
              {region.label} ({region.count})
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDestinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-64">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                
                {/* Trend Badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                  <TrendingUp size={14} />
                  <span>{destination.trend}</span>
                </div>

                {/* Temperature */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <Thermometer size={14} />
                  <span>{destination.temperature}</span>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin size={18} />
                    <span className="text-sm opacity-90">{destination.country}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{destination.name}</h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-yellow-400">{destination.price}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-400 fill-current" size={16} />
                      <span className="text-sm">{destination.rating}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {destination.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={16} />
                    <span>{destination.bestTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users size={16} />
                    <span>{destination.reviews} atsiliepimai</span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Pagrindinės atrakcijos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {destination.highlights.slice(0, 3).map((highlight, index) => (
                      <span
                        key={index}
                        className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {highlight}
                      </span>
                    ))}
                    {destination.highlights.length > 3 && (
                      <span className="text-sm text-gray-500">+{destination.highlights.length - 3} daugiau</span>
                    )}
                  </div>
                </div>

                {/* Tour Count */}
                <div className="mb-6 p-3 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">{destination.tourCount}</div>
                    <div className="text-sm text-teal-700">Kelionių pasiūlymų</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleViewTours(destination.name)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
                  >
                    Žiūrėti keliones
                  </button>
                  <button 
                    onClick={() => handleMoreInfo(destination.name)}
                    className="px-6 py-3 border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 btn-hover-smooth"
                  >
                    Daugiau info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Travel Tips Section */}
        <div className="mt-20 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Kelionių <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">patarimai</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Geriausias laikas keliauti</h3>
              <p className="text-gray-600">Planuokite keliones pagal sezoną ir oro sąlygas kiekvienoje šalyje</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Vietinės atrakcijos</h3>
              <p className="text-gray-600">Atraskite paslėptas vietas ir autentiškus išgyvenimus</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Ekspertų rekomendacijos</h3>
              <p className="text-gray-600">Mūsų patyrę gidai rekomenduoja geriausius maršrutus</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Neradote tinkamos krypties? Susisiekite su mumis!
          </p>
          <button 
            onClick={handleContactConsultant}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            Susisiekti su konsultantu
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationsPage;