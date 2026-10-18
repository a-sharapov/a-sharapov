import { describe, expect, test } from 'bun:test';
import { clientKey, defineRateLimit } from '$lib/services/rate-limit';

describe('rate-limit', () => {
  test('пускает perKey раз за окно, потом отказывает, после окна снова пускает', () => {
    let now = 0;
    const limit = defineRateLimit(
      { window: 1000, perKey: 2, total: 100 },
      () => now
    );
    expect([limit.allow('a'), limit.allow('a'), limit.allow('a')]).toEqual([
      true,
      true,
      false,
    ]);
    expect(limit.allow('b')).toBe(true);
    now = 1500;
    expect(limit.allow('a')).toBe(true);
  });

  test('общий лимит на всех', () => {
    const limit = defineRateLimit(
      { window: 1000, perKey: 10, total: 3 },
      () => 0
    );
    expect(['a', 'b', 'c', 'd'].map((key) => limit.allow(key))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  test('ключ — соль и хэш: стабилен в процессе и не содержит адрес', () => {
    expect(clientKey('203.0.113.7')).toBe(clientKey('203.0.113.7'));
    expect(clientKey('203.0.113.7')).not.toBe(clientKey('203.0.113.8'));
    expect(clientKey('203.0.113.7')).not.toContain('203');
  });
});
