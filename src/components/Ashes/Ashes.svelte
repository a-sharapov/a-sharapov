<script lang="ts">
  import { writable } from "svelte/store";

  let ashes = writable<Array<number>>([]);

  let i = 1;
  while (i <= 200) {
    $ashes.push(i);
    i++;
  }
</script>

<div class="ashes">
  {#each $ashes as ash}
    <i data-item={ash} />
  {/each}
</div>

<style lang="scss">
  .ashes {
    position: fixed;
    width: calc(100% + 2.5rem);
    height: calc(100% + 2.5rem);
    offset: -5rem;
    overflow: visible;
    transform: scale(1, -1);
    pointer-events: none;
    user-select: none;
    transform: translateZ(500px);
    z-index: 1000;

    & > i {
      position: absolute;
      width: 1px;
      height: 1px;
      background: #999;
      border-radius: 50%;
      user-select: none;
      will-change: auto;
      box-shadow: 0 0 3px #ccc5, 0 0 5px #ccc1;
    }
  }

  @keyframes ashFall {
    0% {
      transform: translate3d(var(--left-ini), 110vh, 0);
    }
    100% {
      transform: translate3d(var(--left-end), 0, 0);
    }
  }

  @for $i from 1 through 200 {
    .ashes > i:nth-child(#{$i}) {
      --size: #{random(5) * 0.2}vw;
      --left-ini: #{random(20) - 10}vw;
      --left-end: #{random(20) - 10}vw;
      left: #{random(100)}vw;
      animation: ashFall #{10 + random(10)}s linear infinite;
      animation-delay: -#{random(10)}s;
    }
  }
</style>
