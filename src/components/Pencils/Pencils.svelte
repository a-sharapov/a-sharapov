<script lang="ts">
  import { blur } from "svelte/transition";
  export let left = 0;

  import "./Pencils.style.css";
</script>

<div
  class="pencils"
  style="margin-left: {left}px;"
  transition:blur={{ amount: 10 }}
/>
