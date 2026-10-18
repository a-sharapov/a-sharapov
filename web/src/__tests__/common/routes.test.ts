import { describe, expect, test } from 'bun:test';
import { hrefFor, parseRoute, reroute, shotFor } from '#lib/common/routes.ts';

describe('routes', () => {
  test.each([
    ['', { locale: 'ru', slug: 'index' }],
    ['/', { locale: 'ru', slug: 'index' }],
    ['/ru/contacts', { locale: 'ru', slug: 'contacts' }],
    ['/contacts', { locale: 'ru', slug: 'contacts' }],
  ])('parseRoute(%p)', (path, route) => {
    expect(parseRoute(path)).toEqual(route as never);
  });

  test('hrefFor: главная дефолтной локали без префикса', () => {
    expect(hrefFor({ locale: 'ru', slug: 'index' })).toBe('/');
    expect(hrefFor({ locale: 'ru', slug: 'cv' })).toBe('/ru/cv');
  });

  test.each([
    ['/', null],
    ['/ru/cv', null],
    ['/ru/cv/', null],
    ['/ru', null],
    ['/cv', { redirect: '/ru/cv' }],
    ['/ru/cv/foo', { missing: true }],
    ['/contacts/x/y', { missing: true }],
    ['/cv/x', { missing: true }],
  ])('reroute(%p)', (path, expected) => {
    expect(reroute(path)).toEqual(expected as never);
  });

  test('shotFor: шаблон → план камеры, неизвестный → общий', () => {
    expect(shotFor('card')).toBe('intro');
    expect(shotFor('contacts')).toBe('portrait');
    expect(shotFor('article')).toBe('landscape');
    expect(shotFor(undefined)).toBe('intro');
  });
});
