<script lang="ts">
  export let left = 0;

  let iterator: number = 1;
  let steamParts: Array<number> = Array.from({ length: 200 }, (): number => {
    return iterator++;
  });

  import "./CoffeeCup.style.css";
</script>

<div class="coffee-cup" style="margin-left: {left}px;">
  <span class="coffee-cup-steam">
    {#each steamParts as steamPart}
      <i class="s{steamPart}" />
    {/each}
  </span>
</div>
