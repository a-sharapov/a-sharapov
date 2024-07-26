import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '@lib/l18n'

export var pipe =
  (...fns) =>
  (payload) =>
    fns.reduce((arg, fn) => (arg instanceof Promise ? arg.then(fn) : fn(arg)), payload)

export var determineLocale = (url) =>
  pipe(
    (url) => url.split('/')[0],
    (url) => (AVAILABLE_LOCALES.includes(url) ? url : DEFAULT_LOCALE)
  )(url)
