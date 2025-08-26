import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = useCallback((language: string) => {
    i18n.changeLanguage(language);
    // Store the selected language in localStorage
    localStorage.setItem('preferredLanguage', language);
  }, [i18n]);

  const getCurrentLanguage = useCallback(() => {
    return i18n.language;
  }, [i18n.language]);

  const getAvailableLanguages = useCallback(() => {
    return [
      { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', nativeName: 'Lietuvių' },
      { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' }
    ];
  }, []);

  const isRTL = useCallback(() => {
    // Add RTL language support if needed in the future
    return false;
  }, []);

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    isRTL,
    currentLanguage: i18n.language,
    isLanguageChanging: i18n.isLanguageChanging
  };
};
