<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Shot } from '#lib/common/types.ts';
  import './Sheet.css';
  import '#lib/styles/Article.css';
  import '#lib/styles/Services.css';

  interface ISheet {
    shot: Shot;
    layout: string;
    children: Snippet;
  }

  let { shot, layout, children }: ISheet = $props();
</script>

<article class="sheet" data-shot={shot} data-layout={layout}>{@render children()}</article>
