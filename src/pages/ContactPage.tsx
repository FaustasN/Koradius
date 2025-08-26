import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube, MessageCircle, Calendar, User, CheckCircle, X } from 'lucide-react';
import StaggeredAnimation from '../components/StaggeredAnimation';
import FadeInAnimation from '../components/FadeInAnimation';
import { contactsAPI } from '../services/adminApiService';
import { sendContactEmail } from '../services/emailService';
import { useLanguage } from '../hooks/useLanguage';

const ContactPage = () => {
  const { t } = useLanguage();
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
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const displayErrorNotification = (message: string) => {
    setErrorMessage(message);
    setShowErrorNotification(true);
    setTimeout(() => {
      setShowErrorNotification(false);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || !formData.message.trim()) {
      displayErrorNotification(t('contact.form.validation.fillAllFields'));
      return;
    }

    if (formData.name.trim().length < 3) {
      displayErrorNotification(t('contact.form.validation.nameMinLength'));
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      displayErrorNotification(t('contact.form.validation.emailInvalid'));
      return;
    }

    if (formData.phone && (formData.phone.length < 6 || !/^\d+$/.test(formData.phone))) {
      displayErrorNotification(t('contact.form.validation.phoneInvalid'));
      return;
    }

    if (formData.message.trim().length < 3) {
      displayErrorNotification(t('contact.form.validation.messageMinLength'));
      return;
    }

    if (formData.message.trim().length > 70) {
      displayErrorNotification(t('contact.form.validation.messageMaxLength'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send to admin API (existing functionality)
      await contactsAPI.submit(formData);
      
      // Send email notification
      await sendContactEmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        preferredContact: formData.preferredContact,
        urgency: formData.urgency
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        preferredContact: 'email',
        urgency: 'normal'
      });
      
      // Show beautiful success notification
      setShowSuccessNotification(true);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting contact form:', error);
      displayErrorNotification('Atsiprašome, įvyko klaida. Bandykite dar kartą arba susisiekite telefonu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contact.contactInfo.address.title'),
      details: [
        t('contact.contactInfo.address.details.0'),
        t('contact.contactInfo.address.details.1'),
        t('contact.contactInfo.address.details.2')
      ],
      color: "text-red-500"
    },
    {
      icon: Phone,
      title: t('contact.contactInfo.phone.title'),
      details: [
        t('contact.contactInfo.phone.details.0')
      ],
      color: "text-green-500"
    },
    {
      icon: Mail,
      title: t('contact.contactInfo.email.title'),
      details: [
        t('contact.contactInfo.email.details.0')
      ],
      color: "text-blue-500"
    },
    {
      icon: Clock,
      title: t('contact.contactInfo.workingHours.title'),
      details: [
        t('contact.contactInfo.workingHours.details.0'),
        t('contact.contactInfo.workingHours.details.1'),
        t('contact.contactInfo.workingHours.details.2')
      ],
      color: "text-purple-500"
    }
  ];

  const subjects = [
    t('contact.form.subjects.0'),
    t('contact.form.subjects.1'),
    t('contact.form.subjects.2'),
    t('contact.form.subjects.3'),
    t('contact.form.subjects.4'),
    t('contact.form.subjects.5'),
    t('contact.form.subjects.6'),
    t('contact.form.subjects.7')
  ];

  const officeHours = [
    { day: t('contact.contactInfo.officeHours.days.monday'), hours: t('contact.contactInfo.officeHours.hours.open'), status: "open" },
    { day: t('contact.contactInfo.officeHours.days.tuesday'), hours: t('contact.contactInfo.officeHours.hours.open'), status: "open" },
    { day: t('contact.contactInfo.officeHours.days.wednesday'), hours: t('contact.contactInfo.officeHours.hours.open'), status: "open" },
    { day: t('contact.contactInfo.officeHours.days.thursday'), hours: t('contact.contactInfo.officeHours.hours.open'), status: "open" },
    { day: t('contact.contactInfo.officeHours.days.friday'), hours: t('contact.contactInfo.officeHours.hours.open'), status: "open" },
    { day: t('contact.contactInfo.officeHours.days.saturday'), hours: t('contact.contactInfo.officeHours.hours.limited'), status: "limited" },
    { day: t('contact.contactInfo.officeHours.days.sunday'), hours: t('contact.contactInfo.officeHours.hours.closed'), status: "closed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-green-500 p-6 max-w-sm transform transition-all duration-500 ease-out">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Žinutė išsiųsta!
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ačiū už jūsų žinutę! Susisieksime su jumis per 24 valandas. Patikrinkite savo el. paštą dėl patvirtinimo.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showErrorNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-red-500 p-6 max-w-sm transform transition-all duration-500 ease-out">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="text-red-600" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Klaida
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setShowErrorNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-red-500 h-1 rounded-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <FadeInAnimation className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            {t('contact.hero.title.firstPart')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600">{t('contact.hero.title.secondPart')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('contact.hero.subtitle')}
          </p>
        </FadeInAnimation>

        {/* Quick Contact Options */}
        <StaggeredAnimation className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 btn-hover-smooth">
            <Phone size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('contact.quickContact.phone.title')}</h3>
            <p className="mb-4 opacity-90">{t('contact.quickContact.phone.description')}</p>
            <a
              href="tel:+37069498078"
              className="bg-white hover:bg-gray-100 text-green-600 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 inline-block btn-hover-smooth"
            >
              {t('contact.quickContact.phone.button')}
            </a>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 btn-hover-smooth">
            <Mail size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{t('contact.quickContact.email.title')}</h3>
            <p className="mb-4 opacity-90">{t('contact.quickContact.email.description')}</p>
            <a
              href="mailto:koradiustravel@gmail.com"
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 inline-block btn-hover-smooth"
            >
              {t('contact.quickContact.email.button')}
            </a>
          </div>

        </StaggeredAnimation>

        {/* Main Content - Redesigned Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Contact Form */}
          <StaggeredAnimation className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">{t('contact.form.title')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.name.label')}
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
                      placeholder={t('contact.form.name.placeholder')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.email.label')}
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
                      placeholder={t('contact.form.email.placeholder')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.phone.label')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        // Allow only numbers
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({
                          ...prev,
                          phone: value
                        }));
                      }}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg"
                      placeholder={t('contact.form.phone.placeholder')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.subject.label')}
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                  >
                    <option value="">{t('contact.form.subject.placeholder')}</option>
                    {subjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.preferredContact.label')}
                  </label>
                  <select
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                  >
                    <option value="email">{t('contact.form.preferredContact.email')}</option>
                    <option value="phone">{t('contact.form.preferredContact.phone')}</option>
                    <option value="both">{t('contact.form.preferredContact.both')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.urgency.label')}
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg appearance-none bg-white"
                  >
                    <option value="normal">{t('contact.form.urgency.normal')}</option>
                    <option value="urgent">{t('contact.form.urgency.urgent')}</option>
                    <option value="emergency">{t('contact.form.urgency.emergency')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('contact.form.message.label')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-all duration-300 text-lg resize-none"
                  placeholder={t('contact.form.message.placeholder')}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {t('contact.form.message.minLength')}
                  </p>
                  <p className={`text-sm font-medium ${
                    formData.message.length >= 3 && formData.message.length <= 70 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {formData.message.length}/70 {t('contact.form.message.charCount')}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3 btn-hover-smooth ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>{t('contact.form.submit.sending')}</span>
                  </>
                ) : (
                  <>
                    <Send size={24} />
                    <span>{t('contact.form.submit.button')}</span>
                  </>
                )}
              </button>
            </form>
          </StaggeredAnimation>

          {/* Right Column - Contact Information */}
          <StaggeredAnimation className="space-y-6" staggerDelay={0.15}>
            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t('contact.contactInfo.title')}</h2>
              
              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`${info.color} p-2 rounded-full flex-shrink-0`}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 mb-1">{info.title}</h3>
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
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('contact.contactInfo.officeHours.title')}</h3>
              <div className="space-y-2">
                {officeHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700 text-sm">{schedule.day}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm">{schedule.hours}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        schedule.status === 'open' ? 'bg-green-500' :
                        schedule.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
          </StaggeredAnimation>
        </div>

        {/* Map */}
        <StaggeredAnimation className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('contact.contactInfo.location.title')}</h2>
              <p className="text-gray-600">{t('contact.contactInfo.location.description')}</p>
            </div>
            <div className="h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2304.6765974!2d25.2675214!3d54.6765974!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dd946d87d7005d%3A0x11b4d455af676ea0!2s%C5%A0vitrigailos%20g.%2011A%2C%20Vilnius%2003228!5e0!3m2!1slt!2slt!4v1234567890123"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Koradius Travel - Švitrigailos g. 11A-330, Vilnius"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </StaggeredAnimation>

        {/* FAQ Section */}
        <StaggeredAnimation className="bg-white rounded-3xl shadow-lg p-8" staggerDelay={0.1}>
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
            {t('contact.contactInfo.faq.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.responseTime.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.responseTime.answer')}</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.appointment.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.appointment.answer')}</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.language.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.language.answer')}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.tripChanges.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.tripChanges.answer')}</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.payment.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.payment.answer')}</p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-4">
                <h3 className="font-bold text-gray-800 mb-2">{t('contact.contactInfo.faq.questions.insurance.question')}</h3>
                <p className="text-gray-600">{t('contact.contactInfo.faq.questions.insurance.answer')}</p>
              </div>
            </div>
          </div>
        </StaggeredAnimation>
      </div>
    </div>
  );
};

export default ContactPage;