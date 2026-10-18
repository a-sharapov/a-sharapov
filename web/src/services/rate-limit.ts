import { createHash, randomUUID } from 'node:crypto';

export type RateLimit = { window: number; perKey: number; total: number };

var _SALT = randomUUID();

var _PRUNE_AT = 512;

export var clientKey = (address: string): string =>
  createHash('sha256')
    .update(`${_SALT}:${address}`)
    .digest('base64url')
    .slice(0, 16);

export var defineRateLimit = (
  { window, perKey, total }: RateLimit,
  now: () => number = Date.now
) => {
  const hits = new Map<string, number[]>();
  let everyone: number[] = [];

  const _recent = (list: number[], at: number) =>
    list.filter((time) => at - time < window);

  const _prune = (at: number) =>
    void (
      hits.size > _PRUNE_AT &&
      hits.forEach(
        (list, key) => void (_recent(list, at).length || hits.delete(key))
      )
    );

  return {
    allow: (key: string): boolean =>
      ((at) =>
        ((mine, all) =>
          ((ok) => (
            _prune(at),
            hits.set(key, ok ? [...mine, at] : mine),
            (everyone = ok ? [...all, at] : all),
            ok
          ))(mine.length < perKey && all.length < total))(
          _recent(hits.get(key) ?? [], at),
          _recent(everyone, at)
        ))(now()),
  };
};
