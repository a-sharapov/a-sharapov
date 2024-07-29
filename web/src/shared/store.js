import { DEFAULT_LOCALE } from '@lib/l18n'
import { writable } from 'svelte/store'

var store = writable({
  sceneIsReady: false,
  sceneIs3D: true,
  theme: Symbol.for('light'),
  locale: DEFAULT_LOCALE
})

export default store
