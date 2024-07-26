import { writable } from 'svelte/store'

var store = writable({
  sceneReady: false
})

export default store
