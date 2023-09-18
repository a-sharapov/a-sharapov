<script lang="ts">
  import { writable } from "svelte/store";

  let ashes = writable<Array<number>>([]);

  let i = 1;
  while (i <= 200) {
    $ashes.push(i);
    i++;
  }

  import styles from "./Ashes.module.scss";
</script>

<div class={styles.ashes}>
  {#each $ashes as ash}
    <i data-item={ash} />
  {/each}
</div>
