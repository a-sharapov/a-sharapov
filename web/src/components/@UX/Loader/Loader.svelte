<script lang="ts">
  import './Loader.css';

  interface ILoader {
    label?: string;
  }

  let { label = '' }: ILoader = $props();

  const _BARS = Array.from({ length: 10 }, (_, index) => index);
</script>

<span class="load-indicator">
  {#each _BARS as index (index)}
    <span style:--i={index} aria-hidden="true"></span>
  {/each}
  {#if label}
    <span class="sr-only">{label}</span>
  {/if}
</span>
