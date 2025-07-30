import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Ačiū už jūsų žinutę! Susisieksime su jumis per 24 valandas.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Adresas",
      details: ["Gedimino pr. 45-7", "LT-01109 Vilnius", "Lietuva"],
      color: "text-red-500"
    },
    {
      icon: Phone,
      title: "Telefonai",
      details: ["+370 5 123 4567", "+370 600 12345", "Nemokamas: 8 800 12345"],
      color: "text-green-500"
    },
    {
      icon: Mail,
      title: "El. paštas",
      details: ["info@koradius-travel.com", "keliones@koradius-travel.com", "medicinos@koradius-travel.com"],
      color: "text-blue-500"
    },
    {
      icon: Clock,
      title: "Darbo laikas",
      details: ["Pr-Pn: 9:00 - 18:00", "Šeštadieniais: 10:00 - 15:00", "Sekmadieniais: uždaryta"],
      color: "text-purple-500"
    }
  ];

  const subjects = [
    "Bendrasis klausimas",
    "Kelionės užsakymas",
    "Medicininis turizmas",
    "Grupės kelionė",
    "Skundas ar pasiūlymas",
    "Kita"
  ];

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Susisiekite <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">su mumis</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Turite klausimų apie keliones? Mūsų komanda pasiruošusi jums padėti!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-8">Kontaktinė informacija</h3>
              
              <div className="space-y-8">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`${info.color} bg-gray-50 p-3 rounded-full flex-shrink-0`}>
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 mb-2">{info.title}</h4>
                        {info.details.map((detail, detailIndex) => (
                          <p key={detailIndex} className="text-gray-600 text-sm leading-relaxed">
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4">Sekite mus</h4>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="#"
                    className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <Youtube size={20} />
                  </a>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-800 mb-2">Skubus ryšys kelionės metu</h4>
                <p className="text-red-700 text-sm">24/7 pagalbos linija:</p>
                <p className="text-red-800 font-bold">+370 600 99999</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-8">Parašykite mums</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vardas, pavardė *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                      placeholder="Jūsų vardas ir pavardė"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      El. paštas *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                      placeholder="jusu@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefonas
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                      placeholder="+370 600 12345"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tema *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                    >
                      <option value="">Pasirinkite temą</option>
                      {subjects.map((subject, index) => (
                        <option key={index} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Žinutė *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg resize-none"
                    placeholder="Parašykite savo klausimą ar pageidavimus..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Siunčiama...</span>
                    </>
                  ) : (
                    <>
                      <Send size={24} />
                      <span>Siųsti žinutę</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin size={48} className="mx-auto mb-4" />
                <p className="text-lg">Čia būtų Google Maps žemėlapis</p>
                <p className="text-sm">Gedimino pr. 45-7, Vilnius</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;