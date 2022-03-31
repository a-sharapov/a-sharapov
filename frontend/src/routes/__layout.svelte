<script>
  import { writable } from 'svelte/store'
  import { browser } from '$app/env'
  import MobileView from "$lib/components/chunks/simple.svelte";
  import Ashes from "$lib/components/ui/ashes.svelte"

  let mobile = writable(false)
  
  const setBrowserView = () => {
    navigator.userAgentData.mobile || window.innerWidth < 1100 ? mobile.set(true) : mobile.set(false)
  }

  $: if (browser) {
    setBrowserView()
    window.addEventListener('resize', () => {
      setBrowserView()
    })
  }
</script>

{#if $mobile}
  <MobileView />
{:else}
  <slot></slot>
  <Ashes />
{/if}