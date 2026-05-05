'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from './translations';

interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof translations)['en'] | (typeof translations)['id'];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    const saved = localStorage.getItem('rs-locale') as Locale;
    if (saved && (saved === 'id' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('rs-locale', newLocale);
  };

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
