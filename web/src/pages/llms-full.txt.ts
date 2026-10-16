import type { APIRoute } from 'astro';
import { DEFAULT_LOCALE } from '$lib/common/constants';
import { llmsFull } from '$lib/common/seo';
import content from '$lib/services/content';

export var GET: APIRoute = ({ site, url }) =>
  Promise.all([
    content.pages.list(DEFAULT_LOCALE),
    content.i18n.dictionary(DEFAULT_LOCALE),
    content.contacts.list(),
  ]).then(
    ({ 0: pages, 1: dictionary, 2: contacts }) =>
      new Response(
        llmsFull({ origin: (site ?? url).origin, dictionary, contacts }, pages),
        {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      )
  );
