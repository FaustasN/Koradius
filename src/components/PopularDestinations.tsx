import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, TrendingUp } from 'lucide-react';

const PopularDestinations = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const destinations = [
    {
      id: 1,
      name: "Santorini",
      country: "Graikija",
      image: "https://images.pexels.com/photos/161815/santorini-travel-greece-island-161815.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 590€",
      trend: "+15%",
      description: "Romantiškas saulėlydis ir baltieji namai"
    },
    {
      id: 2,
      name: "Dubajus",
      country: "JAE",
      image: "https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 890€",
      trend: "+22%",
      description: "Prabangos ir modernumo miestas"
    },
    {
      id: 3,
      name: "Tokijas",
      country: "Japonija",
      image: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 1200€",
      trend: "+8%",
      description: "Tradicijų ir technologijų susitikimas"
    },
    {
      id: 4,
      name: "Maledivai",
      country: "Indijos vandenynas",
      image: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 1650€",
      trend: "+12%",
      description: "Tropinis rojus kristalinio vandens"
    },
    {
      id: 5,
      name: "Islandija",
      country: "Šiaurės Europa",
      image: "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg?auto=compress&cs=tinysrgb&w=800",
      price: "nuo 750€",
      trend: "+18%",
      description: "Šiaurės pašvaistė ir geizerai"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % destinations.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(nextSlide, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const getVisibleSlides = () => {
    const slides = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentSlide + i) % destinations.length;
      slides.push(destinations[index]);
    }
    return slides;
  };

  return (
    <section id="popular" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="text-teal-500" size={32} />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
              Populiariausios <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">kryptys</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Šį mėnesį daugiausiai užsakomos kelionės ir sparčiausiai augančios kryptys
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Carousel */}
          <div className="overflow-hidden rounded-2xl">
            <div className="flex transition-transform duration-700 ease-in-out">
              {getVisibleSlides().map((destination, index) => (
                <div
                  key={`${destination.id}-${currentSlide}-${index}`}
                  className={`flex-shrink-0 w-full md:w-1/3 px-2 transition-all duration-700 ${
                    index === 1 ? 'transform scale-105 z-10' : 'transform scale-95 opacity-75'
                  }`}
                >
                  <div className="relative group cursor-pointer">
                    {/* Image */}
                    <div className="relative overflow-hidden rounded-2xl h-96">
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

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin size={18} />
                          <span className="text-sm opacity-90">{destination.country}</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-2">{destination.name}</h3>
                        <p className="text-sm opacity-90 mb-3">{destination.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-yellow-400">{destination.price}</span>
                          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105">
                            Žiūrėti pasiūlymus
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {destinations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-teal-500 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl">
            <div className="text-3xl font-bold text-teal-600 mb-2">85%</div>
            <div className="text-gray-700">Klientų grįžta pakartotinai</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl">
            <div className="text-3xl font-bold text-yellow-600 mb-2">24/7</div>
            <div className="text-gray-700">Palaikymas kelionės metu</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
            <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
            <div className="text-gray-700">Pinigų grąžinimo garantija</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;