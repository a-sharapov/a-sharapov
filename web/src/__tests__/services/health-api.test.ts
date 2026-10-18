import { afterEach, describe, expect, test } from 'bun:test';
import { GET } from '../../routes/api/health/+server.ts';

const _fetch = globalThis.fetch;

const _get = () => GET({} as Parameters<typeof GET>[0]) as Promise<Response>;

describe('api/health', () => {
  afterEach(() => {
    globalThis.fetch = _fetch;
  });

  test('CMS отвечает — 200 и ok', async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response('{}'))) as unknown as typeof fetch;
    const response = await _get();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, cms: true });
  });

  test('CMS недоступна или отвечает ошибкой — 503', async () => {
    globalThis.fetch = (() =>
      Promise.reject(new Error('down'))) as unknown as typeof fetch;
    expect((await _get()).status).toBe(503);
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response('', { status: 500 })
      )) as unknown as typeof fetch;
    expect((await _get()).status).toBe(503);
  });
});
