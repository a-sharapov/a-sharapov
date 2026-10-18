import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type Entry = { value: unknown; expires: number };

export type CacheStore = {
  read: (key: string) => Promise<unknown>;
  write: (key: string, value: unknown) => Promise<void>;
};

export type CacheStrategy = 'file' | 'memory';

export interface CacheSettings {
  ttl: number;
  store?: CacheStore | null;
  now?: () => number;
  onError?: (key: string, error: unknown) => void;
}

var _absent = (error: unknown) =>
  (error as { code?: string }).code === 'ENOENT'
    ? undefined
    : Promise.reject(error);

export var defineFileStore = (dir: string): CacheStore => {
  const _path = (key: string) => join(dir, `${encodeURIComponent(key)}.json`);

  return {
    read: (key) =>
      readFile(_path(key), 'utf8').then(
        (text) => (JSON.parse(text) as { value?: unknown }).value,
        _absent
      ),
    write: (key, value) =>
      ((file: string, temp: string) =>
        mkdir(dir, { recursive: true })
          .then(() =>
            writeFile(
              temp,
              JSON.stringify({ key, saved: new Date().toISOString(), value })
            )
          )
          .then(() => rename(temp, file))
          .then(undefined, (error: unknown) =>
            rm(temp, { force: true }).then(() => Promise.reject(error))
          ))(_path(key), `${_path(key)}.${randomUUID()}.tmp`),
  };
};

var _STORES: Record<CacheStrategy, (dir: string) => CacheStore | null> = {
  file: defineFileStore,
  memory: () => null,
};

export var storeFor = (strategy: string, dir: string): CacheStore | null =>
  (_STORES[strategy as CacheStrategy] ?? _STORES.file)(dir);

export var defineCache = ({
  ttl,
  store = null,
  now = Date.now,
  onError = () => undefined,
}: CacheSettings) => {
  const entries = new Map<string, Entry>();
  const loading = new Map<string, Promise<unknown>>();
  const hydrating = new Map<string, Promise<unknown>>();
  const hydrated = new Set<string>();

  const _store = <T>(key: string, value: T): T => (
    value !== null &&
      value !== undefined &&
      (entries.set(key, { value, expires: now() + ttl }),
      void store
        ?.write(key, value)
        .then(undefined, (error: unknown) => onError(key, error))),
    value
  );

  const _load = <T>(key: string, load: () => Promise<T>): Promise<T> =>
    (loading.get(key) as Promise<T> | undefined) ??
    ((pending: Promise<T>) => (loading.set(key, pending), pending))(
      Promise.resolve()
        .then(load)
        .then(($) => _store(key, $))
        .finally(() => loading.delete(key))
    );

  const _refresh = (key: string, entry: Entry, load: () => Promise<unknown>) =>
    void _load(key, load).then(
      undefined,
      (error: unknown) => (
        entries.set(key, { value: entry.value, expires: now() + ttl }),
        onError(key, error)
      )
    );

  const _serve = <T>(
    key: string,
    entry: Entry,
    load: () => Promise<T>
  ): Promise<T> => (
    void (
      entry.expires > now() ||
      loading.has(key) ||
      _refresh(key, entry, load)
    ),
    Promise.resolve(entry.value as T)
  );

  const _hydrate = (key: string, from: CacheStore): Promise<unknown> =>
    hydrating.get(key) ??
    ((pending: Promise<unknown>) => (hydrating.set(key, pending), pending))(
      from
        .read(key)
        .then(
          (value) =>
            void (
              value === null ||
              value === undefined ||
              entries.set(key, { value, expires: 0 })
            ),
          (error: unknown) => onError(key, error)
        )
        .finally(() => (hydrated.add(key), hydrating.delete(key)))
    );

  const remember = <T>(key: string, load: () => Promise<T>): Promise<T> =>
    ((entry) =>
      entry
        ? _serve(key, entry, load)
        : store && !hydrated.has(key)
          ? _hydrate(key, store).then(() => remember(key, load))
          : _load(key, load))(entries.get(key));

  return { remember };
};
