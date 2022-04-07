<script>
  export let message
</script>

{#if $message.content}
<dialog class="notifier" data-type="{$message.type}">
    <p>{@html $message.content}</p>
</dialog>
{/if}

<style>
  .notifier {
    display: block;
    bottom: 50%;
    text-align: center;
    border: 2px solid #fefefe80;
    background: #ffffff95;
    backdrop-filter: blur(3px);
    padding: 30px;
    border-radius: 3px;
    box-shadow: 0 5px 15px #00000010;
  }
</style>