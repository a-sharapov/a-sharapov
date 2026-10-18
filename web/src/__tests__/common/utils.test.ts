import { describe, expect, test } from 'bun:test';
import { escapeHtml, localize, lookup, pipe } from '$lib/common/utils';

describe('utils', () => {
  test('pipe: sync и async шаги, falsy значения проходят', async () => {
    expect(
      pipe<number>(
        (_: number) => _ + 1,
        (_: number) => _ * 2
      )(0)
    ).toBe(2);
    expect(
      await pipe<number, Promise<number>>(
        (_: number) => Promise.resolve(_ + 1),
        (_: number) => _ * 3
      )(1)
    ).toBe(6);
  });

  test('localize: вложенный ключ, отсутствующий — ключ как есть', () => {
    const t = localize({ a: { b: 'text' }, list: ['x'] });
    expect(t('a.b')).toBe('text');
    expect(t('a.c')).toBe('a.c');
    expect(t('list')).toBe('list');
    expect(lookup<string[]>({ list: ['x'] }, 'list', [])).toEqual(['x']);
  });

  test('escapeHtml', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    );
  });
});
