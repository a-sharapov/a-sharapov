<script lang="ts">
  import { loading } from "storage";

  let iterator: number = 1;
  let elements: Array<number> = Array.from(
    { length: 10 },
    (): number => iterator++
  );

  import "./Loader.style.css";
</script>

{#if $loading}
  <div class="load-placeholder">
    <span class="load-indicator"
      >{#each elements as _}
        <i />
      {/each}
    </span>
  </div>
{/if}
