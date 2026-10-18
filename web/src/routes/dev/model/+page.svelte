<script lang="ts">
  import Island from '#lib/components/@UX/Island/Island.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const loadLab = import.meta.env.SSR
    ? undefined
    : () => import('#lib/components/@Viewer/Lab/ModelLab.svelte');
</script>

<svelte:head>
  <title>Model lab · {data.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<Island load={loadLab} props={{ model: data.name }} />

<style>
  :global(html),
  :global(body) {
    margin: 0;
    height: 100%;
    background: #d8d0c2;
  }
</style>
