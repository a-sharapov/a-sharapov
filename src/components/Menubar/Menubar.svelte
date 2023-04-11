<script lang="ts">
  const menuItems = [
    {
      title: "В начало",
      href: "/",
    },
    {
      title: "Обо мне",
      href: "/cv",
    },
    {
      title: "Связь",
      href: "/feedback",
    },
  ];
  const currentPage = window.location.pathname;

  import "./Menubar.style.css";
</script>

<nav data-role="header-navbar">
  {#each menuItems as menuItem}
    {#if menuItem.href !== currentPage}
      <a href={menuItem.href}>{menuItem.title}</a>
    {:else}
      <span class="active-item">{menuItem.title}</span>
    {/if}
  {/each}
</nav>
