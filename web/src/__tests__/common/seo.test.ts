import { describe, expect, test } from 'bun:test';
import {
  llmsIndex,
  markdownUrl,
  pageGraph,
  pageMarkdown,
  personId,
  serviceList,
  siteGraph,
  sitemapXml,
  toMarkdown,
} from '#lib/common/seo.ts';
import type { ContactRecord, PageRecord } from '#lib/common/types.ts';

const _ORIGIN = 'https://a-sharapov.com';

const _DICTIONARY = {
  meta: { description: 'Разработчик полного цикла.' },
  profile: { name: 'Александр Шарапов', role: 'Веб-разработчик полного цикла' },
  seo: {
    alternateName: 'Alexander Sharapov',
    knowsAbout: ['3D', 'ИИ'],
    llms: {
      pages: 'Страницы',
      contacts: 'Контакты',
      full: 'Полный текст сайта',
    },
    kinds: { email: 'Почта', github: 'GitHub' },
  },
};

const _CONTACTS = [
  {
    kind: 'email',
    label: 'mail@a-sharapov.com',
    href: 'mailto:mail@a-sharapov.com',
    group: 1,
  },
  {
    kind: 'github',
    label: 'GitHub',
    href: 'https://github.com/a-sharapov',
    group: 2,
  },
] as ContactRecord[];

const _page = (fields: Partial<PageRecord>): PageRecord =>
  ({
    id: 'x',
    locale: 'ru',
    slug: 'index',
    title: 'Визитка',
    longtitle: '',
    description: 'Описание',
    keywords: '',
    template: 'card',
    content: '',
    sort: 0,
    nav: true,
    published: true,
    created: '2026-10-01 10:00:00.000Z',
    updated: '2026-10-17 12:30:00.000Z',
    ...fields,
  }) as PageRecord;

const _SERVICES = `<div class="page">
<h1>3D и <em>ИИ</em> для бизнеса</h1>
<section class="service">
<h2>Имиджевые 3D сайты</h2>
<p>Покупатель рассмотрит товар сам.</p>
<ol class="flow"><li><span data-art="photo"></span>Фото и чертежи</li></ol>
</section>
<ol class="steps"><li><strong>Заявка</strong>Форма на сайте</li></ol>
<ul class="extras">
<li><span data-art="extra-app"></span><strong>Веб-приложения</strong> — кабинеты и CRM</li>
</ul>
</div>`;

describe('seo', () => {
  test('toMarkdown: заголовки, пункты, подписи шагов и абсолютные ссылки', () => {
    const markdown = toMarkdown(
      `${_SERVICES}<p><a href="/ru/cv">Резюме</a><a href="https://t.me/x">TG</a></p>`,
      _ORIGIN
    );
    expect(markdown).toContain('# 3D и ИИ для бизнеса');
    expect(markdown).toContain('## Имиджевые 3D сайты');
    expect(markdown).toContain('- Фото и чертежи');
    expect(markdown).toContain('- **Заявка** — Форма на сайте');
    expect(markdown).toContain('- **Веб-приложения** — кабинеты и CRM');
    expect(markdown).toContain(
      `[Резюме](${_ORIGIN}/ru/cv) · [TG](https://t.me/x)`
    );
    expect(markdown).not.toMatch(/<|data-art/);
    expect(toMarkdown('<ul>\n<li>Раз</li>\n<li>Два</li>\n</ul>', _ORIGIN)).toBe(
      '- Раз\n- Два'
    );
  });

  test('serviceList: услуги из разделов и «также делаю»', () => {
    expect(serviceList(_SERVICES)).toEqual([
      {
        name: 'Имиджевые 3D сайты',
        description: 'Покупатель рассмотрит товар сам.',
      },
      { name: 'Веб-приложения', description: 'кабинеты и CRM' },
    ]);
  });

  test('siteGraph: сайт и человек со ссылками на профили', () => {
    const { 1: person } = siteGraph({
      origin: _ORIGIN,
      dictionary: _DICTIONARY,
      contacts: _CONTACTS,
    });
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': personId(_ORIGIN),
      email: 'mail@a-sharapov.com',
      sameAs: ['https://github.com/a-sharapov'],
      knowsAbout: ['3D', 'ИИ'],
    });
  });

  test('pageGraph: главная — профиль без крошек, услуги — каталог и крошки', () => {
    const { 0: home } = pageGraph(
      { origin: _ORIGIN, dictionary: _DICTIONARY },
      _page({})
    );
    expect(home).toMatchObject({
      '@type': 'ProfilePage',
      url: `${_ORIGIN}/`,
      dateModified: '2026-10-17T12:30:00.000Z',
    });
    expect(home).not.toHaveProperty('breadcrumb');
    const graph = pageGraph(
      { origin: _ORIGIN, dictionary: _DICTIONARY },
      _page({
        slug: 'services',
        title: 'Услуги',
        template: 'services',
        content: _SERVICES,
      })
    );
    expect(graph).toHaveLength(2);
    expect(graph[0]).toMatchObject({
      '@type': 'WebPage',
      mainEntity: { '@type': 'OfferCatalog', name: '3D и ИИ для бизнеса' },
    });
    expect(
      (graph[0]!.mainEntity as { itemListElement: unknown[] }).itemListElement
    ).toHaveLength(2);
    expect(graph[1]).toMatchObject({ '@type': 'BreadcrumbList' });
  });

  test('markdownUrl: главная — /index.md, остальные — адрес страницы с .md', () => {
    expect(markdownUrl(_ORIGIN, _page({}))).toBe(`${_ORIGIN}/index.md`);
    expect(markdownUrl(_ORIGIN, _page({ slug: 'cv' }))).toBe(
      `${_ORIGIN}/ru/cv.md`
    );
  });

  test('pageMarkdown: заголовок, канонический адрес, описание и текст; у контактов — каналы', () => {
    const text = pageMarkdown(
      { origin: _ORIGIN, dictionary: _DICTIONARY, contacts: _CONTACTS },
      _page({
        slug: 'contacts',
        title: 'Контакты',
        template: 'contacts',
        content: '<p>Напишите.</p>',
      })
    );
    expect(text).toBe(
      `# Контакты\n\nURL: ${_ORIGIN}/ru/contacts\n\nОписание\n\nНапишите.\n\n## Контакты\n\n- Почта: [mail@a-sharapov.com](mailto:mail@a-sharapov.com)\n- GitHub: [GitHub](https://github.com/a-sharapov)`
    );
  });

  test('sitemapXml: адреса страниц и даты изменения', () => {
    const xml = sitemapXml(_ORIGIN, [_page({}), _page({ slug: 'cv' })]);
    expect(xml).toContain(
      `<loc>${_ORIGIN}/</loc><lastmod>2026-10-17</lastmod>`
    );
    expect(xml).toContain(`<loc>${_ORIGIN}/ru/cv</loc>`);
  });

  test('llmsIndex: описание, страницы меню, контакты и необязательные страницы', () => {
    const text = llmsIndex(
      { origin: _ORIGIN, dictionary: _DICTIONARY, contacts: _CONTACTS },
      [
        _page({ content: '<p>Я — разработчик.</p>' }),
        _page({
          slug: 'cv',
          title: 'CV',
          longtitle: 'Резюме',
          description: 'Опыт',
        }),
        _page({
          slug: 'privacy',
          title: 'Политика',
          nav: false,
          description: 'GDPR',
        }),
      ]
    );
    expect(
      text.startsWith('# Александр Шарапов\n\n> Разработчик полного цикла.')
    ).toBe(true);
    expect(text).toContain('Я — разработчик.');
    expect(text).toContain(`- [Резюме](${_ORIGIN}/ru/cv.md): Опыт`);
    expect(text).toContain(
      '- Почта: [mail@a-sharapov.com](mailto:mail@a-sharapov.com)'
    );
    expect(text).toContain(
      `## Optional\n\n- [Политика](${_ORIGIN}/ru/privacy.md): GDPR`
    );
    expect(text).toContain(`${_ORIGIN}/llms-full.txt`);
  });
});
