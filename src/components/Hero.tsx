import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, Filter } from 'lucide-react';

const Hero = () => {
  const [searchData, setSearchData] = useState({
    destination: '',
    date: '',
    travelers: '2',
    budget: ''
  });

  const handleSearch = () => {
    // Implement search functionality
    console.log('Search data:', searchData);
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
          alt="Beautiful tropical destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Atrask savo
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-yellow-400">
              kitą kelionę
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Sukuriame nepamirštamus kelionių išgyvenimus jau daugiau nei 15 metų. 
            Leiskite mums padėti jums atrasti pasaulio grožį.
          </p>

          {/* Search Form */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kur keliausite?</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500" size={20} />
                  <input
                    type="text"
                    placeholder="Pasirinkite šalį..."
                    value={searchData.destination}
                    onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kada?</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500" size={20} />
                  <input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              {/* Travelers */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Keleiviai</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500" size={20} />
                  <select
                    value={searchData.travelers}
                    onChange={(e) => setSearchData({...searchData, travelers: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                  >
                    <option value="1">1 keleivis</option>
                    <option value="2">2 keleiviai</option>
                    <option value="3">3 keleiviai</option>
                    <option value="4">4 keleiviai</option>
                    <option value="5+">5+ keleiviai</option>
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Biudžetas</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500" size={20} />
                  <select
                    value={searchData.budget}
                    onChange={(e) => setSearchData({...searchData, budget: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                  >
                    <option value="">Bet koks</option>
                    <option value="budget">Iki 500€</option>
                    <option value="mid">500€ - 1000€</option>
                    <option value="premium">1000€ - 2000€</option>
                    <option value="luxury">2000€+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-8">
              <button
                onClick={handleSearch}
                className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3 text-lg btn-hover-smooth"
              >
                <Search size={24} />
                <span>Ieškoti kelionių</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">15+</div>
              <div className="text-lg">Metų patirtis</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">5000+</div>
              <div className="text-lg">Laimingų klientų</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">50+</div>
              <div className="text-lg">Šalių</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;