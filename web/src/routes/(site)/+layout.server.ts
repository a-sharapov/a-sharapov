import { DEFAULT_LOCALE, SITE_ORIGIN } from '#lib/common/constants.ts';
import { siteGraph } from '#lib/common/seo.ts';
import content from '#lib/services/content.ts';
import type { LayoutServerLoad } from './$types';

export var load: LayoutServerLoad = ({ params }) =>
  ((locale) =>
    Promise.all([
      content.i18n.dictionary(locale),
      content.pages.nav(locale),
      content.contacts.list(),
    ]).then(({ 0: i18n, 1: nav, 2: contacts }) => ({
      locale,
      i18n,
      nav,
      contacts,
      site: siteGraph({ origin: SITE_ORIGIN, dictionary: i18n, contacts }),
    })))(params.locale ?? DEFAULT_LOCALE);
