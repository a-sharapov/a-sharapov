<script lang="ts">
  import Sheet from '#lib/components/@Content/Sheet/Sheet.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Scene lookdev</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#if data.shot !== 'intro'}
  <Sheet shot={data.shot} layout={data.layout}>
    <h1>Лукдев листа</h1>
    <p>Лист для проверки подгонки бумаги и камеры.</p>
  </Sheet>
{/if}
