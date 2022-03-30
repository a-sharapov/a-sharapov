<script>
  import { page } from "$app/stores"
  import { pathChanger } from "$lib/components/utils/"  
  import config from "$lib/config/main.js"

  const { menu } = config
  const menuHandler = (event) => {
    if (!event.target.classList.contains("active")) {
      document.querySelectorAll(".menu-item").forEach((item, _) => {
        item.classList.remove("active")
      })
      event.target.classList.toggle("active")
      pathChanger(event.target.getAttribute('data-path'))
    }
  }
</script>

<nav aria-label="menu">
  {#each menu as menuItem}
    <span class="menu-item narrow" data-path="{menuItem.link}" on:click|once="{menuHandler}" class:active="{$page.url.pathname === menuItem.link}">{menuItem.title}</span>
  {/each}
</nav>

<style>
  nav {
    display: block;
    position: fixed;
    top: 0;
    text-align: center;
    width: 100%;
    height: 40px;
    background-color: #ffffff80;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px #00000010;
    z-index: 1000;
    border-bottom: 1px solid #eee;
  }
  nav span.menu-item {
    position: relative;
    color: #333;
    display: inline-block;
    height: 40px;
    line-height: 40px;
    margin: 0;
    padding: 0 20px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .2s linear;
  }
  nav span.menu-item.active {
    color: #333;
    background: #fff;
    font-weight: bold;
    border-bottom: 1px solid var(--ash-red);
    box-shadow: 0 1px 7px #00000010;
  }
  nav span.menu-item.active:after {
    content: "";
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 5px;
    width: 100%;
    background: radial-gradient(var(--ash-red), #fff);
    filter: blur(10px);
  }
</style>