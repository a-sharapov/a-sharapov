<script lang="ts">
  import { blur } from "svelte/transition";

  let iterator: number = 1;
  let steamParts: Array<number> = Array.from({ length: 200 }, (): number => {
    return iterator++;
  });

  import "./CoffeeCup.style.css";
</script>

<div class="coffee-cup" transition:blur={{ amount: 10 }}>
  <span class="coffee-cup-steam">
    {#each steamParts as steamPart}
      <i class="s{steamPart}" />
    {/each}
  </span>
</div>
