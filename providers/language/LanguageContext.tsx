"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "zh-TW";

type TranslationValue = string | { [key: string]: TranslationValue };

interface TranslationsType {
  [key: string]: TranslationValue;
}

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  getMultiLangValue: (key: string) => MultiLangValue;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};

export { useTranslation };

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize with a default value that's consistent between server and client
  const [language, setLanguage] = useState<Language>("en");
  const [translations, setTranslations] = useState<
    Record<Language, TranslationsType>
  >({} as Record<Language, TranslationsType>);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("language") as Language;
      if (savedLang && (savedLang === "en" || savedLang === "zh-TW")) {
        setLanguage(savedLang);
      } else {
        // Check browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("zh")) {
          setLanguage("zh-TW");
        }
      }
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);

        // Load translations synchronously
        const [enData, zhData] = await Promise.all([
          fetch("/locales/en.json").then((res) => res.json()),
          fetch("/locales/zh-TW.json").then((res) => res.json()),
        ]);

        if (!enData || !zhData) {
          throw new Error("Failed to load translation files");
        }

        setTranslations({
          en: enData,
          "zh-TW": zhData,
        });
      } catch (error) {
        console.error("Failed to load translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
    }
  }, [language]);

  const getValue = (key: string, lang: Language): string => {
    if (isLoading || !translations[lang]) {
      return key;
    }

    try {
      const keys = key.split(".");
      let current: TranslationValue | Record<string, TranslationValue> =
        translations[lang];

      for (const k of keys) {
        if (current === undefined || current === null) {
          return key;
        }
        if (typeof current !== "object") {
          return key;
        }
        current = (current as Record<string, TranslationValue>)[k];
      }

      if (current === undefined || current === null) {
        return key;
      }

      if (typeof current !== "string") {
        return key;
      }

      return current;
    } catch (error) {
      return key;
    }
  };

  const t = (
    key: string,
    variables?: Record<string, string | number>
  ): string => {
    const text = getValue(key, language);

    if (variables) {
      return Object.entries(variables).reduce(
        (acc, [varKey, val]) => acc.replace(`{{${varKey}}}`, String(val)),
        text
      );
    }

    return text;
  };

  const getMultiLangValue = (key: string): MultiLangValue => {
    return {
      en: getValue(key, "en"),
      "zh-TW": getValue(key, "zh-TW"),
    };
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, getMultiLangValue, isLoading }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
