<script>
  import { writable } from 'svelte/store'
  import { pathChanger } from "$lib/components/utils"
  
  export let status
  export let loading
  export let change
  export let slogan

  let active = writable(false)
  let content = writable(slogan)

  const handleOnMouseEnter = () => {
    active.set(true)
    content.set(change)
  }

  const handleOnMouseLeave = () => {
    active.set(false)
    content.set(slogan)
  }
</script>

<div id="vcard" data-active="{$active}" on:click|once="{() => pathChanger("cv")}" on:mouseenter="{handleOnMouseEnter}" on:mouseleave="{handleOnMouseLeave}">
  <div class="overflow-content">
    <img src="/i/logo.svg" class="vcard-logo" width="250px" alt="Александр Шарапов" /><br />
    <span class="vcard-slogan narrow" data-active="{$active}">{$content}</span>
  </div>
</div>

<style>
#vcard {
  position: relative;
  height: 220px;
  width: 340px;
  text-align: center;
  transition: all .3s linear;
  transform: skewY(0);
}
#vcard .overflow-content {
  position: relative;
  padding: 40px 20px;
  width: 340px;
  height: 220px;
  background: linear-gradient(to top, #eaeaea, #fefefe);
  box-shadow: 0 5px 12px rgb(0 0 0 / 5%);
  backdrop-filter: blur(15px);
  z-index: 3;
  opacity: .99;
  transition: all .3s linear;
  border-top: 1px solid #fff;
}
#vcard:before,
#vcard:after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  transition: all .3s linear;
}
#vcard:before {
  height: 5px;
  background: linear-gradient(to left, #111, transparent);
  filter: blur(10px);
  z-index: 1;
}
#vcard:after {
  top: calc(100% + 5px);
  background: linear-gradient(to bottom, #fff, transparent);
  height: 125px;
  filter: blur(5px);
  opacity: .8;
  border-radius: 5px;
}
#vcard[data-active="true"]:hover {
  cursor: pointer;
  transform: skewY(2deg);
}
#vcard[data-active="true"] .overflow-content {
  opacity: 1;
  transform: rotate(10deg) translate(0, -30px);
}
#vcard[data-active="true"]:before {
  filter: blur(7px);
  opacity: .85;
  transform: scale(1, .5);
}
#vcard[data-active="true"]:after {
  transform: rotate(-10deg) translate(0, 30px);
  filter: blur(3px);
  opacity: .3;
}
.vcard-slogan {
  display: inline-block;
  width: fit-content;
  padding: 0 8px;
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
  border-radius: 2px;
  background: none;
  transition: all .3s linear;
}
.vcard-slogan[data-active="true"] {
  line-height: 28px;
  color: #fff;
  background: var(--ash-red);
  text-shadow: none;
}
.vcard-logo {
  margin: 10px 0 0;
}
.overflow-content {
  position: relative;
  z-index: 20;
}
</style>