<script>
  import { T } from '@threlte/core'
  import { FakeGlowMaterial } from '@threlte/extras'
  import { COLORS } from './assets'
  import { currentState, INTRO } from './state'

  export let vcardPosition
  export let vcardRotation
  export let vcardScale
  export let vcadGeometry

  export let setVcardActive
  export let setVcardInactive
  export let setContentState
</script>

<T.Mesh
  position={$vcardPosition}
  rotation={$vcardRotation}
  scale={$vcardScale}
  on:pointerenter={$currentState === INTRO ? setVcardActive : void 0}
  on:pointerleave={$currentState === INTRO ? setVcardInactive : void 0}
  on:pointerdown={$currentState === INTRO ? setContentState : void 0}
  castShadow
  receiveShadow
>
  <T.BoxGeometry args={$vcadGeometry} />
  <FakeGlowMaterial glowColor={COLORS.GROW} />
  <T.MeshStandardMaterial color={COLORS.LIGHT} />
</T.Mesh>
