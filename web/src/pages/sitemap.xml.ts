import type { APIRoute } from 'astro';
import { DEFAULT_LOCALE } from '$lib/common/constants';
import { sitemapXml } from '$lib/common/seo';
import content from '$lib/services/content';

export var GET: APIRoute = ({ site, url }) =>
  content.pages.list(DEFAULT_LOCALE).then(
    (pages) =>
      new Response(sitemapXml((site ?? url).origin, pages), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      })
  );
