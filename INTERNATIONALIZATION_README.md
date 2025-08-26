# Internationalization (i18n) Implementation Guide

This guide explains how to implement and use the internationalization feature in your React application to support Lithuanian, Russian, and English languages.

## 🚀 Features

- **Multi-language Support**: Lithuanian (LT), English (EN), Russian (RU)
- **Automatic Language Detection**: Detects user's preferred language from browser settings
- **Language Persistence**: Remembers user's language choice in localStorage
- **Fallback Language**: Lithuanian as the default fallback language
- **Easy Language Switching**: User-friendly language switcher component
- **Comprehensive Translations**: Covers all major UI elements and page content

## 📁 File Structure

```
src/
├── i18n/
│   ├── index.ts                 # i18n configuration
│   └── locales/
│       ├── lt.json             # Lithuanian translations
│       ├── en.json             # English translations
│       └── ru.json             # Russian translations
├── components/
│   └── LanguageSwitcher.tsx    # Language switcher component
├── hooks/
│   └── useLanguage.ts          # Custom language management hook
└── main.tsx                    # i18n initialization
```

## 🛠️ Implementation Steps

### 1. Install Dependencies

The required packages are already installed in your `package.json`:
- `i18next`: Core internationalization framework
- `react-i18next`: React integration for i18next
- `i18next-browser-languagedetector`: Automatic language detection

### 2. Create Translation Files

Three JSON files have been created with translations for:
- **Common UI elements** (buttons, labels, etc.)
- **Navigation items** (menu links)
- **Page content** (home, about, gallery, contact, etc.)
- **Authentication** (login, logout, etc.)
- **Payment** (payment forms, success/error messages)
- **Footer** (links, descriptions, etc.)

### 3. Configure i18n

The `src/i18n/index.ts` file configures:
- Language resources
- Fallback language (Lithuanian)
- Language detection order (localStorage → browser → HTML tag)
- Debug mode for development

### 4. Initialize i18n

Import the i18n configuration in `src/main.tsx` to initialize the system when the app starts.

### 5. Use Translations in Components

#### Basic Usage

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
};
```

#### Using the Custom Hook

```tsx
import { useLanguage } from '../hooks/useLanguage';

const MyComponent = () => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div>
      <p>Current language: {currentLanguage}</p>
      <button onClick={() => changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
};
```

### 6. Language Switcher Component

The `LanguageSwitcher` component provides:
- Visual language selection with flags
- Hover dropdown menu
- Current language indication
- Smooth transitions and animations

## 📝 Translation Keys Structure

### Common Elements
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save"
  }
}
```

### Navigation
```json
{
  "navigation": {
    "home": "Home",
    "about": "About",
    "gallery": "Gallery",
    "contact": "Contact"
  }
}
```

### Page Content
```json
{
  "home": {
    "hero": {
      "title": "Discover Amazing Tours",
      "subtitle": "Experience the world with our expert guides"
    },
    "stats": {
      "tours": "Tours",
      "countries": "Countries"
    }
  }
}
```

## 🔧 Adding New Translations

### 1. Add New Keys

Add new translation keys to all three language files:

**English (`en.json`):**
```json
{
  "newSection": {
    "title": "New Section Title",
    "description": "This is a new section description"
  }
}
```

**Lithuanian (`lt.json`):**
```json
{
  "newSection": {
    "title": "Naujos sekcijos pavadinimas",
    "description": "Tai yra naujos sekcijos aprašymas"
  }
}
```

**Russian (`ru.json`):**
```json
{
  "newSection": {
    "title": "Название новой секции",
    "description": "Это описание новой секции"
  }
}
```

### 2. Use in Components

```tsx
const NewComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('newSection.title')}</h2>
      <p>{t('newSection.description')}</p>
    </div>
  );
};
```

## 🌐 Language Detection

The system automatically detects the user's preferred language in this order:
1. **localStorage**: User's previously selected language
2. **Browser settings**: User's browser language preference
3. **HTML lang attribute**: Fallback to HTML tag language
4. **Default**: Lithuanian (as configured)

## 💾 Language Persistence

User's language choice is automatically saved to localStorage and restored on subsequent visits.

## 🎨 Styling the Language Switcher

The `LanguageSwitcher` component uses Tailwind CSS classes and can be customized by modifying:
- Colors and backgrounds
- Hover effects and transitions
- Dropdown positioning and animations
- Flag icons and text styling

## 🚨 Troubleshooting

### Common Issues

1. **Translations not loading**: Check that `src/i18n` is imported in `main.tsx`
2. **Language not changing**: Verify the language switcher is properly connected
3. **Missing translations**: Ensure all keys exist in all three language files
4. **Console errors**: Check browser console for i18n-related errors

### Debug Mode

Enable debug mode in `src/i18n/index.ts` by setting `debug: true` to see detailed i18n logs in the console.

## 📚 Additional Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Browser Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

## 🔄 Future Enhancements

Consider adding these features in the future:
- **RTL Language Support**: For languages like Arabic or Hebrew
- **Dynamic Language Loading**: Load languages on-demand for better performance
- **Translation Management**: Admin interface for managing translations
- **Pluralization**: Handle plural forms for different languages
- **Date/Number Formatting**: Localized date and number formats

## 📞 Support

If you encounter any issues with the internationalization feature, check the console for error messages and ensure all translation files are properly formatted as valid JSON.
