<script lang="ts">
  import { blur } from "svelte/transition";
  export let left: number = 0;

  import "./Paperplane.style.css";
</script>

<div
  class="paperplane"
  style="margin-left: {left}px;"
  transition:blur={{ amount: 10 }}
/>
