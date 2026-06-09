"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import {
  defaultLanguage,
  formatMessage,
  getDictionary,
  supportedLanguages,
} from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "kowac-language";
const LANGUAGE_CHANGE_EVENT = "kowac-language-change";

const LanguageContext = createContext(null);

function isSupportedLanguage(value) {
  return supportedLanguages.some((item) => item.code === value);
}

function getStoredLanguage() {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);

  return isSupportedLanguage(savedLanguage) ? savedLanguage : defaultLanguage;
}

function subscribeToLanguageChange(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, callback);
  };
}

export function LanguageProvider({ children }) {
  const language = useSyncExternalStore(subscribeToLanguageChange, getStoredLanguage, () => defaultLanguage);
  const setLanguage = useCallback((nextLanguage) => {
    const normalizedLanguage = typeof nextLanguage === "function"
      ? nextLanguage(getStoredLanguage())
      : nextLanguage;

    if (!isSupportedLanguage(normalizedLanguage)) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
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
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
