import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./i18nResources";

const STORAGE_KEY = "skyline-arcade:lang";

export type AppLang = "ru" | "en";

export function getStoredLang(): AppLang {
  if (typeof window === "undefined") return "ru";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "en" ? "en" : "ru";
}

export function storeLang(lang: AppLang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}

export function initI18n() {
  if (i18n.isInitialized) return i18n;
  i18n.use(initReactI18next).init({
    resources,
    lng: getStoredLang(),
    fallbackLng: "ru",
    interpolation: { escapeValue: false },
    returnEmptyString: false
  });
  return i18n;
}

export async function setAppLanguage(lang: AppLang) {
  storeLang(lang);
  await i18n.changeLanguage(lang);
}

export { i18n };

