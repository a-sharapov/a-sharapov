export var pipe =
  (...fns) =>
  (payload) =>
    fns.reduce((arg, fn) => (arg instanceof Promise ? arg.then(fn) : fn(arg)), payload)
