<script>
  export let message

  const handleOnClick = (event) => {
    event.preventDefault()
    message.set({
      content: '',
      hidden: true,
    })
  }
</script>

<dialog class="notifier narrow" data-type="{$message.type}" data-hidden="{$message.hidden}" on:click="{handleOnClick}">
{#if $message.content}
  <p>{@html $message.content}</p>
{/if}
</dialog>

<style>
  .notifier[data-hidden="true"] {
    opacity: 0;
    transform: scale(.1);
    bottom: 80%;
    z-index: 0;
    transition: all .3s linear;
  }
  .notifier {
    display: block;
    font-size: 18px;
    font-weight: bold;
    color: #555;
    bottom: 50%;
    text-align: center;
    border: none;
    outline: none;
    background: #ffffff90;
    backdrop-filter: blur(3px);
    padding: 30px 30px 25px 80px;
    box-shadow: 0 5px 15px #00000010, 0 3px 25px #00000015;
    border-top: 5px solid transparent;
    transform: scale(1);
    z-index: 100;
    opacity: 1;
    transform: scale(1);
    transition: all .3s linear;
  }
  .notifier:before {
    content: "";
    display: block;
    position: absolute;
    left: 10px;
    top: 10px;
    width: 50px;
    height: 50px;
  }
  .notifier[data-type="info"] {
    border-top-color: var(--color-info);
  }
  .notifier[data-type="success"] {
    border-top-color: var(--color-success);
  }
  .notifier[data-type="warning"] {
    border-top-color: var(--color-alert);
  }
  .notifier[data-type="error"] {
    border-top-color: var(--color-danger);
  }
  .notifier[data-type="info"]:before {
    background: url(/i/info.svg) no-repeat center;
    background-size: contain;
  }
  .notifier[data-type="success"]:before {
    background: url(/i/success.svg) no-repeat center;
    background-size: contain;
  }
  .notifier[data-type="warning"]:before {
    background: url(/i/alert.svg) no-repeat center;
    background-size: contain;
  }
  .notifier[data-type="error"]:before {
    background: url(/i/error.svg) no-repeat center;
    background-size: contain;
  }
</style>