<script>
  export let status
  export let loading
</script>

<article id="works">
  <slot></slot>
</article>

<style>
  #works {
    position: relative;
    display: block;
    background: #ffffff95;
    height: 65vh;
    width: 100%;
    max-width: 1200px;
    border-radius: 10px;
    backdrop-filter: blur(7px);
    box-shadow: 0 2px 25px #00000015, 0 -5px 75px #00000020;
    border-top: 1px solid #fff;
  }
  #works:before,
  #works:after {
    content: "";
    display: block;
    position: absolute;
  }
  #works:before {
    bottom: -5px;
    width: 100%;
    height: 15px;
    background: radial-gradient(#111, transparent);
    filter: blur(10px);
    opacity: .2;
  }
  #works:after {
    top: calc(100% + 5px);
    width: 100%;
    height: 70px;
    background: linear-gradient(to bottom, #fff, transparent);
    filter: blur(5px);
    opacity: .7;
    border-radius: 10px;
  }
</style>