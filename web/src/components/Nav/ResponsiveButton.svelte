<script>
  import { isMobile } from '@lib/shared/utils'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  export let target = 'navigation'

  let handleMobile = false
  let isActive = false
  let button

  const toggleNavAttribute = () =>
    void ((isActive = !isActive),
    (document.querySelector(`nav[data-role=${target}]`).dataset.active = isActive))

  onMount(() => {
    handleMobile = isMobile()
  })
</script>

{#if handleMobile}
  <span
    bind:this={button}
    class="viewToggle narrow"
    role="button"
    tabindex="0"
    transition:fade
    on:click={toggleNavAttribute}
  >
    {#if isActive}&times;{:else}&equiv;{/if}
  </span>
{/if}
