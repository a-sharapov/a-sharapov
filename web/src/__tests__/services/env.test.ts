import { describe, expect, test } from 'bun:test';

const _BUILT_IN = ['DEV', 'PROD', 'SSR', 'MODE', 'BASE_URL'];

const _SOURCES = new Bun.Glob('**/*.{ts,js,svelte}');

const _files = (dir: string): string[] =>
  [
    ...(_SOURCES.scanSync({ cwd: dir, absolute: true }) as Iterable<string>),
  ].filter((file) => !file.includes('/__tests__/'));

describe('env', () => {
  test('серверные переменные читаются в рантайме, а не вписываются в сборку', async () => {
    const texts = await Promise.all(
      _files(`${import.meta.dir}/../..`).map((file) =>
        Bun.file(file)
          .text()
          .then((text) => ({ file, text }))
      )
    );
    const inlined = texts.flatMap(({ file, text }) =>
      [...text.matchAll(/import\.meta\.env\.([A-Z_]+)/g)]
        .map(({ 1: name }) => name ?? '')
        .filter(
          (name) => !_BUILT_IN.includes(name) && !name.startsWith('VITE_')
        )
        .map((name) => `${file}: ${name}`)
    );
    expect(inlined).toEqual([]);
  });

  test('без переменных окружения — адреса контейнеров по умолчанию', async () => {
    const { SERVER_ENV } = await import('#lib/services/env.ts');
    expect(SERVER_ENV.pocketBase).toBe(Bun.env.PB_URL || 'http://cms:5703');
    expect(SERVER_ENV.bot).toBe(Bun.env.BOT_URL || 'http://bot:5702');
  });
});
