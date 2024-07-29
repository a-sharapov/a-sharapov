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

export var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export var toSneakeCase = (str) => str.replace(/ /g, '_').toLowerCase()

export var closeDialog = (dialog) => dialog.close()

export var showDialog = (dialog) => dialog.showModal()

export var hasNoExtension = (slug) => (slug ? slug.split('.').length : 1)
