import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const _BUILT_IN = ['DEV', 'PROD', 'SSR', 'MODE', 'BASE_URL', 'SITE'];

const _files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.name === '__tests__'
      ? []
      : entry.isDirectory()
        ? _files(join(dir, entry.name))
        : /\.(ts|js|svelte|astro)$/.test(entry.name)
          ? [join(dir, entry.name)]
          : []
  );

describe('env', () => {
  test('серверные переменные читаются в рантайме, а не вписываются в сборку', () => {
    const inlined = _files(join(import.meta.dir, '../..')).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/import\.meta\.env\.([A-Z_]+)/g)]
        .map(({ 1: name }) => name ?? '')
        .filter(
          (name) => !_BUILT_IN.includes(name) && !name.startsWith('PUBLIC_')
        )
        .map((name) => `${file}: ${name}`)
    );
    expect(inlined).toEqual([]);
  });

  test('без переменных окружения — адреса контейнеров по умолчанию', async () => {
    const { SERVER_ENV } = await import('$lib/services/env');
    expect(SERVER_ENV.pocketBase).toBe(process.env.PB_URL || 'http://cms:5703');
    expect(SERVER_ENV.bot).toBe(process.env.BOT_URL || 'http://bot:5702');
  });
});
