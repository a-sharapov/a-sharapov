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

  const TARGET_SLUG = 'contacts'

  const ROTATION = {
    intro: [0, 0, 0],
    landscape: [-Math.PI / 2, 0, -Math.PI / 2],
    portrait: [-Math.PI / 2, 0, Math.PI / 2]
  }

  const SCALE = {
    intro: 0.7,
    landscape: 0.4,
    portrait: 0.4
  }
</script>

<T.Mesh
  position={$vcardPosition}
  rotation={$vcardRotation}
  scale={$vcardScale}
  on:pointerenter={$currentState === INTRO ? setVcardActive : void 0}
  on:pointerleave={$currentState === INTRO ? setVcardInactive : void 0}
  on:click={$currentState === INTRO ? () => navigate([locale, TARGET_SLUG].join('/')) : void 0}
  castShadow
  receiveShadow
>
  <T.BoxGeometry args={$vcadGeometry} />
  <HTML
    as="article"
    position={[0, 0, 0.05]}
    rotation={ROTATION[$currentState.description]}
    scale={SCALE[$currentState.description]}
    transform
    center
    fullscreen
    pointerEvents={$currentState === INTRO ? 'none' : 'auto'}
    portal={document.body.querySelector('main')}
    zIndexRange={[9999, 0]}
  >
    {#if $currentState === INTRO}
      <Logo {locale} {vcardIsActive} />
    {:else}
      <section class="contentBox" data-layout={$currentState.description}>
        <slot />
      </section>
    {/if}
  </HTML>
  <FakeGlowMaterial glowColor={COLORS.GROW} />
  <T.MeshStandardMaterial color={COLORS.LIGHT} metalness={0.1} roughness={0.5} />
</T.Mesh>
