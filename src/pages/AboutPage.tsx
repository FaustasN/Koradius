import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Users, Globe, Heart, Shield, Clock, MapPin, Phone, Mail } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  const handleContact = () => {
    navigate('/contact');
  };

  const handleViewTours = () => {
    navigate('/search');
  };



  const values = [
    {
      icon: Heart,
      title: "Rūpestis klientais",
      description: "Kiekvienas klientas mums yra svarbus. Stengiamės suprasti jūsų poreikius ir sukurti tobulą kelionę, ypač atsižvelgdami į vyresnio amžiaus žmonių poreikius."
    },
    {
      icon: Shield,
      title: "Patikimumas",
      description: "7 metai rinkoje įrodė mūsų patikimumą. Garantuojame kokybę ir saugumą visose kelionėse. Turime visus reikalingus sertifikatus ir draudimus."
    },
    {
      icon: Globe,
      title: "Patirtis",
      description: "Turime platų partnerių tinklą visame pasaulyje ir žinome geriausius pasiūlymus. Mūsų komanda reguliariai keliauja ir tikrina paslaugų kokybę."
    },
    {
      icon: Clock,
      title: "24/7 palaikymas",
      description: "Esame pasiekiami bet kuriuo paros metu, kad padėtume spręsti bet kokius klausimus kelionės metu. Turime skubios pagalbos liniją."
    }
  ];

  const achievements = [
    { number: "7+", label: "Metų patirtis", description: "Nuo 2017 metų" },
    { number: "5000+", label: "Laimingų klientų", description: "Kasmet aptarnaujame apie 1000 klientų" },
    { number: "50+", label: "Šalių", description: "Visose žemynuose" },
    { number: "98%", label: "Klientų pasitenkinimas", description: "Pagal atsiliepimus" }
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
            Jau 7 metus kuriame nepamirštamus kelionių išgyvenimus lietuviams. 
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
                atrasti pasaulio grožį. 2017 metais įskūrusi nedidelė kelionių agentūra, kuri 
                svajojo sukurti paslaugą, kuri būtų pritaikyta būtent 
                lietuvių poreikiams.
              </p>
              <p>
                Per 7 metus išaugome į patikimą kelionių partnerį, kuris specializuojasi 
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
              <div className="text-3xl font-bold">7+</div>
              <div className="text-sm">Metų patirtis</div>
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
              <p className="text-gray-600">Lietuvos turizmo ir kelionių agentūrų asociacijos narys nuo 2017</p>
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