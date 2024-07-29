<script>
  import Loader from '@lib/components/Loader/Loader.svelte'
  import Scene from '@lib/components/Scene/Scene.svelte'
  import store from '@lib/shared/store'
  import { Canvas } from '@threlte/core'
  import { useProgress } from '@threlte/extras'
  import { onMount } from 'svelte'
  import { tweened } from 'svelte/motion'
  import './Canvas.scss'

  export let slug
  export let locale
  export let modifier

  let size = { width: 0, height: 0 }
  const { progress } = useProgress()
  export let tweenedProgress = tweened($progress, {
    duration: 8e2
  })

  onMount(() => {
    size = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })

  tweenedProgress.subscribe(
    (progress) =>
      (progress === 1 || progress === 0) &&
      store.update((store) => ({
        ...store,
        sceneIsReady: progress === 1
      }))
  )

  $: tweenedProgress.set($progress)
</script>

{#if $tweenedProgress < 1 && $store.sceneIs3D}
  <Loader />
{/if}

{#if $store.sceneIs3D}
  <Canvas renderMode="on-demand" {size} useLegacyLights={false}>
    <Scene {slug} {locale} {modifier}>
      <slot />
    </Scene>
  </Canvas>
{/if}
