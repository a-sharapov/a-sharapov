<script lang="ts">
  import { blur } from "svelte/transition";
  export let left: number = 0;

  import "./Lamp.style.css";
</script>

<div
  class="lamp"
  style="margin-left: {left}px;"
  transition:blur={{ amount: 10 }}
/>
