<script>
  export let current = 1
  export let total
  export let processor
  export let maxPages = 6
  
  let halfMax = Math.floor(maxPages / 2)
  let pages = []
  let i = 1

  $: switch (true) {
    case (current >= 1 && current < maxPages):
      i = 1
      pages = []
      while (i <= total) {
        pages.push(i)
        i++
      }
      break
    case (current >= 1 && current <= halfMax + 1 && current >= maxPages):
      i = 1
      pages = []
      while (i <= maxPages - 1) {
        pages.push(i)
        i++
      }
      pages.push("...")
      pages.push(total)
      break
    case (current > 1 && current > halfMax+1 && current <= (total - maxPages)):
      pages = []
      pages.push(1)
      pages.push("...")
      i = current - halfMax
      while (i <= current + halfMax) {
        pages.push(i)
        i++
      }
      pages.push("...")
      pages.push(total)
      break
    case (current <= total && current > (total - maxPages)):
      pages = []
      pages.push(1)
      pages.push("...")
      i = total - maxPages
      while (i <= total) {
        pages.push(i)
        i++
      }
      break
  }
</script>

{#if total > 1}
<nav aria-label="pagination">
  {#if current > 1 && current <= total}
    <span class="page previous" data-page="{current-1}" on:click="{processor}">Предыдущая</span>
  {/if}
  {#each pages as page}
    {#if page === "..."} 
      <span class="paging-delimeter">{page}</span>
    {:else if page === current && typeof page === "number"}
      <span class="page active">{page}</span>
    {:else}
      <span class="page" data-page="{page}" on:click="{processor}">{page}</span>
    {/if}
  {/each}
  {#if total > 1 && current < total}
    <span class="page next" data-page="{current+1}" on:click="{processor}">Следующая</span>
  {/if}
</nav>
{/if}

<style>
  nav[aria-label="pagination"] {
    display: block;
    width: 100%;
    padding: 10px;
    user-select: none;
  }

  nav > span {
    cursor: pointer;
    padding: 0 2px;
    margin: 0 5px;
    border-bottom: 1px dotted var(--mf-red);
    transition: all .2s linear;
  }

  nav > span.active {
    padding: 0 7px;
    font-weight: block;
    background: var(--mf-red);
    color: #fff;
    text-shadow: 0 1px 0 #22000040;
    border-radius: 3px;
    border: none;
  }
</style>