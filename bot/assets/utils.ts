export var pipe =
  <T, U = T>(...fns: Array<(arg: any) => any>) =>
  (payload?: T): U =>
    fns.reduce<unknown>(
      (arg, fn) => (arg instanceof Promise ? arg.then(fn) : fn(arg)),
      payload
    ) as U;

export var getTimeStamp = (date = new Date()): string =>
  `[${date.toLocaleString('ru')}]`;

export var log = (...parts: unknown[]): void =>
  void console.log(getTimeStamp(), ...parts);

export type Log = typeof log;

export var errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export var splitList = (value?: string): string[] =>
  (value ?? '')
    .split(',')
    .map((_) => _.trim())
    .filter(Boolean);

var _slices = (text: string, max: number): string[] =>
  Array.from({ length: Math.ceil(text.length / max) }, (_, index) =>
    text.slice(index * max, (index + 1) * max)
  );

export var chunkParts = (
  parts: string[],
  joiner: string,
  max: number
): string[] =>
  parts
    .flatMap((part) => _slices(part, max))
    .reduce<string[]>(
      (chunks, part) =>
        ((last) =>
          last !== undefined && last.length + joiner.length + part.length <= max
            ? [...chunks.slice(0, -1), `${last}${joiner}${part}`]
            : [...chunks, part])(chunks.at(-1)),
      []
    );
