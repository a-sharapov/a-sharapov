import { DEFAULT_LOCALE } from '@lib/l18n'
import { writable } from 'svelte/store'

var store = writable({
  sceneReady: false,
  theme: Symbol.for('light'),
  locale: DEFAULT_LOCALE
})

export default store
