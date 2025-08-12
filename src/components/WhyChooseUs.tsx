import React from 'react';
import { Shield, Heart, Award, Clock, Users, Globe } from 'lucide-react';

const WhyChooseUs = () => {
  const features = [
    {
      icon: Heart,
      title: "Rūpestis klientais",
      description: "Kiekvienas klientas mums yra svarbus. Ypač rūpinamės vyresnio amžiaus žmonių komfortu ir poreikiais.",
      color: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      icon: Shield,
      title: "Patikimumas",
      description: "7 metų patirtis, LTKIA narystė ir visapusiškas draudimas garantuoja jūsų saugumą.",
      color: "text-green-500",
      bgColor: "bg-green-50"
    },
    {
      icon: Award,
      title: "Aukšta kokybė",
      description: "Kruopščiai atrinkti partneriai ir paslaugų teikėjai užtikrina aukščiausią kokybę.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50"
    },
    {
      icon: Clock,
      title: "24/7 palaikymas",
      description: "Esame pasiekiami bet kuriuo paros metu kelionės metu. Skubios pagalbos linija visada veikia.",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Users,
      title: "Lietuviška komanda",
      description: "Visi mūsų specialistai kalba lietuviškai ir supranta lietuvių kultūrą bei poreikius.",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: Globe,
      title: "Platus tinklas",
      description: "Partneriai 50+ šalyse leidžia mums siūlyti geriausius pasiūlymus ir kainas.",
      color: "text-teal-500",
      bgColor: "bg-teal-50"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Kodėl rinktis <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">mus?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            7 metų patirtis ir tūkstančiai patenkintų klientų kalba už mus
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group btn-hover-smooth"
              >
                <div className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={feature.color} size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-teal-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-teal-600 mb-2">7+</div>
              <div className="text-gray-600">Metų patirtis</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-teal-600 mb-2">5000+</div>
              <div className="text-gray-600">Laimingų klientų</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-teal-600 mb-2">98%</div>
              <div className="text-gray-600">Klientų pasitenkinimas</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-teal-600 mb-2">50+</div>
              <div className="text-gray-600">Šalių</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;