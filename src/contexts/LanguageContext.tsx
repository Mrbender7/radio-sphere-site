import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import translations, { type Language } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES: Language[] = ["fr", "en", "es", "de", "ja", "it", "nl", "pt", "pl", "zh", "tr", "ru", "id"];

export function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem("radiosphere_language");
    if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) return stored as Language;
    const nav = navigator.language?.toLowerCase();
    for (const lang of SUPPORTED_LANGUAGES) {
      if (nav?.startsWith(lang)) return lang;
    }
    return "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem("radiosphere_language", lang); } catch {}
  }, []);

  // Update <html lang> and <title> dynamically
  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  const t = useCallback((key: string): string => {
    return translations[language][key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
