"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  defaultLanguage,
  formatMessage,
  getDictionary,
  supportedLanguages,
} from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "kowac-language";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(defaultLanguage);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (savedLanguage && supportedLanguages.some((item) => item.code === savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => {
    const dictionary = getDictionary(language);

    return {
      language,
      setLanguage,
      dictionary,
      supportedLanguages,
      formatMessage: (template, replacements) => formatMessage(template, replacements),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
