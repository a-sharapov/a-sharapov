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

  let size = { width: 0, height: 0 }
  const { progress } = useProgress()
  export let tweenedProgress = tweened($progress, {
    duration: 800
  })

  onMount(() => {
    size = {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })

  tweenedProgress.subscribe(
    (progress) =>
      void (
        progress === 1 &&
        store.update((store) => ({
          ...store,
          sceneReady: progress === 1
        }))
      )
  )

  $: tweenedProgress.set($progress)
</script>

{#if $tweenedProgress < 1}
  <Loader />
{/if}

<Canvas renderMode="on-demand" {size} useLegacyLights={false}>
  <Scene {slug} {locale} />
</Canvas>
