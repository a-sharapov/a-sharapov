<script>
  export let status
  export let loading
</script>

<article id="cv">
  <section class="content">
    <slot></slot>
  </section>
</article>

<style>
  #cv {
    display: block;
    width: calc(100% - 600px);
    height: 100vh;
    margin: 0 0 0 300px;
    padding: 0;
    background: linear-gradient(to top, #fafafa97, #ffffff);
    backdrop-filter: blur(15px);
    box-shadow: -5px 0 30px #00000020, 0 0 130px #00000030;
    overflow-x: hidden;
  }

  #cv .content {
    padding: 0;
  }
</style>