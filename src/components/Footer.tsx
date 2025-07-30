import React from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Heart } from 'lucide-react';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold">Koradius Travel</span>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              Jau 15 metų kuriame nepamirštamus kelionių išgyvenimus lietuviams. 
              Mūsų misija - padėti jums atrasti pasaulio grožį saugiai ir patogiai.
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="bg-pink-600 hover:bg-pink-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">Greitos nuorodos</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('home')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Pradžia
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('tours')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Kelionės
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('popular')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Populiariausios kryptys
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('gallery')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Galerija
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('reviews')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Atsiliepimai
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left"
                >
                  Apie mus
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold mb-6">Paslaugos</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                Savaitgalio kelionės
              </li>
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                Poilsinės kelionės
              </li>
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                Medicininis turizmas
              </li>
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                Grupės kelionės
              </li>
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                VIP kelionės
              </li>
              <li className="hover:text-teal-400 transition-colors duration-300 cursor-pointer">
                Kelionių draudimas
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">Kontaktai</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="text-teal-400 flex-shrink-0 mt-1" size={18} />
                <div className="text-gray-300">
                  <p>Gedimino pr. 45-7</p>
                  <p>LT-01109 Vilnius</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="text-teal-400 flex-shrink-0" size={18} />
                <div className="text-gray-300">
                  <p>+370 5 123 4567</p>
                  <p>+370 600 12345</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="text-teal-400 flex-shrink-0" size={18} />
                <div className="text-gray-300">
                  <p>info@koradius-travel.com</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-700/50">
              <h4 className="font-bold text-red-300 mb-2">24/7 Pagalba</h4>
              <p className="text-red-200 text-sm">Skubus ryšys kelionės metu:</p>
              <p className="text-red-100 font-bold">+370 600 99999</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Koradius Travel. Visos teisės saugomos.
            </div>
            
            <div className="flex items-center space-x-1 text-gray-400 text-sm">
              <span>Sukurta su</span>
              <Heart className="text-red-500 fill-current" size={16} />
              <span>Lietuvoje</span>
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300">
                Privatumo politika
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300">
                Naudojimo taisyklės
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300">
                Slapukai
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;