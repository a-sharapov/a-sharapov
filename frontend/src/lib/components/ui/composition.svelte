<script>
  import { writable } from 'svelte/store'
  import { browser } from '$app/env'
  
  import Cup from "$lib/components/ui/cup.svelte"
  import Pencils from "$lib/components/ui/pencils.svelte"
  import Lamp from "$lib/components/ui/lamp.svelte"
  import Paperplane from "$lib/components/ui/paperplane.svelte"

  export let status
  let moves = writable(0)

  if (browser) {
    document.addEventListener("mousemove", (e) => {
      let x = e.pageX - parseInt(window.innerWidth) / 2
      moves.set(x*.01)
    })
  }
</script>

<div id="composition" data-staus="{$status}" >
  <Paperplane left="{$moves}" />
  <Cup left="{-$moves}" />
  <Pencils left="{$moves}" />
  <Lamp left="{-$moves/15}" />
</div>

<style>
#composition {
  position: relative;
  display: block;
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  height: 100vh;
  transition: all .3s linear;
}
#composition[data-staus="main"] {
  max-width: 1000px;
  height: 65vh;
  margin-top: 15vh;
  transform: none;
}

:global(#composition[data-staus="main"] .pencils) {
  left: -70px;
}

:global(#composition[data-staus="main"] .cup) {
  left: calc(100% - 500px);
}

#composition[data-staus="cv"] {
  max-width: 700px;
  height: 100vh;
  margin-top: 0;
  left: -100px;
  margin: 0;
  transform: scale(1.2);
}
:global(#composition[data-staus="cv"] .pencils) {
  left: 0;
  filter: blur(2px);
}
:global(#composition[data-staus="cv"] .lamp) {
  filter: blur(5px);
}
:global(#composition[data-staus="works"] .pencils) {
  left: calc(100% - 500px);
}
:global(#composition[data-staus="works"] .lamp) {
  left: 50%;
}
:global(#composition[data-staus="connect"]) {
  height: 100vh;
  height: 85vh;
}
:global(#composition[data-staus="connect"] .cup) {
  left: -100px;
  bottom: -150px;
  transform: scale(1.5);
  filter: blur(3px);
}
:global(#composition[data-staus="connect"] .lamp) {
  transform: scale(1.1);
  filter: blur(5px);
}
:global(#composition[data-staus="connect"] .pencils) {
  transform: scale(1.1);
  filter: blur(3px);
}
:global(#composition[data-staus="connect"] .paperplane) {
  bottom: 50px;
  filter: blur(3px);
}
</style>