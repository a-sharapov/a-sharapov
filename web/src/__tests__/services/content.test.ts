import { describe, expect, test } from 'bun:test';
import type PocketBase from 'pocketbase';
import { defineCache } from '#lib/common/cache.ts';
import type { PageRecord } from '#lib/common/types.ts';
import { defineContentService } from '#lib/services/content.ts';

const _page = (slug: string, nav: boolean) =>
  ({ slug, nav, locale: 'ru', title: slug, template: 'article' }) as PageRecord;

const _PAGES = [
  _page('index', true),
  _page('cv', true),
  _page('privacy', false),
];

const _pb = (getFullList: () => Promise<unknown>) =>
  ({
    filter: (expression: string) => expression,
    collection: () => ({ getFullList }),
  }) as unknown as PocketBase;

describe('content', () => {
  test('страницы, меню и поиск — из одного запроса списка опубликованных', async () => {
    let calls = 0;
    const content = defineContentService(
      _pb(() => (calls++, Promise.resolve(_PAGES))),
      defineCache({ ttl: 1000 })
    );
    expect((await content.pages.find('ru', 'cv'))?.slug).toBe('cv');
    expect(await content.pages.find('ru', 'wp-admin')).toBeNull();
    expect((await content.pages.nav('ru')).map(({ slug }) => slug)).toEqual([
      'index',
      'cv',
    ]);
    expect(calls).toBe(1);
  });

  test('пустой список опубликованных — недоступность, не кешируется', async () => {
    let pages: PageRecord[] = [];
    const content = defineContentService(
      _pb(() => Promise.resolve(pages)),
      defineCache({ ttl: 1000 })
    );
    expect(
      await content.pages.find('ru', 'cv').then(
        () => 'resolved',
        () => 'rejected'
      )
    ).toBe('rejected');
    pages = _PAGES;
    expect((await content.pages.find('ru', 'cv'))?.slug).toBe('cv');
  });

  test('сбой CMS при пустом кэше — отказ, а не «страницы нет»', async () => {
    const content = defineContentService(
      _pb(() =>
        Promise.reject(Object.assign(new Error('down'), { status: 0 }))
      ),
      defineCache({ ttl: 1000 })
    );
    expect(
      await content.pages.find('ru', 'cv').then(
        () => 'resolved',
        () => 'rejected'
      )
    ).toBe('rejected');
    expect(await content.pages.nav('ru')).toEqual([]);
  });
});
