<script lang="ts">
  import { blur } from "svelte/transition";

  import "./Paperplane.style.css";
</script>

<div class="paperplane" transition:blur={{ amount: 10 }} />
