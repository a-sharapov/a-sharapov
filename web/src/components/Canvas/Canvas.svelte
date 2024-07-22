<script>
  import Scene from '@lib/components/Scene/Scene.svelte'
  import { Canvas } from '@threlte/core'
  import { onMount } from 'svelte'
  import './Canvas.scss'

  let size = { width: 0, height: 0 }

  onMount(() => {
    size = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })
</script>

<Canvas renderMode="always" {size} useLegacyLights={false} shadows={true}>
  <Scene />
</Canvas>
