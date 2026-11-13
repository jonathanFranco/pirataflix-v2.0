import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LANGUAGES, MESSAGES, type Language, type Messages } from "./messages";
import { DEFAULT_LANGUAGE, routePath, translatePath, type RouteKey } from "./routes.ts";

export { LANGUAGES, type Language };

const STORAGE_KEY = "idioma";

type I18n = {
  language: Language;
  languageCode: string;
  region: string;
  t: Messages;
  href: (key: RouteKey, id?: number | string) => string;
  setLanguage: (language: Language) => void;
};

const I18nContext = createContext<I18n | null>(null);

export function preferredLanguage(): Language {
  const codes = LANGUAGES.map((l) => l.code);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (codes.includes(stored as Language)) return stored as Language;
  } catch {}
  for (const browserLanguage of navigator.languages) {
    const match = codes.find((code) => code.split("-")[0] === browserLanguage.split("-")[0]);
    if (match) return match;
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const value = useMemo<I18n>(
    () => ({
      language,
      languageCode: language.split("-")[0],
      region: LANGUAGES.find((l) => l.code === language)!.region,
      t: MESSAGES[language],
      href: (key, id) => routePath(language, { key, id }),
      setLanguage: (next) =>
        navigate(`${translatePath(window.location.pathname, next)}${window.location.search}`, {
          replace: true,
          preventScrollReset: true,
        }),
    }),
    [language, navigate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n precisa estar dentro de <I18nProvider>");
  return context;
}
