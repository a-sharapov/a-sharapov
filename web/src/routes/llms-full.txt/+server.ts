import { DEFAULT_LOCALE, SITE_ORIGIN } from '#lib/common/constants.ts';
import { llmsFull } from '#lib/common/seo.ts';
import content from '#lib/services/content.ts';
import type { RequestHandler } from './$types';

export var GET: RequestHandler = () =>
  Promise.all([
    content.pages.list(DEFAULT_LOCALE),
    content.i18n.dictionary(DEFAULT_LOCALE),
    content.contacts.list(),
  ]).then(
    ({ 0: pages, 1: dictionary, 2: contacts }) =>
      new Response(
        llmsFull({ origin: SITE_ORIGIN, dictionary, contacts }, pages),
        {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      )
  );
