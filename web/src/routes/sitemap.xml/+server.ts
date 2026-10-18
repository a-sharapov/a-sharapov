import { DEFAULT_LOCALE, SITE_ORIGIN } from '#lib/common/constants.ts';
import { sitemapXml } from '#lib/common/seo.ts';
import content from '#lib/services/content.ts';
import type { RequestHandler } from './$types';

export var GET: RequestHandler = () =>
  content.pages.list(DEFAULT_LOCALE).then(
    (pages) =>
      new Response(sitemapXml(SITE_ORIGIN, pages), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
  );
