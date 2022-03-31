<header>
  <slot></slot>
</header>

<style>
  header {
    display: block;
    position: fixed;
    top: 0;
    text-align: center;
    width: 100%;
    height: 40px;
    background: linear-gradient(to bottom, #ffffff90, transparent 90%);
    z-index: 1000;
  }
  header:after {
    content: "";
    position: absolute;
    width: 70%;
    left: 15%;
    top: 0;
    height: 2px;
    background: radial-gradient(#111, transparent 70%, transparent);
    z-index: 1;
  }
</style>