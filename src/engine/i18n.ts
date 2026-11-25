import en from '../i18n/en.json'
import type { Locale } from './save'
export type Dictionary = Record<string, string>
/** Ali's Verse is English only; the lookup layer stays so every UI string lives in one file. */
const DICTIONARY: Dictionary = en
export class I18n {
  readonly locale: Locale = 'en'
  constructor() {
    document.documentElement.lang = this.locale
  }
  /** Look up `key`, replacing `{name}` placeholders. Missing keys render the key so gaps are visible. */
  t(key: string, vars: Record<string, string | number> = {}): string {
    const text = DICTIONARY[key] ?? key
    return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
  }
}
export const DICTIONARY_KEYS = Object.keys(en)
