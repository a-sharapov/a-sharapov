import { writable } from 'svelte/store'

var store = writable({})

export var currentTheme = writable('DARK')

export default store
