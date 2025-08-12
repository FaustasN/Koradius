import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Search, Phone } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentLang, setCurrentLang] = useState('LT');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = ['LT', 'EN', 'RU'];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-xl py-2' : 'bg-white/95 backdrop-blur-md py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/Icon/Logo_Koradius_EN-max-300x228.png" 
              alt="Koradius Travel Logo" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors duration-300">Koradius</span>
              <span className="text-sm text-teal-600 font-medium -mt-1">Travel</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link 
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Pradžia
            </Link>
            <Link 
              to="/search"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/search') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Ieškoti kelionių
            </Link>
            <Link 
              to="/gallery"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/gallery') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Galerija
            </Link>
            <Link 
              to="/reviews"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/reviews') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Atsiliepimai
            </Link>
            <Link 
              to="/about"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/about') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Apie mus
            </Link>
            <Link 
              to="/contact"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/contact') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Kontaktai
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* Emergency Contact */}
            <a 
              href="tel:+37069498078"
              className="hidden md:flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 px-4 py-2.5 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer group"
            >
              <Phone size={16} className="group-hover:animate-pulse" />
              <span className="text-sm font-semibold whitespace-nowrap">24/7: +370 694 98078</span>
            </a>


            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-300 btn-hover-smooth">
                <Globe size={18} />
                <span className="font-semibold">{currentLang}</span>
              </button>
              
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 border border-gray-100">
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCurrentLang(lang)}
                      className={`block w-full text-left px-4 py-2 transition-colors duration-200 btn-hover-smooth ${
                        currentLang === lang 
                          ? 'bg-teal-50 text-teal-600 font-semibold' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-300 btn-hover-smooth"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <nav className="bg-white rounded-xl shadow-xl p-4 space-y-2 border border-gray-100">
            <Link to="/" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              Pradžia
            </Link>
            <Link to="/gallery" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              Galerija
            </Link>
            <Link to="/reviews" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              Atsiliepimai
            </Link>
            <Link to="/about" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              Apie mus
            </Link>
            <Link 
              to="/search"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/search') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              Ieškoti kelionių
            </Link>
            <Link to="/contact" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              Kontaktai
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;