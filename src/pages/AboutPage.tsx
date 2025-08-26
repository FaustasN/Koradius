import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Users, Globe, Heart, Shield, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const AboutPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleContact = () => {
    navigate('/contact');
  };

  const handleViewTours = () => {
    navigate('/search');
  };



  const values = [
    {
      icon: Heart,
      title: t('about.values.customerCare.title'),
      description: t('about.values.customerCare.description')
    },
    {
      icon: Shield,
      title: t('about.values.reliability.title'),
      description: t('about.values.reliability.description')
    },
    {
      icon: Globe,
      title: t('about.values.experience.title'),
      description: t('about.values.experience.description')
    },
    {
      icon: Clock,
      title: t('about.values.support24_7.title'),
      description: t('about.values.support24_7.description')
    }
  ];

  const achievements = [
    { number: t('about.achievements.yearsExperience.number'), label: t('about.achievements.yearsExperience.label'), description: t('about.achievements.yearsExperience.description') },
    { number: t('about.achievements.happyCustomers.number'), label: t('about.achievements.happyCustomers.label'), description: t('about.achievements.happyCustomers.description') },
    { number: t('about.achievements.countries.number'), label: t('about.achievements.countries.label'), description: t('about.achievements.countries.description') },
    { number: t('about.achievements.customerSatisfaction.number'), label: t('about.achievements.customerSatisfaction.label'), description: t('about.achievements.customerSatisfaction.description') }
  ];



  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {t('about.hero.title.firstPart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">{t('about.hero.title.secondPart')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('about.hero.subtitle')}
          </p>
        </div>

        {/* Hero Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">{t('about.story.title')}</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                {t('about.story.paragraph1')}
              </p>
              <p>
                {t('about.story.paragraph2')}
              </p>
              <p>
                {t('about.story.paragraph3')}
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
              <div className="text-sm">{t('about.heroBadge.yearsExperience')}</div>
            </div>
          </div>
        </div>



        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{t('about.values.title')}</h2>
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
          <h2 className="text-3xl font-bold text-center mb-12">{t('about.achievements.title')}</h2>
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
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">{t('about.certifications.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Award className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t('about.certifications.ltkia.title')}</h3>
              <p className="text-gray-600">{t('about.certifications.ltkia.description')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Shield className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t('about.certifications.iata.title')}</h3>
              <p className="text-gray-600">{t('about.certifications.iata.description')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <Globe className="text-teal-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t('about.certifications.etoa.title')}</h3>
              <p className="text-gray-600">{t('about.certifications.etoa.description')}</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('about.missionVision.mission.title')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('about.missionVision.mission.description')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('about.missionVision.vision.title')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('about.missionVision.vision.description')}
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            {t('about.callToAction.title')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleContact}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg btn-hover-smooth"
            >
              {t('about.callToAction.contactButton')}
            </button>
            <button 
              onClick={handleViewTours}
              className="border-2 border-teal-500 hover:bg-teal-500 hover:text-white text-teal-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 btn-hover-smooth"
            >
                            {t('about.callToAction.viewToursButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;