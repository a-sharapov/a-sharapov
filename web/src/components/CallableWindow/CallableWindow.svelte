<script>
  /**
   * ELEMENT: <CallableWindow eventName="showThisWindow" client:load />
   * TRIGGER: <span class="button" onclick="void document.dispatchEvent(new CustomEvent('showThisWindow'));">Показать окно</span>
   **/

  import { closeDialog, pipe, showDialog, toSneakeCase } from '@lib/shared/utils'
  import { onMount } from 'svelte'
  import './CallableWindow.scss'

  export let classes = ''
  export let eventName = undefined
  let dialog = null

  const eventListener = (e) => {
    const _toUpperCase = (r) => String(r).toUpperCase()
    showDialog(dialog)
    e.detail && sessionStorage.setItem(pipe(toSneakeCase, _toUpperCase)(eventName), e.detail)
  }

  onMount(() => {
    eventName && document.addEventListener(eventName, eventListener)
    return () => eventName && document.removeEventListener(eventName, eventListener, false)
  })
</script>

<dialog
  class={['callableWindow', classes].filter(Boolean).join(' ')}
  bind:this={dialog}
  data-visible="false"
>
  <button
    class="action"
    tabindex="0"
    aria-label="Close"
    on:click={() => void (dialog && closeDialog(dialog))}
  >
    <img src="/i/close.svg" alt="" />
  </button>
  <slot />
</dialog>
