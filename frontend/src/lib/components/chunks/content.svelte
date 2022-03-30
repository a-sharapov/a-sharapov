<script>
  import { writable } from 'svelte/store'
  import Loader from "$lib/components/ui/loader.svelte"
  import Menu from "$lib/components/nav/menu.svelte"

  export let status
  export let loading

  const previous = $status
</script>

<main id="content" data-status="{$status}">
  <Loader {loading} />
  <Menu />
  {#if previous === $status}
    <slot></slot>
  {:else}
    <Loader loading="{writable(true)}" />
  {/if}
</main>

<style>
  #content {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    width: 100%;
    height: 100vh;
    padding: 0;
    z-index: 10;
  }
  :global(#content.cleared aside, #content.cleared article, #content.cleared div) {
    display: none;
    visibility: hidden;
  }
  #content[data-status="cv"] {
    align-items: flex-start;
    justify-content: left;
    z-index: 100;
  }
</style>