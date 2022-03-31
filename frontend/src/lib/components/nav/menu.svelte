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
    margin: 0 auto;
    background: none;
  }
  nav span.menu-item {
    position: relative;
    color: #333;
    display: inline-block;
    height: 39px;
    line-height: 40px;
    margin: 0;
    padding: 0 15px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .2s linear;
    z-index: 2;
    border-top: 2px solid transparent;
    text-decoration: underline;
    text-decoration-color: var(--ash-red);
    text-decoration-style: dotted;
    text-decoration-thickness: 1px;
    transition: all .2s linear;
    user-select: none;
  }
  nav span.menu-item:hover {
    text-decoration-style: solid;
  }
  nav span.menu-item.active {
    text-decoration: none;
    color: #333;
    background: linear-gradient(to bottom, #fff, transparent);
    backdrop-filter: blur(1px);
    font-weight: bold;
    border-top-color: var(--ash-red);
  }
  nav span.menu-item.active:after {
    content: "";
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 5px;
    width: 100%;
    background: radial-gradient(var(--ash-red), #fff);
    filter: blur(10px);
  }
  nav span.menu-item:not(:last-of-type) {
    margin-right: 20px;
  }
  nav span.menu-item:not(:last-of-type):before {
    content: "\25A0";
    position: absolute;
    font-weight: bold;
    right: -20px;
    width: 20px;
    height: 40px;
    font-size: 50%;
    color: #999;
  }
</style>