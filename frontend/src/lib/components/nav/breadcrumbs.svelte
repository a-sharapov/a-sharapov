<script>
  import { writable } from 'svelte/store'
  import { page } from "$app/stores"
  
  let crumbs = writable([...$page.url.href.split('/')])
  $crumbs.shift()
  $crumbs.shift()
  console.log($crumbs)
</script>

<nav aria-label="breadcrumb">
  {#each $crumbs as crumb}
    <a href="{crumb}" class="crumb">{crumb}</a>
  {/each}
</nav>