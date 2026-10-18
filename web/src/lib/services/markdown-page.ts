import { DEFAULT_LOCALE } from '#lib/common/constants.ts';
import { pageMarkdown, pageUrl } from '#lib/common/seo.ts';
import content from './content';

export var markdownResponse = (
  slug: string,
  origin: string
): Promise<Response> =>
  Promise.all([
    content.pages.list(DEFAULT_LOCALE),
    content.i18n.dictionary(DEFAULT_LOCALE),
    content.contacts.list(),
  ]).then(({ 0: pages, 1: dictionary, 2: contacts }) =>
    ((page) =>
      page
        ? new Response(pageMarkdown({ origin, dictionary, contacts }, page), {
            headers: {
              'Content-Type': 'text/markdown; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
              Link: `<${pageUrl(origin, page)}>; rel="canonical"`,
            },
          })
        : new Response('Not found', { status: 404 }))(
      pages.find((page) => page.slug === slug)
    )
  );
