<script>
  export let loading
</script>

{#if $loading}
<div class="load-placeholder">
  <span class="load-indicator"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
</div>
{/if}

<style>
  .load-placeholder {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .load-placeholder .load-indicator {
    display: flex;
    width: 150px;
    height: 1px;
    transform: translateZ(0);
  }

  .load-indicator i {
    border-radius: 2px;
    flex: 1;
    background: var(--ash-red);
    -webkit-animation: go 0.8s infinite alternate ease;
            animation: go 0.8s infinite alternate ease;
    box-shadow: 0 0 20px var(--ash-red);
  }
  .load-indicator i:nth-child(1) {
    -webkit-animation-delay: -0.72s;
            animation-delay: -0.72s;
  }
  .load-indicator i:nth-child(2) {
    -webkit-animation-delay: -0.64s;
            animation-delay: -0.64s;
  }
  .load-indicator i:nth-child(3) {
    -webkit-animation-delay: -0.56s;
            animation-delay: -0.56s;
  }
  .load-indicator i:nth-child(4) {
    -webkit-animation-delay: -0.48s;
            animation-delay: -0.48s;
  }
  .load-indicator i:nth-child(5) {
    -webkit-animation-delay: -0.4s;
            animation-delay: -0.4s;
  }
  .load-indicator i:nth-child(6) {
    -webkit-animation-delay: -0.32s;
            animation-delay: -0.32s;
  }
  .load-indicator i:nth-child(7) {
    -webkit-animation-delay: -0.24s;
            animation-delay: -0.24s;
  }
  .load-indicator i:nth-child(8) {
    -webkit-animation-delay: -0.16s;
            animation-delay: -0.16s;
  }
  .load-indicator i:nth-child(9) {
    -webkit-animation-delay: -0.08s;
            animation-delay: -0.08s;
  }
  .load-indicator i:nth-child(10) {
    -webkit-animation-delay: 0s;
            animation-delay: 0s;
  }
  
  @-webkit-keyframes go {
    100% {
      background: transparent;
      flex: 10;
      box-shadow: 0 0 0 transparent;
    }
  }
  
  @keyframes go {
    100% {
      background: transparent;
      flex: 10;
      box-shadow: 0 0 0 transparent;
    }
  }
</style>