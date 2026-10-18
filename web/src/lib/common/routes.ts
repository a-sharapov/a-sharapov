import { DEFAULT_LOCALE, INDEX_SLUG, LOCALES } from './constants';
import type { Locale, PageTemplate, Shot } from './types';

export type Route = { locale: Locale; slug: string };

var _SHOTS: Record<PageTemplate | '_', Shot> = {
  card: 'intro',
  contacts: 'portrait',
  article: 'landscape',
  resume: 'resume',
  services: 'sketchbook',
  _: 'intro',
};

export var shotFor = (template: PageTemplate | undefined): Shot =>
  _SHOTS[template ?? '_'] ?? _SHOTS._;

export var isLocale = (value: unknown): value is Locale =>
  LOCALES.includes(value as Locale);

export var parseRoute = (path: string | undefined): Route =>
  ((parts: string[]) =>
    isLocale(parts.at(0))
      ? { locale: parts.at(0) as Locale, slug: parts.at(1) ?? INDEX_SLUG }
      : { locale: DEFAULT_LOCALE, slug: parts.at(0) ?? INDEX_SLUG })(
    (path ?? '').split('/').filter(Boolean)
  );

export var hrefFor = ({ locale, slug }: Route): string =>
  slug === INDEX_SLUG
    ? locale === DEFAULT_LOCALE
      ? '/'
      : `/${locale}`
    : `/${locale}/${slug}`;

export var reroute = (
  path: string
): { redirect: string } | { missing: true } | null =>
  ((parts: string[]) =>
    parts.length > 2 || (parts.length === 2 && !isLocale(parts[0]))
      ? { missing: true }
      : parts.length === 1 && !isLocale(parts[0])
        ? {
            redirect: hrefFor({
              locale: DEFAULT_LOCALE,
              slug: parts[0] ?? INDEX_SLUG,
            }),
          }
        : null)(path.split('/').filter(Boolean));
