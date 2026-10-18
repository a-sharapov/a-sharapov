import { INDEX_SLUG, SEO_PHOTO } from './constants';
import { hrefFor } from './routes';
import type { ContactKind, ContactRecord, PageRecord } from './types';
import { localize, lookup } from './utils';

type Dictionary = Record<string, unknown>;
type Node = Record<string, unknown>;

export type SeoContext = {
  origin: string;
  dictionary: Dictionary;
  contacts: ContactRecord[];
};

var _ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  nbsp: ' ',
};

var _PAGE_TYPES: Record<string, string> = {
  [INDEX_SLUG]: 'ProfilePage',
  cv: 'ProfilePage',
  contacts: 'ContactPage',
};

var _PROFILE = [INDEX_SLUG, 'cv'];

export var decodeHtml = (value: string): string =>
  value.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    (entity, name: string) => _ENTITIES[name] ?? entity
  );

export var plainText = (html: string): string =>
  decodeHtml(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

export var serviceList = (html: string) => [
  ...[
    ...html.matchAll(
      /<section class="service">\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g
    ),
  ].map(({ 1: name, 2: text }) => ({
    name: plainText(name ?? ''),
    description: plainText(text ?? ''),
  })),
  ...[
    ...(html.match(/<ul class="extras">([\s\S]*?)<\/ul>/)?.[1] ?? '').matchAll(
      /<strong>([\s\S]*?)<\/strong>\s*—\s*([\s\S]*?)<\/li>/g
    ),
  ].map(({ 1: name, 2: text }) => ({
    name: plainText(name ?? ''),
    description: plainText(text ?? ''),
  })),
];

export var toMarkdown = (html: string, origin: string): string =>
  decodeHtml(
    html
      .replace(/<span data-(?:art|icon)="[^"]*"[^>]*><\/span>/g, '')
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<\/(a|span)>(?=<(?:a|span)[\s>])/g, '</$1> · ')
      .replace(
        /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/g,
        (_, level: string, text: string) =>
          `\n\n${'#'.repeat(Number(level))} ${plainText(text)}\n\n`
      )
      .replace(
        /<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
        (_, href: string, text: string) =>
          `[${plainText(text)}](${href.startsWith('/') ? `${origin}${href}` : href})`
      )
      .replace(/<\/strong>(?=[^\s—.,:;)<])/g, '</strong> — ')
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
      .replace(
        /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g,
        '\n- **$1**: $2'
      )
      .replace(/<li[^>]*>/g, '\n- ')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/(?:p|div|section|header|ul|ol|dl|li)>/g, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(- .*)\n\n(?=- )/gm, '$1\n')
    .trim();

export var personId = (origin: string) => `${origin}/#person`;

export var markdownUrl = (
  origin: string,
  page: Pick<PageRecord, 'locale' | 'slug'>
) =>
  page.slug === INDEX_SLUG
    ? `${origin}/index.md`
    : `${pageUrl(origin, page)}.md`;

export var websiteId = (origin: string) => `${origin}/#website`;

export var pageUrl = (
  origin: string,
  page: Pick<PageRecord, 'locale' | 'slug'>
) => `${origin}${hrefFor({ locale: page.locale, slug: page.slug })}`;

var _hrefs = (contacts: ContactRecord[], kinds: ContactKind[]) =>
  contacts
    .filter(({ kind, href }) => kinds.includes(kind) && href)
    .map(({ href }) => href);

var _isoDate = (value: string) => value.replace(' ', 'T');

var _list = (dictionary: Dictionary, key: string): string[] =>
  ((value) => (Array.isArray(value) ? value.map(String) : []))(
    lookup<unknown>(dictionary, key, [])
  );

export var siteGraph = ({ origin, dictionary, contacts }: SeoContext): Node[] =>
  ((t) => [
    {
      '@type': 'WebSite',
      '@id': websiteId(origin),
      url: `${origin}/`,
      name: t('profile.name'),
      description: t('meta.description'),
      inLanguage: 'ru',
      publisher: { '@id': personId(origin) },
    },
    {
      '@type': 'Person',
      '@id': personId(origin),
      name: t('profile.name'),
      alternateName: t('seo.alternateName'),
      givenName: t('seo.givenName'),
      familyName: t('seo.familyName'),
      jobTitle: t('profile.role'),
      description: t('meta.description'),
      url: `${origin}/`,
      image: `${origin}${SEO_PHOTO}`,
      email: _hrefs(contacts, ['email']).map((href) =>
        href.replace('mailto:', '')
      )[0],
      telephone: _hrefs(contacts, ['phone']).map((href) =>
        href.replace('tel:', '')
      ),
      sameAs: _hrefs(contacts, ['linkedin', 'github', 'telegram']),
      knowsAbout: _list(dictionary, 'seo.knowsAbout'),
    },
  ])(localize(dictionary));

var _catalog = (origin: string, page: PageRecord): Node => ({
  '@type': 'OfferCatalog',
  name: plainText(
    page.content.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? page.title
  ),
  itemListElement: serviceList(page.content).map(({ name, description }) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name,
      description,
      provider: { '@id': personId(origin) },
    },
  })),
});

export var pageGraph = (
  { origin, dictionary }: Omit<SeoContext, 'contacts'>,
  page: PageRecord
): Node[] =>
  ((t, url, inner) => [
    {
      '@type': _PAGE_TYPES[page.slug] ?? 'WebPage',
      '@id': `${url}#page`,
      url,
      name: page.longtitle || page.title,
      description: page.description || t('meta.description'),
      inLanguage: 'ru',
      isPartOf: { '@id': websiteId(origin) },
      about: { '@id': personId(origin) },
      ...(page.updated ? { dateModified: _isoDate(page.updated) } : {}),
      ...(_PROFILE.includes(page.slug)
        ? { mainEntity: { '@id': personId(origin) } }
        : {}),
      ...(page.template === 'services'
        ? { mainEntity: _catalog(origin, page) }
        : {}),
      ...(inner ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
    ...(inner
      ? [
          {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: t('profile.name'),
                item: `${origin}/`,
              },
              { '@type': 'ListItem', position: 2, name: page.title, item: url },
            ],
          },
        ]
      : []),
  ])(localize(dictionary), pageUrl(origin, page), page.slug !== INDEX_SLUG);

export var sitemapXml = (origin: string, pages: PageRecord[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map(
      (page) =>
        `<url><loc>${pageUrl(origin, page)}</loc>${page.updated ? `<lastmod>${_isoDate(page.updated).slice(0, 10)}</lastmod>` : ''}</url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

var _contactLines = (dictionary: Dictionary, contacts: ContactRecord[]) =>
  ((t) =>
    contacts.map(
      ({ kind, label, href }) =>
        `- ${t(`seo.kinds.${kind}`)}: ${href ? `[${label}](${href})` : label}`
    ))(localize(dictionary));

var _ordered = (pages: PageRecord[]) => [
  ...pages.filter(({ slug }) => slug === INDEX_SLUG),
  ...pages.filter(({ slug }) => slug !== INDEX_SLUG),
];

export var llmsIndex = (
  { origin, dictionary, contacts }: SeoContext,
  pages: PageRecord[]
): string =>
  ((t, home, rest) =>
    [
      `# ${t('profile.name')}`,
      '',
      `> ${t('meta.description')}`,
      '',
      ...(home ? [toMarkdown(home.content, origin), ''] : []),
      `## ${t('seo.llms.pages')}`,
      '',
      ...rest
        .filter(({ nav }) => nav)
        .map(
          (page) =>
            `- [${page.longtitle || page.title}](${markdownUrl(origin, page)}): ${page.description}`
        ),
      '',
      `## ${t('seo.llms.contacts')}`,
      '',
      ..._contactLines(dictionary, contacts),
      '',
      '## Optional',
      '',
      ...rest
        .filter(({ nav }) => !nav)
        .map(
          (page) =>
            `- [${page.longtitle || page.title}](${markdownUrl(origin, page)}): ${page.description}`
        ),
      `- [${t('seo.llms.full')}](${origin}/llms-full.txt)`,
      '',
    ].join('\n'))(
    localize(dictionary),
    pages.find(({ slug }) => slug === INDEX_SLUG),
    pages.filter(({ slug }) => slug !== INDEX_SLUG)
  );

export var pageMarkdown = (
  { origin, dictionary, contacts }: SeoContext,
  page: PageRecord
): string =>
  ((t) =>
    [
      `# ${page.longtitle || page.title}`,
      '',
      `URL: ${pageUrl(origin, page)}`,
      '',
      page.description,
      '',
      toMarkdown(page.content, origin),
      ...(page.template === 'contacts'
        ? [
            '',
            `## ${t('seo.llms.contacts')}`,
            '',
            ..._contactLines(dictionary, contacts),
          ]
        : []),
    ].join('\n'))(localize(dictionary));

export var llmsFull = (context: SeoContext, pages: PageRecord[]): string =>
  `${_ordered(pages)
    .map((page) => pageMarkdown(context, page))
    .join('\n\n---\n\n')}\n`;
