<script lang="ts">
  import { MAIN_MENU } from "constants/routes";
  const currentPage =
    typeof window !== "undefined" ? window.location.pathname : "/";

  import "./Menubar.style.css";
</script>

<nav data-role="header-navbar">
  {#each MAIN_MENU as menuItem}
    {#if menuItem.href !== currentPage}
      <a href={menuItem.href}>{menuItem.title}</a>
    {:else}
      <span class="active-item">{menuItem.title}</span>
    {/if}
  {/each}
</nav>
