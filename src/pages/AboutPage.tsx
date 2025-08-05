import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Users, Globe, Heart, Shield, Clock, MapPin, Phone, Mail } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  const handleContact = () => {
    navigate('/contact');
  };

  const handleViewTours = () => {
    navigate('/tours');
  };

  const teamMembers = [
    {
      name: "Rūta Petraitienė",
      position: "Įkūrėja ir vadovė",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "15 metų patirtis turizmo srityje",
      email: "ruta@koradius-travel.com",
      phone: "+370 600 12345",
      specialization: "Europos kelionės, VIP paslaugos"
    },
    {
      name: "Mindaugas Kazlauskas",
      position: "Kelionių konsultantas",
      image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "Specialistas Europos kryptims",
      email: "mindaugas@koradius-travel.com",
      phone: "+370 600 12346",
      specialization: "Kultūrinės kelionės, gidavimas"
    },
    {
      name: "Gintarė Jonaitienė",
      position: "Medicinio turizmo koordinatorė",
      image: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "Sveikatos kelionių ekspertė",
      email: "gintare@koradius-travel.com",
      phone: "+370 600 12347",
      specialization: "Medicininis turizmas, reabilitacija"
    },
    {
      name: "Darius Mockus",
      position: "Azijos krypčių specialistas",
      image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "Egzotiškų kelionių ekspertas",
      email: "darius@koradius-travel.com",
      phone: "+370 600 12348",
      specialization: "Azijos šalys, nuotykių turizmas"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Rūpestis klientais",
      description: "Kiekvienas klientas mums yra svarbus. Stengiamės suprasti jūsų poreikius ir sukurti tobulą kelionę, ypač atsižvelgdami į vyresnio amžiaus žmonių poreikius."
    },
    {
      icon: Shield,
      title: "Patikimumas",
      description: "15 metų rinkoje įrodė mūsų patikimumą. Garantuojame kokybę ir saugumą visose kelionėse. Turime visus reikalingus sertifikatus ir draudimus."
    },
    {
      icon: Globe,
      title: "Patirtis",
      description: "Turime plačią partnerių tinklą visame pasaulyje ir žinome geriausius pasiūlymus. Mūsų komanda reguliariai keliauja ir tikrina paslaugų kokybę."
    },
    {
      icon: Clock,
      title: "24/7 palaikymas",
      description: "Esame pasiekiami bet kuriuo paros metu, kad padėtume spręsti bet kokius klausimus kelionės metu. Turime skubios pagalbos liniją."
    }
  ];

  const achievements = [
    { number: "7+", label: "Metų patirtis", description: "Nuo 2009 metų" },
    { number: "5000+", label: "Laimingų klientų", description: "Kasmet aptarnaujame ~400 klientų" },
    { number: "50+", label: "Šalių", description: "Visose žemynuose" },
    { number: "98%", label: "Klientų pasitenkinimas", description: "Pagal atsiliepimus" }
  ];

  const timeline = [
    {
      year: "2009",
      title: "Įmonės įkūrimas",
      description: "Rūta Petraitienė įkūrė nedidelę kelionių agentūrą Vilniuje"
    },
    {
      year: "2012",
      title: "Medicinio turizmo pradžia",
      description: "Pradėjome siūlyti medicinio turizmo paslaugas į Turkiją ir Vengriją"
    },
    {
      year: "2015",
      title: "Komandos plėtra",
      description: "Prisijungė specialistai Europos ir Azijos kryptims"
    },
    {
      year: "2018",
      title: "Digitalizacija",
      description: "Sukūrėme modernią internetinę sistemą kelionių valdymui"
    },
    {
      year: "2020",
      title: "COVID-19 iššūkiai",
      description: "Sėkmingai prisitaikėme prie pandemijos iššūkių ir saugių kelionių"
    },
    {
      year: "2024",
      title: "Šiandien",
      description: "Esame patikimi kelionių partneriai su 5000+ patenkintų klientų"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Apie <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">mus</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Jau 15 metų kuriame nepamirštamus kelionių išgyvenimus lietuviams. 
            Mūsų misija - padėti jums atrasti pasaulio grožį saugiai ir patogiai.
          </p>
        </div>

        {/* Hero Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Mūsų istorija</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Koradius Travel gimė iš aistrės kelionėms ir noro padėti lietuviams 
                atrasti pasaulio grožį. 2009 metais įkūrusi nedidelę kelionių agentūrą, 
                Rūta Petraitienė svajojo sukurti paslaugą, kuri būtų pritaikyta būtent 
                lietuvių poreikiams ir mentalitetui.
              </p>
              <p>
                Per 15 metų išaugome į patikimą kelionių partnerį, kuris specializuojasi 
                ne tik įprastose atostogose, bet ir medicininiam turizmui. Ypač didžiuojamės 
                tuo, kad mūsų paslaugos yra pritaikytos vyresnio amžiaus žmonėms - 
                suprantame jūsų poreikius ir rūpinamės komfortu kiekviename žingsnyje.
              </p>
              <p>
                Šiandien esame išsiuntę į keliones daugiau nei 5000 lietuvių ir tęsiame 
                augti, išlaikydami asmeninį požiūrį į kiekvieną klientą. Mūsų tikslas - 
                ne tik parduoti kelionę, bet sukurti nepamirštamą išgyvenimą.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Kelionių agentūra"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl">
              <div className="text-3xl font-bold">15+</div>
              <div className="text-sm">Metų patirtis</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Mūsų kelias</h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="text-2xl font-bold text-teal-600 mb-2">{item.year}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="relative z-10 w-6 h-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full border-4 border-white shadow-lg"></div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Mūsų vertybės</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Mūsų komanda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-teal-100"
                />
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-teal-600 font-semibold mb-3">{member.position}</p>
                <p className="text-gray-600 mb-4 text-sm">{member.description}</p>
                
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">Specializacija:</p>
                  <p className="text-sm text-gray-600">{member.specialization}</p>
                  
                  <div className="flex flex-col space-y-2 mt-4">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center justify-center space-x-2 text-teal-600 hover:text-teal-700 text-sm transition-colors duration-300"
                    >
                      <Mail size={14} />
                      <span>{member.email}</span>
                    </a>
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center justify-center space-x-2 text-teal-600 hover:text-teal-700 text-sm transition-colors duration-300"
                    >
                      <Phone size={14} />
                      <span>{member.phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-white mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Mūsų pasiekimai</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">
                  {achievement.number}
                </div>
                <div className="text-lg font-semibold opacity-90 mb-1">{achievement.label}</div>
                <div className="text-sm opacity-75">{achievement.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Sertifikatai ir narystės</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Award className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">LTKIA narys</h3>
              <p className="text-gray-600">Lietuvos turizmo ir kelionių agentūrų asociacijos narys nuo 2010 metų</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Shield className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">IATA agentas</h3>
              <p className="text-gray-600">Tarptautinės oro transporto asociacijos akredituotas agentas</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Globe className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">ETOA narys</h3>
              <p className="text-gray-600">Europos turizmo operatorių asociacijos narys</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Mūsų misija</h3>
            <p className="text-gray-600 leading-relaxed">
              Sukurti nepamirštamus kelionių išgyvenimus kiekvienam klientui, ypač 
              atsižvelgiant į vyresnio amžiaus žmonių poreikius. Teikti aukščiausios 
              kokybės paslaugas, užtikrinant saugumą, komfortą ir asmeninį požiūrį.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Mūsų vizija</h3>
            <p className="text-gray-600 leading-relaxed">
              Tapti pirmaujančia kelionių agentūra Lietuvoje, žinoma dėl išskirtinio 
              klientų aptarnavimo, patikimumo ir inovatyvių sprendimų. Padėti kiekvienam 
              lietuviui atrasti pasaulio grožį ir sukurti nepamirštamus prisiminimus.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Pasiruošę pradėti savo kelionę su mumis?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleContact}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
            >
              Susisiekti su mumis
            </button>
            <button 
              onClick={handleViewTours}
              className="border-2 border-teal-500 hover:bg-teal-500 hover:text-white text-teal-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 btn-hover-smooth"
            >
              Žiūrėti keliones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;