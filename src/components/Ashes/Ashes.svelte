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
