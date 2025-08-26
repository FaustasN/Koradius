import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../hooks/useLanguage';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { currentLanguage, changeLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              {t('navigation.home')}
            </Link>
            <Link 
              to="/search"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/search') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.searchTours')}
            </Link>
            <Link 
              to="/gallery"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/gallery') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.gallery')}
            </Link>
            <Link 
              to="/reviews"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/reviews') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.reviews')}
            </Link>
            <Link 
              to="/about"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/about') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.about')}
            </Link>
            <Link 
              to="/contact"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/contact') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.contact')}
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
            <LanguageSwitcher />

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
              {t('navigation.home')}
            </Link>
            <Link to="/gallery" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              {t('navigation.gallery')}
            </Link>
            <Link to="/reviews" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              {t('navigation.reviews')}
            </Link>
            <Link to="/about" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              {t('navigation.about')}
            </Link>
            <Link 
              to="/search"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 btn-hover-smooth ${
                isActive('/search') 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              {t('navigation.searchTours')}
            </Link>
            <Link to="/contact" className="block py-3 px-4 text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors duration-200 font-medium btn-hover-smooth">
              {t('navigation.contact')}
            </Link>
            
            {/* Mobile Language Switcher */}
            <div className="pt-2 border-t border-gray-100">
              <div className="px-4 py-2 text-sm font-medium text-gray-600 mb-2">Language / Kalba</div>
              <div className="space-y-1">
                {['lt', 'en', 'ru'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                      currentLanguage === lang 
                        ? 'bg-teal-100 text-teal-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {lang === 'lt' ? '🇱🇹 Lietuvių' : lang === 'en' ? '🇺🇸 English' : '🇷🇺 Русский'}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;