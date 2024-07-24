<script>
  import Loader from '@lib/components/Loader/Loader.svelte'
  import Scene from '@lib/components/Scene/Scene.svelte'
  import { Canvas } from '@threlte/core'
  import { useProgress } from '@threlte/extras'
  import { onMount } from 'svelte'
  import { tweened } from 'svelte/motion'
  import './Canvas.scss'

  let size = { width: 0, height: 0 }
  const { progress } = useProgress()
  let tweenedProgress = tweened($progress, {
    duration: 800
  })

  onMount(() => {
    size = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })

  $: tweenedProgress.set($progress)
</script>

{#if $tweenedProgress < 1}
  <Loader />
{/if}

<Canvas renderMode="on-demand" {size} useLegacyLights={false}>
  <Scene antialias />
</Canvas>
