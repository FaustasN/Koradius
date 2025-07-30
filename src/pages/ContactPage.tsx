import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube, MessageCircle, Calendar, User } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
    urgency: 'normal'
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
      message: '',
      preferredContact: 'email',
      urgency: 'normal'
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Adresas",
      details: ["Gedimino pr. 45-7", "LT-01109 Vilnius", "Lietuva"],
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: Phone,
      title: "Telefonai",
      details: ["+370 5 123 4567", "+370 600 12345", "Nemokamas: 8 800 12345"],
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Mail,
      title: "El. paštas",
      details: ["info@koradius-travel.com", "keliones@koradius-travel.com", "medicinos@koradius-travel.com"],
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Clock,
      title: "Darbo laikas",
      details: ["Pr-Pn: 9:00 - 18:00", "Šeštadieniais: 10:00 - 15:00", "Sekmadieniais: uždaryta"],
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  const subjects = [
    "Bendrasis klausimas",
    "Kelionės užsakymas",
    "Medicininis turizmas",
    "Grupės kelionė",
    "Skundas ar pasiūlymas",
    "Techninė pagalba",
    "Partnerystė",
    "Kita"
  ];

  const officeHours = [
    { day: "Pirmadienis", hours: "9:00 - 18:00", status: "open" },
    { day: "Antradienis", hours: "9:00 - 18:00", status: "open" },
    { day: "Trečiadienis", hours: "9:00 - 18:00", status: "open" },
    { day: "Ketvirtadienis", hours: "9:00 - 18:00", status: "open" },
    { day: "Penktadienis", hours: "9:00 - 18:00", status: "open" },
    { day: "Šeštadienis", hours: "10:00 - 15:00", status: "limited" },
    { day: "Sekmadienis", hours: "Uždaryta", status: "closed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Susisiekite <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">su mumis</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Turite klausimų apie keliones? Mūsų komanda pasiruošusi jums padėti!
          </p>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <Phone size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Skambinkite dabar</h3>
            <p className="mb-4 opacity-90">Greičiausias būdas gauti atsakymą</p>
            <a
              href="tel:+37051234567"
              className="bg-white hover:bg-gray-100 text-green-600 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 inline-block"
            >
              +370 5 123 4567
            </a>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <Mail size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Rašykite el. laišką</h3>
            <p className="mb-4 opacity-90">Atsakysime per 2-4 valandas</p>
            <a
              href="mailto:info@koradius-travel.com"
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 inline-block"
            >
              Rašyti laišką
            </a>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <MessageCircle size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Live Chat</h3>
            <p className="mb-4 opacity-90">Tiesioginis pokalbis su konsultantu</p>
            <button className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Pradėti pokalbį
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">Kontaktinė informacija</h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`${info.color} ${info.bgColor} p-3 rounded-full flex-shrink-0`}>
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">{info.title}</h3>
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
            </div>

            {/* Office Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Darbo laikas</h3>
              <div className="space-y-3">
                {officeHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700">{schedule.day}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">{schedule.hours}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        schedule.status === 'open' ? 'bg-green-500' :
                        schedule.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border-l-4 border-red-500">
              <h3 className="font-bold text-red-800 mb-3 flex items-center">
                <Phone className="mr-2" size={20} />
                Skubus ryšys kelionės metu
              </h3>
              <p className="text-red-700 text-sm mb-2">24/7 pagalbos linija:</p>
              <a
                href="tel:+37060099999"
                className="text-red-800 font-bold text-lg hover:text-red-900 transition-colors duration-300"
              >
                +370 600 99999
              </a>
              <p className="text-red-600 text-xs mt-2">
                Tik skubiais atvejais kelionės metu
              </p>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Sekite mus</h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <Facebook size={24} />
                </a>
                <a
                  href="#"
                  className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <Instagram size={24} />
                </a>
                <a
                  href="#"
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <Youtube size={24} />
                </a>
              </div>
              <p className="text-gray-600 text-sm mt-4">
                Sekite mūsų naujienas ir kelionių pasiūlymus socialiniuose tinkluose
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">Parašykite mums</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vardas, pavardė *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                        placeholder="Jūsų vardas ir pavardė"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      El. paštas *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                        placeholder="jusu@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefonas
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                        placeholder="+370 600 12345"
                      />
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pageidaujamas ryšio būdas
                    </label>
                    <select
                      name="preferredContact"
                      value={formData.preferredContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                    >
                      <option value="email">El. paštas</option>
                      <option value="phone">Telefonas</option>
                      <option value="both">Abu būdai</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Skubumas
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                    >
                      <option value="normal">Įprastas</option>
                      <option value="urgent">Skubus</option>
                      <option value="emergency">Labai skubus</option>
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
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Mūsų buveinė</h2>
              <p className="text-gray-600">Atvykite į mūsų biurą Vilniaus centre</p>
            </div>
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin size={48} className="mx-auto mb-4" />
                <p className="text-lg font-semibold">Čia būtų Google Maps žemėlapis</p>
                <p className="text-sm">Gedimino pr. 45-7, Vilnius</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>🚗 Mokamas parkavimas šalia</p>
                  <p>🚌 Autobusų stotelė "Lukiškės" (200m)</p>
                  <p>🚇 Metro stotis "Lukiškės" (300m)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            Dažnai užduodami <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">klausimai</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Kaip greitai atsakote į užklausas?</h3>
                <p className="text-gray-600">Į el. laiškus atsakome per 2-4 valandas darbo dienomis. Telefonu - iš karto.</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Ar galiu atvykti be išankstinio susitarimo?</h3>
                <p className="text-gray-600">Taip, bet rekomenduojame iš anksto susitarti, kad galėtume skirti pakankamai laiko.</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Ar teikiate konsultacijas lietuvių kalba?</h3>
                <p className="text-gray-600">Taip, visi mūsų specialistai kalba lietuviškai ir supranta vyresnio amžiaus žmonių poreikius.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Ar galiu keisti kelionės detales?</h3>
                <p className="text-gray-600">Taip, priklausomai nuo kelionės tipo ir laiko. Susisiekite su mumis dėl detalių.</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Kokios mokėjimo galimybės?</h3>
                <p className="text-gray-600">Priimame grynuosius, korteles, banko pavedimus ir išsimokėjimą.</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">Ar turite draudimą?</h3>
                <p className="text-gray-600">Taip, turime visus reikalingus draudimus ir esame LTKIA nariai.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;