<script lang="ts">
  import { blur } from "svelte/transition";

  import "./Pencils.style.css";
</script>

<div class="pencils" transition:blur={{ amount: 10 }} />
