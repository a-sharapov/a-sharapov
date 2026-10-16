import en from './en';
import ru from './ru';

export var LOCALES = { ru, en };

export type Locale = keyof typeof LOCALES;
export type Dictionary = typeof ru;

export var DEFAULT_LOCALE: Locale = 'ru';

export var resolveLocale = (languageCode?: string): Locale =>
  ((base) =>
    Object.hasOwn(LOCALES, base) ? (base as Locale) : DEFAULT_LOCALE)(
    String(languageCode ?? '')
      .toLowerCase()
      .split('-')[0]
  );

export var selectDictionary = (languageCode?: string): Dictionary =>
  LOCALES[resolveLocale(languageCode)];
