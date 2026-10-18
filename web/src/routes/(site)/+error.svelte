<script lang="ts">
  import { DEFAULT_LOCALE, SITE_ORIGIN } from '#lib/common/constants.ts';
  import { localize } from '#lib/common/utils.ts';
  import NotFound from '#lib/components/@Content/NotFound/NotFound.svelte';
  import Sheet from '#lib/components/@Content/Sheet/Sheet.svelte';
  import Head from '#lib/components/@Layout/Head/Head.svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';

  const i18n = $derived(page.data.i18n ?? {});
  const t = $derived(localize(i18n));

  afterNavigate(({ type }) => void (type !== 'enter' && page.status >= 500 && location.reload()));
</script>

<Head
  t={i18n}
  site={page.data.site ?? []}
  title={t('error.notFound.title')}
  robots="noindex"
  canonical={`${SITE_ORIGIN}${page.url.pathname}`}
/>

<Sheet shot="tablet" layout="notfound">
  <NotFound t={i18n} locale={page.data.locale ?? DEFAULT_LOCALE} />
</Sheet>
