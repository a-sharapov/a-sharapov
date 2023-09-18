<script lang="ts">
  import { blur } from "svelte/transition";

  import "./Lamp.style.css";
</script>

<div class="lamp" transition:blur={{ amount: 10 }} />
