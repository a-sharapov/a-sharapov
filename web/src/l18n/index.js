import agnostic from './agnostic'
import en from './en'
import ru from './ru'

const createLocale = (locale) => ({
  ...locale,
  ...agnostic
})

export var LOCALES = {
  ru: createLocale(ru),
  en: createLocale(en)
}

export var AVAILABLE_LOCALES = Object.keys(LOCALES)

export var DEFAULT_LOCALE = AVAILABLE_LOCALES[0]
