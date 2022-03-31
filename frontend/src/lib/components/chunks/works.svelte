<script>
  export let status
  export let loading
</script>

<article id="works">
  <slot></slot>
</article>
<span class="works-back"></span>

<style>
  #works {
    position: relative;
    display: block;
    background: #ffffff95;
    height: 65vh;
    width: 100%;
    max-width: 1200px;
    backdrop-filter: blur(7px);
    box-shadow: 0 2px 25px #00000015, 0 -5px 75px #00000020;
    border-top: 1px solid #fff;
    z-index: 3;
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
  }
  #works + .works-back {
    position: relative;
    display: block;
    height: 65vh;
    margin: calc(-65vh - 10px) 0 0;
    width: 100%;
    max-width: 1180px;
    text-align: center;
  }
  #works + .works-back:before,
  #works + .works-back:after {
    content: "";
    margin: 0 auto;
    position: absolute;
    display: block;
    background: #ffffff90;
    border-top: 1px solid #fff;
  }
  #works + .works-back:before {
    top: 0;
    left: auto;
    right: auto;
    width: 100%;
    height: 100%;
    filter: blur(.2px);
  }
  #works + .works-back:after {
    top: -8px;
    left: 10px;
    right: 10px;
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    filter: blur(.4px);
    opacity: .5;
  }
</style>