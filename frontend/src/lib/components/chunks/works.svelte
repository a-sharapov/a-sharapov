<script>
  export let status
  export let loading
</script>

<article id="works">
  <slot></slot>
</article>

<style>
  #works {
    display: block;
    background: #ffffff95;
    height: 65vh;
    width: 100%;
    max-width: 1200px;
    border-radius: 10px;
    backdrop-filter: blur(7px);
    box-shadow: 0 2px 25px #00000020;
  }
  #works:before,
  #works:after {
    content: "";
  }
</style>