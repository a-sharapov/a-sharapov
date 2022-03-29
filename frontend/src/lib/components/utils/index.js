export const compose = (...fns) => fns.reduceRight((prevFn, nextFn) => (...args) => nextFn(prevFn(...args)), value => value)

export const memoize = (fn) => {
  let cache = {}
  return (...args) => {
    let n = args[0]
    if (n in cache) {
      return cache[n]
    }
    else {
      let result = fn(n)
      cache[n] = result
      return result
    }
  }
}

export const debounce = (fn, wait, immediate) => {
  let timeout
  return function executedFunction() {
    const context = this
    const args = arguments
    const later = function() {
      timeout = null
      if (!immediate) fn.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) fn.apply(context, args)
  }
}

export const throttle = (fn, wait, options) => {
  var context, args, result
  var timeout = null
  var previous = 0
  if (!options) options = {}
  var later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = fn.apply(context, args)
    if (!timeout) context = args = null
  }
  return function() {
    var now = Date.now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = fn.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

export const parseUserAgent = (agent) => {
  let parts = agent.split(/\s*[;)(]\s*/)
  return ({
    OS: parts[1],
    browser: parts[parts.length - 1].split(" ")[0].replace("/", " ")
  })
}