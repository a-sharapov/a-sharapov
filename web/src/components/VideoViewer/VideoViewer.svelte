<script>
  import { onMount } from 'svelte'
  import { scale } from 'svelte/transition'
  import './VideoViewer.scss'

  export let src = ''
  export let eventName = undefined
  let isVisible = false

  const toggleVideo = () => (isVisible = !isVisible)
  const hideVideoOnEscape = (e) => e.key === 'Escape' && (isVisible = false)

  onMount(() => {
    eventName && document.addEventListener(eventName, toggleVideo)
    window.addEventListener('keydown', hideVideoOnEscape)

    window.location.search.includes(eventName) && (isVisible = true)

    return () => {
      eventName && document.removeEventListener(eventName, toggleVideo, false)
      window.removeEventListener('keydown', hideVideoOnEscape, false)
    }
  })
</script>

{#if src && isVisible}
  <dialog class="floatVideoWrapper" open in:scale out:scale>
    <button class="action" tabindex="0" aria-label="Close" on:click={toggleVideo}>
      <img src="/i/close.svg" alt="" />
    </button>
    <video preload="auto" {src} autoplay muted playsinline controls="true" />
  </dialog>
{/if}
