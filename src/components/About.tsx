import React from 'react';
import { Award, Users, Globe, Heart, Shield, Clock } from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: "Rūta Petraitienė",
      position: "Įkūrėja ir vadovė",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "15 metų patirtis turizmo srityje"
    },
    {
      name: "Mindaugas Kazlauskas",
      position: "Kelionių konsultantas",
      image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "Specialistas Europos kryptims"
    },
    {
      name: "Gintarė Jonaitienė",
      position: "Medicinio turizmo koordinatorė",
      image: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      description: "Sveikatos kelionių ekspertė"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Rūpestis klientais",
      description: "Kiekvienas klientas mums yra svarbus. Stengiamės suprasti jūsų poreikius ir sukurti tobulą kelionę."
    },
    {
      icon: Shield,
      title: "Patikimumas",
      description: "15 metų rinkoje įrodė mūsų patikimumą. Garantuojame kokybę ir saugumą visose kelionėse."
    },
    {
      icon: Globe,
      title: "Patirtis",
      description: "Turime plačią partnerių tinklą visame pasaulyje ir žinome geriausius pasiūlymus."
    },
    {
      icon: Clock,
      title: "24/7 palaikymas",
      description: "Esame pasiekiami bet kuriuo paros metu, kad padėtume spręsti bet kokius klausimus."
    }
  ];

  const achievements = [
    { number: "15+", label: "Metų patirtis" },
    { number: "5000+", label: "Laimingų klientų" },
    { number: "50+", label: "Šalių" },
    { number: "98%", label: "Klientų pasitenkinimas" }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Apie <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">mus</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Jau 15 metų kuriame nepamirštamus kelionių išgyvenimus lietuviams. 
            Mūsų misija - padėti jums atrasti pasaulio grožį saugiai ir patogiai.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-6">Mūsų istorija</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Koradius Travel gimė iš aistrės kelionėms ir noro padėti lietuviams 
                atrasti pasaulio grožį. 2009 metais įkūrusi nedidelę kelionių agentūrą, 
                Rūta Petraitienė svajojo sukurti paslaugą, kuri būtų pritaikyta būtent 
                lietuvių poreikiams.
              </p>
              <p>
                Per 15 metų išaugome į patikimą kelionių partnerį, kuris specializuojasi 
                ne tik įprastose atostogose, bet ir medicininiam turizmui. Ypač didžiuojamės 
                tuo, kad mūsų paslaugos yra pritaikytos vyresnio amžiaus žmonėms - 
                suprantame jūsų poreikius ir rūpinamės komfortu.
              </p>
              <p>
                Šiandien esame išsiuntę į keliones daugiau nei 5000 lietuvių ir tęsiame 
                augti, išlaikydami asmeninį požiūrį į kiekvieną klientą.
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
              <div className="text-2xl font-bold">15+</div>
              <div className="text-sm">Metų patirtis</div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">Mūsų vertybės</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 btn-hover-smooth"
                >
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="text-white" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">Mūsų komanda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="text-center bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 btn-hover-smooth"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-teal-100"
                />
                <h4 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h4>
                <p className="text-teal-600 font-semibold mb-3">{member.position}</p>
                <p className="text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold text-center mb-12">Mūsų pasiekimai</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">
                  {achievement.number}
                </div>
                <div className="text-lg opacity-90">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">Sertifikatai ir narystės</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="bg-gray-100 px-6 py-4 rounded-lg">
              <Award className="text-gray-600 mx-auto mb-2" size={32} />
              <div className="text-sm font-semibold text-gray-600">LTKIA narys</div>
            </div>
            <div className="bg-gray-100 px-6 py-4 rounded-lg">
              <Shield className="text-gray-600 mx-auto mb-2" size={32} />
              <div className="text-sm font-semibold text-gray-600">IATA agentas</div>
            </div>
            <div className="bg-gray-100 px-6 py-4 rounded-lg">
              <Globe className="text-gray-600 mx-auto mb-2" size={32} />
              <div className="text-sm font-semibold text-gray-600">ETOA narys</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;