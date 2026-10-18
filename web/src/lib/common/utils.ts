export var pipe =
  <T, U = T>(...fns: Array<(arg: any) => any>) =>
  (payload?: T): U =>
    fns.reduce<T | Promise<T> | undefined>(
      (arg: T | Promise<T> | undefined, fn: (...args: any) => any) =>
        arg instanceof Promise ? arg.then(fn) : fn(arg),
      payload
    ) as U;

export var delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export var clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

export var lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export var splitLabel = (label: string): [head: string, tail: string] =>
  ((match) => (match ? [match[1]!, match[2]!] : [label, '']))(
    label.match(/^(.*\)\s*)(.+)$/)
  );

export var localize =
  (dictionary: Record<string, unknown>) =>
  (nestedKey: string): string =>
    pipe<string, string>(
      ($: string) =>
        $.split('.').reduce<unknown>(
          (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
          dictionary
        ),
      ($: unknown) => (typeof $ === 'string' ? $ : nestedKey)
    )(nestedKey);

export var lookup = <T>(
  dictionary: Record<string, unknown>,
  nestedKey: string,
  fallback: T
): T =>
  (nestedKey
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
      dictionary
    ) as T | undefined) ?? fallback;

var _REPLACEABLE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export var escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, ($) => _REPLACEABLE[$] ?? $);

export var isClient = typeof window !== 'undefined';

export var timestamp = (date = new Date()): string =>
  date.toISOString().replace('T', ' ').slice(0, 19);

export var log = {
  info: (...args: unknown[]) => console.info(`[${timestamp()}]`, ...args),
  warning: (...args: unknown[]) => console.warn(`[${timestamp()}]`, ...args),
  error: (...args: unknown[]) => console.error(`[${timestamp()}]`, ...args),
};
