<script>
  import { onMount } from 'svelte'
  import { initScene } from './scene'
  import './Scene.scss'

  let loader = null
  let loading = true

  onMount(() => {
    initScene(window, 'mainScene')
    loading = false
  })
</script>

{#if loading}
  <div bind:this={loader} class="loadingIndicator" />
{/if}
