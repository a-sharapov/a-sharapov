import { writable } from 'svelte/store'

var INTRO = Symbol.for('intro')
var PORTRAIT = Symbol.for('portrait')
var LANDSCAPE = Symbol.for('landscape')

export var currentState = writable(INTRO)
export { INTRO, LANDSCAPE, PORTRAIT }
