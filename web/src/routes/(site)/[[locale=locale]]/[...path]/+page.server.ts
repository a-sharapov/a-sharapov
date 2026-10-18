import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';
import { render } from 'svelte/server';
import {
  CONTACTS_SLUG,
  INQUIRY_SENT_QUERY,
  OG_COVERS,
  SITE_ORIGIN,
} from '#lib/common/constants.ts';
import { hrefFor, parseRoute, reroute, shotFor } from '#lib/common/routes.ts';
import { markdownUrl, pageGraph } from '#lib/common/seo.ts';
import type { PageRecord, PageTemplate } from '#lib/common/types.ts';
import { localize } from '#lib/common/utils.ts';
import { inlineArt } from '#lib/components/@Content/Sheet/art.ts';
import InquiryForm from '#lib/components/@Forms/InquiryForm/InquiryForm.svelte';
import type { Dictionary } from '#lib/i18n/context.ts';
import content from '#lib/services/content.ts';
import { staticHtml } from '#lib/services/static-html.ts';
import type { PageServerLoad } from './$types';

var _LAYOUTS: Partial<Record<PageTemplate, PageTemplate>> = {
  resume: 'article',
  services: 'article',
};

var _PROFILES = ['index', 'cv'];

var _missing = (): never => error(404, 'Not found');

var _unavailable = (): never => error(503, 'Content is unavailable');

var _form = (event: ServerLoadEvent, page: PageRecord, i18n: Dictionary) =>
  page.template === 'contacts'
    ? staticHtml(
        event,
        render(InquiryForm, {
          props: {
            t: i18n,
            locale: page.locale,
            page: event.url.pathname,
            sent: event.url.searchParams.has(INQUIRY_SENT_QUERY),
          },
        }).body
      )
    : undefined;

var _shape =
  (event: ServerLoadEvent) =>
  ({ 0: page, 1: { i18n } }: [PageRecord, { i18n: Dictionary }]) =>
    ((t, cover) => ({
      slug: page.slug,
      title: page.title,
      template: page.template,
      shot: shotFor(page.template),
      layout: _LAYOUTS[page.template] ?? page.template,
      contactsHref: hrefFor({ locale: page.locale, slug: CONTACTS_SLUG }),
      sent: event.url.searchParams.has(INQUIRY_SENT_QUERY),
      html: staticHtml(event, inlineArt(page.content)),
      form: _form(event, page, i18n),
      head: {
        title: page.longtitle || page.title,
        description: page.description,
        keywords: page.keywords,
        canonical: `${SITE_ORIGIN}${hrefFor(page)}`,
        cover: OG_COVERS[cover],
        coverAlt: t(`seo.covers.${cover}`),
        graph: pageGraph({ origin: SITE_ORIGIN, dictionary: i18n }, page),
        markdown: markdownUrl(SITE_ORIGIN, page),
        ogType: _PROFILES.includes(page.slug)
          ? ('profile' as const)
          : ('website' as const),
      },
    }))(localize(i18n), OG_COVERS[page.slug] ? page.slug : 'index');

export var load: PageServerLoad = (event) => {
  const shape = reroute(event.url.pathname);
  if (shape && 'redirect' in shape) redirect(301, shape.redirect);
  if (shape) _missing();
  const { locale, slug } = parseRoute(event.url.pathname);
  return Promise.all([
    content.pages.find(locale, slug).then(($) => $ ?? _missing(), _unavailable),
    event.parent(),
  ]).then(_shape(event));
};
