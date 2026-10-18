<script lang="ts">
  import { OG_COVERS, SITE_ORIGIN } from '#lib/common/constants.ts';
  import { localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';

  export interface IHead {
    title?: string;
    description?: string;
    keywords?: string;
    robots?: string;
    canonical: string;
    cover?: string;
    coverAlt?: string;
    graph?: Record<string, unknown>[];
    markdown?: string;
    ogType?: 'website' | 'profile';
  }

  interface IHeadProps extends IHead {
    t: Dictionary;
    site: Record<string, unknown>[];
  }

  let {
    t: dictionary,
    site,
    title = '',
    description = '',
    keywords = '',
    robots = 'index, follow',
    canonical,
    cover = OG_COVERS.index,
    coverAlt = '',
    graph = [],
    markdown = '',
    ogType = 'website',
  }: IHeadProps = $props();

  const _LD = ['<script type="application/ld+json">', '</', 'script>'];

  const t = $derived(localize(dictionary));
  const indexable = $derived(!robots.includes('noindex'));
  const coverUrl = $derived(new URL(cover ?? OG_COVERS.index!, SITE_ORIGIN).toString());
  const pageTitle = $derived(title || t('meta.title'));
  const pageDescription = $derived(description || t('meta.description'));
  const ld = $derived(
    `${_LD[0]}${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [...site, ...graph],
    }).replaceAll('<', '\\u003c')}${_LD[1]}${_LD[2]}`
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content={keywords || t('meta.keywords')} />
  <meta name="robots" content={robots} />
  {#if indexable}
    <link rel="canonical" href={canonical} />
  {/if}
  {#if markdown}
    <link rel="alternate" type="text/markdown" href={markdown} />
  {/if}
  <meta property="og:type" content={ogType} />
  {#if ogType === 'profile'}
    <meta property="profile:first_name" content={t('seo.givenName')} />
    <meta property="profile:last_name" content={t('seo.familyName')} />
  {/if}
  <meta property="og:site_name" content={t('profile.name')} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={coverUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={coverAlt || pageTitle} />
  {@html ld}
</svelte:head>
