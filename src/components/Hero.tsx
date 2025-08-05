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
              geriausią kelionę
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Sukuriame nepamirštamus kelionių išgyvenimus jau daugiau nei 15 metų. 
            Leiskite mums padėti jums atrasti pasaulio grožį.
          </p>


          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">7+</div>
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