<script>
  export let message
</script>

{#if $message.content}
<dialog class="notifier narrow" data-type="{$message.type}">
    <p>{@html $message.content}</p>
</dialog>
{/if}

<style>
  .notifier {
    display: block;
    font-size: 18px;
    font-weight: bold;
    color: #555;
    bottom: 50%;
    text-align: center;
    border: 1px solid #fefefe80;
    background: #ffffff95;
    backdrop-filter: blur(3px);
    padding: 30px;
    border-radius: 3px;
    box-shadow: 0 5px 15px #00000010, 0 3px 25px #00000015;
  }
</style>