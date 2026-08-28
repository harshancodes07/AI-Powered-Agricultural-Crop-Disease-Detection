// i18next setup. All UI text lives in en.json / ta.json — never inline in a
// component. Adding a language means adding one JSON file and one entry here.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import ta from './ta.json'

export const LANGUAGES = [
  { code: 'en', labelKey: 'english', nativeLabel: 'English' },
  { code: 'ta', labelKey: 'tamil', nativeLabel: 'தமிழ்' }
]

const STORAGE_KEY = 'cropcare.language'

function detectLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  // Fall back to the device language if we support it.
  const browser = (navigator.language || 'en').split('-')[0]
  return LANGUAGES.some((l) => l.code === browser) ? browser : 'en'
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export function setLanguage(code) {
  i18n.changeLanguage(code)
  localStorage.setItem(STORAGE_KEY, code)
  // Keeps screen readers and browser hyphenation correct for the active script.
  document.documentElement.lang = code
}

document.documentElement.lang = i18n.language

export default i18n
