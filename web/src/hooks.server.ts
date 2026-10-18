import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { REDIRECTS, RETIRED_LOCALES } from '#lib/common/constants.ts';
import { isPage } from '#lib/common/paths.ts';
import { hrefFor } from '#lib/common/routes.ts';
import { warmContent } from '#lib/services/content.ts';
import { fillStatic } from '#lib/services/static-html.ts';

var _RETRY_AFTER = '30';

var _retired = (path: string) =>
  ((parts) =>
    RETIRED_LOCALES.includes(parts[0] as (typeof RETIRED_LOCALES)[number])
      ? hrefFor({ locale: 'ru', slug: parts[1] ?? 'index' })
      : null)(path.split('/').filter(Boolean));

var _target = (path: string): string | null =>
  REDIRECTS[path] ?? (isPage(path) ? _retired(path) : null);

var _retryLater = (response: Response): Response => (
  response.status === 503 &&
    !response.headers.has('Retry-After') &&
    response.headers.set('Retry-After', _RETRY_AFTER),
  response
);

export var init: ServerInit = warmContent;

export var handle: Handle = ({ event, resolve }) =>
  ((target) =>
    target
      ? Promise.resolve(
          new Response(null, { status: 301, headers: { Location: target } })
        )
      : (Object.assign(event.locals, { statics: [] }),
        resolve(event, {
          transformPageChunk: ({ html }) =>
            fillStatic(html, event.locals.statics),
        }).then(_retryLater)))(_target(event.url.pathname));
