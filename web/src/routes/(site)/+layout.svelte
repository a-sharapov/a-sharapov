<script lang="ts">
  import { SCENE_MEDIA } from '#lib/common/constants.ts';
  import Footer from '#lib/components/@Layout/Footer/Footer.svelte';
  import Header from '#lib/components/@Layout/Header/Header.svelte';
  import Island from '#lib/components/@UX/Island/Island.svelte';
  import SceneLoader from '#lib/components/@UX/SceneLoader/SceneLoader.svelte';
  import { page } from '$app/state';
  import '#lib/components/@Viewer/Viewer.css';
  import '#lib/styles/Html.css';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  const loadViewer = import.meta.env.SSR
    ? undefined
    : () => import('#lib/components/@Viewer/Viewer.svelte');

  const missing = $derived(Boolean(page.error));
  const chrome = $derived(!page.data.bare);
</script>

{#if chrome}
  <Header t={data.i18n} nav={data.nav} slug={missing ? '404' : (page.data.slug ?? '')} />
{/if}
<main id="content" tabindex="-1">{@render children()}</main>
{#if chrome}
  <Footer t={data.i18n} locale={data.locale} />
{/if}
<SceneLoader t={data.i18n} />
<Island
  when="media"
  query={SCENE_MEDIA}
  load={loadViewer}
  props={{
    t: data.i18n,
    shot: missing ? 'tablet' : (page.data.shot ?? 'intro'),
    notFound: missing,
    contacts: data.contacts,
  }}
>
  {#snippet fallback()}
    <div class="viewer" data-phase="boot" aria-hidden="true"></div>
  {/snippet}
</Island>
