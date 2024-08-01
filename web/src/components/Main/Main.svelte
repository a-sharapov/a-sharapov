<script>
  import store from '@lib/shared/store'
  import { fade } from 'svelte/transition'
  import './Main.scss'

  let shouldDisplayStaticContent = true

  $: shouldDisplayStaticContent = !$store.sceneIsReady || !$store.sceneIs3D
</script>

<main>
  {#if shouldDisplayStaticContent}
    <section transition:fade class="contentBox" data-layout="static">
      <slot />
    </section>
  {/if}
</main>
