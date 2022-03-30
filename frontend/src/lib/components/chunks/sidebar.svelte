<script>
  import Contacts from "$lib/components/chunks/contacts.svelte"
</script>

<aside class="sidebar">
  <a href="/" id="logo"><img src="/i/logo.svg" width="220px" alt="Александр Шарапов" /></a>
  <span class="slogan narrow">Если бизнесу нужен имидж</span>
  <hr />
  <Contacts />
</aside>

<style>
  aside.sidebar {
    position: absolute;
    left: 0;
    top: 20px;
    bottom: 0;
    width: 300px;
    text-align: center;
    padding: 40px 0;
    background: linear-gradient(to bottom, #fff, transparent 40%, transparent);
  }
  aside.sidebar .slogan {
    display: block;
    clear: both;
    font-weight: bold;
    line-height: 28px;
    margin: 0 auto;
    text-transform: uppercase;
    width: fit-content;
    padding: 0 8px;
    background: #00000010;
    border-radius: 4px;
  }
</style>