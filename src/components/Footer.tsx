import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="/Icon/Logo_Koradius_EN-max-300x228.png" 
                alt="Koradius Travel Logo" 
                className="h-12 w-auto"
              />
              <span className="text-2xl font-bold">Koradius Travel</span>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              Jau 7 metus kuriame nepamirštamus kelionių išgyvenimus lietuviams. 
              Mūsų misija - padėti jums atrasti pasaulio grožį saugiai ir patogiai.
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/groups/289826933663379"
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg btn-hover-smooth"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/koradius_keliones"
                className="bg-pink-600 hover:bg-pink-700 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg btn-hover-smooth"
              >
                <Instagram size={20} />
              </a>
              
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">Greitos nuorodos</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Pradžia
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Kelionės
                </Link>
              </li>

              <li>
                <Link
                  to="/gallery"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Galerija
                </Link>
              </li>
              <li>
                <Link
                  to="/reviews"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Atsiliepimai
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Apie mus
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-teal-400 transition-colors duration-300 text-left btn-hover-smooth block"
                >
                  Kontaktai
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            
            <ul className="space-y-3 text-gray-300">
              <li>
              
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
                  <p>Švitrigailos g. 11A-330</p>
                  <p>LT-03228 Vilnius</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="text-teal-400 flex-shrink-0" size={18} />
                <div className="text-gray-300">
                  <p>+370 694 98078</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="text-teal-400 flex-shrink-0" size={18} />
                <div className="text-gray-300">
                  <p>koradiustravel@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-700/50">
              <h4 className="font-bold text-red-300 mb-2">24/7 Pagalba</h4>
              <p className="text-red-200 text-sm">Skubus ryšys kelionės metu:</p>
              <p className="text-red-100 font-bold">+370 694 98078</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Koradius Travel. Visos teisės saugomos.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300 btn-hover-smooth">
                Privatumo politika
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300 btn-hover-smooth">
                Naudojimo taisyklės
              </a>
              <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors duration-300 btn-hover-smooth">
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