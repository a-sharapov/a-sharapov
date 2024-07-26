<script>
  import Logo from '@lib/components/Logo/Logo.svelte'
  import { T } from '@threlte/core'
  import { FakeGlowMaterial, HTML } from '@threlte/extras'
  import { navigate } from 'astro:transitions/client'
  import { COLORS } from './assets'
  import { currentState, INTRO } from './state'

  export let vcardPosition
  export let vcardRotation
  export let vcardScale
  export let vcadGeometry

  export let vcardIsActive
  export let setVcardActive
  export let setVcardInactive

  export let locale
</script>

<T.Mesh
  position={$vcardPosition}
  rotation={$vcardRotation}
  scale={$vcardScale}
  on:pointerenter={$currentState === INTRO ? setVcardActive : void 0}
  on:pointerleave={$currentState === INTRO ? setVcardInactive : void 0}
  castShadow
  receiveShadow
  on:click={$currentState === INTRO ? () => navigate([locale, 'cv'].join('/')) : void 0}
>
  <T.BoxGeometry args={$vcadGeometry} />
  <FakeGlowMaterial glowColor={COLORS.GROW} />
  <T.MeshStandardMaterial color={COLORS.LIGHT} />
  {#if $currentState === INTRO}
    <HTML
      as="article"
      geometry={$vcadGeometry}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={0.7}
      transform
      center
      pointerEvents="none"
      portal={document.body.querySelector('main[data-layout="intro"]')}
      zIndexRange={[9999, 0]}
    >
      <Logo {locale} {vcardIsActive} />
    </HTML>
  {/if}
</T.Mesh>
