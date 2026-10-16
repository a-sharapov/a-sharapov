import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type CacheStore,
  defineCache,
  defineFileStore,
  storeFor,
} from '$lib/common/cache';

const _dir = mkdtempSync(join(tmpdir(), 'as-cache-'));

afterAll(() => rmSync(_dir, { recursive: true, force: true }));

const _store = (initial: Record<string, unknown> = {}) => {
  const data = new Map(Object.entries(initial));
  const log = { reads: 0, writes: 0 };
  const store: CacheStore = {
    read: (key) => (log.reads++, Promise.resolve(data.get(key))),
    write: (key, value) => (
      log.writes++, data.set(key, value), Promise.resolve()
    ),
  };
  return { data, log, store };
};

describe('cache', () => {
  test('держит значение ttl, после — отдаёт старое сразу и обновляет в фоне', async () => {
    let now = 0;
    let calls = 0;
    const cache = defineCache({ ttl: 1000, now: () => now });
    const load = () => Promise.resolve(++calls);
    expect(await cache.remember('k', load)).toBe(1);
    expect(await cache.remember('k', load)).toBe(1);
    now = 1500;
    expect(await cache.remember('k', load)).toBe(1);
    await Bun.sleep(0);
    expect(await cache.remember('k', load)).toBe(2);
    expect(calls).toBe(2);
  });

  test('холодный отказ не кешируется', async () => {
    const cache = defineCache({ ttl: 1000 });
    expect(
      await cache
        .remember<string>('bad', () => Promise.reject(new Error('down')))
        .then(
          () => 'resolved',
          (error: Error) => error.message
        )
    ).toBe('down');
    expect(await cache.remember('bad', () => Promise.resolve('ok'))).toBe('ok');
  });

  test('одновременные загрузки одного ключа — один запрос', async () => {
    let calls = 0;
    const cache = defineCache({ ttl: 1000 });
    const load = () => Bun.sleep(5).then(() => ++calls);
    expect(
      await Promise.all([cache.remember('k', load), cache.remember('k', load)])
    ).toEqual([1, 1]);
    expect(calls).toBe(1);
  });

  test('сбой обновления — старое значение, повтор не раньше ttl', async () => {
    let now = 0;
    let calls = 0;
    const errors: string[] = [];
    const cache = defineCache({
      ttl: 1000,
      now: () => now,
      onError: (key) => errors.push(key),
    });
    await cache.remember('page', () => Promise.resolve('v1'));
    const down = () => (calls++, Promise.reject(new Error('down')));
    now = 1500;
    expect(
      await Promise.all([
        cache.remember<string>('page', down),
        cache.remember<string>('page', down),
      ])
    ).toEqual(['v1', 'v1']);
    await Bun.sleep(0);
    expect(await cache.remember<string>('page', down)).toBe('v1');
    expect(await cache.remember<string>('page', down)).toBe('v1');
    expect({ calls, errors }).toEqual({ calls: 1, errors: ['page'] });
    now = 2600;
    await cache.remember<string>('page', down);
    await Bun.sleep(0);
    expect(calls).toBe(2);
  });

  test('после перезапуска — значение из хранилища сразу, свежее — в фоне', async () => {
    const { data, log, store } = _store({ 'pages:ru': 'saved' });
    let calls = 0;
    const cache = defineCache({ ttl: 1000, store });
    const load = () => Bun.sleep(5).then(() => `fresh${++calls}`);
    expect(
      await Promise.all([
        cache.remember('pages:ru', load),
        cache.remember('pages:ru', load),
      ])
    ).toEqual(['saved', 'saved']);
    await Bun.sleep(10);
    expect(await cache.remember('pages:ru', load)).toBe('fresh1');
    expect({ calls, ...log, saved: data.get('pages:ru') }).toEqual({
      calls: 1,
      reads: 1,
      writes: 1,
      saved: 'fresh1',
    });
  });

  test('CMS недоступна после перезапуска — сайт живёт на сохранённом', async () => {
    const { store } = _store({ contacts: ['tg'] });
    const errors: string[] = [];
    const cache = defineCache({
      ttl: 1000,
      store,
      onError: (key) => errors.push(key),
    });
    const down = () => Promise.reject(new Error('down'));
    expect(await cache.remember<string[]>('contacts', down)).toEqual(['tg']);
    await Bun.sleep(0);
    expect(await cache.remember<string[]>('contacts', down)).toEqual(['tg']);
    expect(errors).toEqual(['contacts']);
  });

  test('в хранилище пусто — загрузка и запись; хранилище читается один раз', async () => {
    const { data, log, store } = _store();
    const cache = defineCache({ ttl: 1000, store });
    expect(
      await cache
        .remember<string>('i18n:ru', () => Promise.reject(new Error('down')))
        .then(undefined, (error: Error) => error.message)
    ).toBe('down');
    expect(await cache.remember('i18n:ru', () => Promise.resolve('dict'))).toBe(
      'dict'
    );
    expect({ ...log, saved: data.get('i18n:ru') }).toEqual({
      reads: 1,
      writes: 1,
      saved: 'dict',
    });
  });

  test('сбой чтения или записи хранилища — в журнал, значение из загрузки', async () => {
    const errors: string[] = [];
    const cache = defineCache({
      ttl: 1000,
      store: {
        read: () => Promise.reject(new Error('EACCES')),
        write: () => Promise.reject(new Error('EROFS')),
      },
      onError: (key, error) => errors.push(`${key} ${String(error)}`),
    });
    expect(await cache.remember('k', () => Promise.resolve('v'))).toBe('v');
    await Bun.sleep(0);
    expect(await cache.remember('k', () => Promise.resolve('other'))).toBe('v');
    expect(errors).toEqual(['k Error: EACCES', 'k Error: EROFS']);
  });

  test('файловое хранилище: запись и чтение, нет файла — пусто, битый — отказ', async () => {
    const dir = join(_dir, 'store');
    const store = defineFileStore(dir);
    expect(await store.read('pages:ru')).toBeUndefined();
    await store.write('pages:ru', [{ slug: 'cv' }]);
    await store.write('pages:ru', [{ slug: 'index' }]);
    expect(await store.read('pages:ru')).toEqual([{ slug: 'index' }]);
    expect(readdirSync(dir)).toEqual(['pages%3Aru.json']);
    writeFileSync(join(dir, 'contacts.json'), '{"value": [');
    expect(
      await store.read('contacts').then(
        () => 'resolved',
        () => 'rejected'
      )
    ).toBe('rejected');
  });

  test('стратегия: file по умолчанию, memory — без хранилища', () => {
    expect(storeFor('memory', _dir)).toBeNull();
    expect(storeFor('file', _dir)).toHaveProperty('read');
    expect(storeFor('', _dir)).toHaveProperty('write');
  });
});
