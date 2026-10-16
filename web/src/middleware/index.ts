import { sequence } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';
import { RETIRED_LOCALES } from '$lib/common/constants';
import { hrefFor, parseRoute } from '$lib/common/routes';
import content from '$lib/services/content';
import { isPage } from './assets';

const attachContent: MiddlewareHandler = (context, next): Promise<Response> =>
  isPage(context.url.pathname)
    ? ((route) =>
        Promise.all([
          content.i18n.dictionary(route.locale),
          content.pages.nav(route.locale),
        ]).then(({ 0: i18n, 1: nav }): Promise<Response> => {
          Object.assign(context.locals, { ...route, i18n, nav });
          return next();
        }))(parseRoute(context.url.pathname))
    : next();

var _retired = (path: string) =>
  ((parts) =>
    RETIRED_LOCALES.includes(parts[0] as (typeof RETIRED_LOCALES)[number])
      ? hrefFor({ locale: 'ru', slug: parts[1] ?? 'index' })
      : null)(path.split('/').filter(Boolean));

const redirectRetired: MiddlewareHandler = (context, next) =>
  ((target) => (target ? context.redirect(target, 301) : next()))(
    isPage(context.url.pathname) ? _retired(context.url.pathname) : null
  );

export var onRequest = sequence(redirectRetired, attachContent);
