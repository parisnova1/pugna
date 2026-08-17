import { createContext, useContext, useState, type ReactNode } from 'react'
import { en, de, type TranslationKey } from './translations'

export type Lang = 'en' | 'de'
const STORAGE_KEY = 'pugna_lang'

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, de }

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'de' ? stored : 'de'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = (next: Lang) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const t: LanguageContextValue['t'] = (key, vars) => {
    let text = dictionaries[lang][key] ?? en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.split(`{{${k}}}`).join(String(v))
      }
    }
    return text
  }

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
