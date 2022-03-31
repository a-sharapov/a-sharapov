<script>
  import { writable } from 'svelte/store';
  export let message

  let currentMessage = writable($message.content)
  let currentType = $message.type

  const handleOnClick = (event) => {
    event.target.setAttribute("data-hidden", true)
    currentMessage.set("")
  }
</script>

{#if $currentMessage}
  <dialog class="toast" data-type="{currentType}" data-hidden="false" on:click={handleOnClick}>
    <p class="toast-title">Уведомляем!</p>
    <p>{currentMessage}</p>
  </dialog>
{/if}