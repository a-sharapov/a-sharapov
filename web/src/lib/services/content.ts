import type { default as Client, default as PocketBase } from 'pocketbase';
import { defineCache, storeFor } from '#lib/common/cache.ts';
import { DEFAULT_LOCALE, INDEX_SLUG } from '#lib/common/constants.ts';
import { hrefFor, shotFor } from '#lib/common/routes.ts';
import type {
  ContactRecord,
  Locale,
  NavItem,
  PageRecord,
} from '#lib/common/types.ts';
import { log } from '#lib/common/utils.ts';
import { SERVER_ENV } from './env';
import pb from './pb';

var _COLLECTIONS = {
  i18n: 'i18n',
  pages: 'Pages',
  contacts: 'Contacts',
} as const;

var _CACHE_TTL = 30e3;

var _CACHE_DIR = '.cache/content';

var _NO_PAGES = 'no published pages';

type Dictionary = Record<string, unknown>;

var _logCache = (key: string, error: unknown) =>
  log.warning(`content.cache ${key}:`, String(error));

export var defineContentService = (
  pocketBase: PocketBase,
  cache = defineCache({
    ttl: _CACHE_TTL,
    store: storeFor(SERVER_ENV.cacheStrategy, _CACHE_DIR),
    onError: _logCache,
  })
) => {
  const _warn =
    <T>(action: string, fallback: T) =>
    (error: unknown): T => (
      log.warning(`content.${action}:`, String(error)), fallback
    );

  const _filter = (expression: string, params: Record<string, unknown>) =>
    pocketBase.filter(expression, params);

  const _toNav = (pages: PageRecord[]): NavItem[] =>
    pages.map(({ slug, locale, title, template }) => ({
      slug,
      title,
      href: hrefFor({ locale, slug }),
      shot: shotFor(template),
    }));

  const _pages = (locale: Locale): Promise<PageRecord[]> =>
    cache.remember(`pages:${locale}`, () =>
      pocketBase
        .collection(_COLLECTIONS.pages)
        .getFullList<PageRecord>({
          filter: _filter('locale = {:locale} && published = true', { locale }),
          sort: 'sort',
          requestKey: null,
        })
        .then(($) => ($.length ? $ : Promise.reject(new Error(_NO_PAGES))))
    );

  return {
    i18n: {
      dictionary: (locale: Locale): Promise<Dictionary> =>
        cache
          .remember(`i18n:${locale}`, () =>
            pocketBase
              .collection(_COLLECTIONS.i18n)
              .getFirstListItem<{ content: Dictionary }>(
                _filter('locale = {:locale}', { locale }),
                { requestKey: null }
              )
              .then(($) => $.content ?? {})
          )
          .then(undefined, _warn('i18n', {})),
    },
    pages: {
      find: (
        locale: Locale,
        slug: string = INDEX_SLUG
      ): Promise<PageRecord | null> =>
        _pages(locale).then(
          (pages) => pages.find((page) => page.slug === slug) ?? null,
          (error: unknown) => (
            log.warning('content.pages.find:', String(error)),
            Promise.reject(error)
          )
        ),
      list: (locale: Locale): Promise<PageRecord[]> =>
        _pages(locale).then(undefined, _warn('pages.list', [])),
      nav: (locale: Locale): Promise<NavItem[]> =>
        _pages(locale).then(
          (pages) => _toNav(pages.filter(({ nav }) => nav)),
          _warn('pages.nav', [])
        ),
    },
    contacts: {
      list: (): Promise<ContactRecord[]> =>
        cache
          .remember('contacts', () =>
            pocketBase
              .collection(_COLLECTIONS.contacts)
              .getFullList<ContactRecord>({
                sort: 'group,sort',
                requestKey: null,
              })
          )
          .then(undefined, _warn('contacts.list', [])),
    },
  };
};

var content = defineContentService(pb as Client);

export var warmContent = (): void =>
  void (
    pb &&
    Promise.all([
      content.pages.list(DEFAULT_LOCALE),
      content.i18n.dictionary(DEFAULT_LOCALE),
      content.contacts.list(),
    ])
  );

export default content;
