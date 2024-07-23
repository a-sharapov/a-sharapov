<script>
  import './Loader.scss'

  let elements = Array.from({ length: 10 }, (i) => i + 1)
</script>

<div class="loadPlaceholder">
  <span class="loadIndicator">
    {#each elements as _}<i />{/each}
  </span>
</div>
