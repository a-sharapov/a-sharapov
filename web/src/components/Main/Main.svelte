<script>
  import { currentState } from '@lib/components/Scene/state'
  import store from '@lib/shared/store'
  import { fade } from 'svelte/transition'
</script>

{#if $store.sceneReady}
  <main
    data-layout={$currentState.description}
    in:fade={{ duration: 1e3 }}
    out:fade={{ duration: 1e3 }}
  >
    <slot />
  </main>
{/if}
