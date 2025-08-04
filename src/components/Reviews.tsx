import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const Reviews = () => {
  const navigate = useNavigate();
  const [currentReview, setCurrentReview] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const handlePlanTrip = () => {
    navigate('/tours');
  };

  const reviews = [
    {
      id: 1,
      name: "Ona Petraitienė",
      age: 68,
      location: "Vilnius",
      rating: 5,
      text: "Nuostabi kelionė į Santorini! Viskas buvo kruopščiai suplanuota, gidas labai malonus ir daug papasakojo. Ypač patiko, kad viskas buvo pritaikyta mūsų amžiui - ne per daug vaikščiojimo, patogūs transferai. Tikrai rekomenduoju!",
      trip: "Romantiškas savaitgalis Graikijoje",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      date: "2024 m. spalio mėn."
    },
    {
      id: 2,
      name: "Antanas Kazlauskas",
      age: 72,
      location: "Kaunas",
      rating: 5,
      text: "Su žmona nuvykome į Tenerifę. Viešbutis puikus, maistas skanus, oras nuostabus. Koradius Travel komanda pasirūpino visais smulkmenomis - nuo skrydžių iki ekskursijų. Jau planuojame kitą kelionę su jais!",
      trip: "Saulėtas poilsis Tenerifėje",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      date: "2024 m. rugsėjo mėn."
    },
    {
      id: 3,
      name: "Rasa Jonaitienė",
      age: 45,
      location: "Klaipėda",
      rating: 5,
      text: "Medicininė kelionė į Stambulą praėjo be jokių problemų. Personalas labai profesionalus, viskas išversta į lietuvių kalbą. Rezultatu labai patenkinta, o kelionė buvo kaip atostogos. Ačiū už puikų aptarnavimą!",
      trip: "Plaukų transplantacija Stambule",
      image: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      date: "2024 m. rugpjūčio mėn."
    },
    {
      id: 4,
      name: "Vytautas Petraitis",
      age: 65,
      location: "Šiauliai",
      rating: 5,
      text: "Kelionė į Romą buvo tikras sapnas! Gidas Mindaugas puikiai pažįsta miestą ir labai įdomiai pasakoja. Maršrutas buvo idealiai suplanuotas - spėjome pamatyti viską, ko norėjome, bet neskubėjome.",
      trip: "Magiškas Romos savaitgalis",
      image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      date: "2024 m. liepos mėn."
    },
    {
      id: 5,
      name: "Nijolė Kazlauskienė",
      age: 58,
      location: "Panevėžys",
      rating: 5,
      text: "Bali - tai tikras rojus! Niekada nemaniau, kad galiu taip atsipalaiduoti. Viešbutis prie jūros, spa procedūros, egzotiški vaisiai... Koradius Travel tikrai žino, kaip sukurti nepamirštamas atostogas!",
      trip: "Egzotiškas Bali nuotykis",
      image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      date: "2024 m. birželio mėn."
    }
  ];

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(nextReview, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
        className={`${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section id="reviews" className="py-20 bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Quote className="text-teal-500" size={32} />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
              Klientų <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">atsiliepimai</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sužinokite, ką sako mūsų klientai apie keliones su Koradius Travel
          </p>
        </div>

        {/* Reviews Carousel */}
        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Review Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-100 to-yellow-200 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>

            <div className="relative z-10">
              {/* Quote Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-full">
                  <Quote className="text-white" size={32} />
                </div>
              </div>

              {/* Review Text */}
              <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed text-center mb-8 italic">
                "{reviews[currentReview].text}"
              </blockquote>

              {/* Rating */}
              <div className="flex justify-center mb-6">
                <div className="flex space-x-1">
                  {renderStars(reviews[currentReview].rating)}
                </div>
              </div>

              {/* Client Info */}
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={reviews[currentReview].image}
                  alt={reviews[currentReview].name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-teal-100"
                />
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-lg">
                    {reviews[currentReview].name}, {reviews[currentReview].age} m.
                  </h4>
                  <p className="text-gray-600">{reviews[currentReview].location}</p>
                  <p className="text-sm text-teal-600 font-semibold mt-1">
                    {reviews[currentReview].trip}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reviews[currentReview].date}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-teal-50 text-teal-600 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20 btn-hover-smooth"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-teal-50 text-teal-600 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-20 btn-hover-smooth"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentReview
                    ? 'bg-teal-500 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Review Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-teal-600 mb-2">4.9</div>
            <div className="flex justify-center mb-2">
              {renderStars(5)}
            </div>
            <div className="text-gray-600">Vidutinis įvertinimas</div>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-teal-600 mb-2">850+</div>
            <div className="text-gray-600">Atsiliepimų</div>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-teal-600 mb-2">98%</div>
            <div className="text-gray-600">Rekomenduoja draugams</div>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-teal-600 mb-2">85%</div>
            <div className="text-gray-600">Grįžta pakartotinai</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Prisijunkite prie tūkstančių patenkintų klientų
          </p>
          <button 
            onClick={handlePlanTrip}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
          >
            Planuoti savo kelionę
          </button>
        </div>
      </div>
    </section>
  );
};

export default Reviews;