<script>
  import Loader from "$lib/components/ui/loader.svelte"

  export let status
  export let loading
</script>

<main id="content" data-staus="{$status}">
  <Loader {loading} />
  <slot></slot>
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
  #content[data-staus="cv"] {
    align-items: flex-start;
    justify-content: left;
    z-index: 100;
  }
</style>