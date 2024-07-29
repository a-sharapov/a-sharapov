<script>
  import store from '@lib/shared/store'
  import { T } from '@threlte/core'
  import { createTransition, FakeGlowMaterial, useGltf } from '@threlte/extras'
  import { cubicOut } from 'svelte/easing'
  import { BULB, DESK_LAMP, LIGHT } from './assets'

  let isGlowVisible = true

  const scale = (duration) =>
    createTransition((ref) => {
      return {
        tick(t) {
          t = 0.5 + t * 0.5
          ref.scale.set(t, t, t)
        },
        easing: cubicOut,
        duration
      }
    })

  $: isGlowVisible = $store.theme === Symbol.for('light')
</script>

<T.Group>
  {#await useGltf('/models/desk_lamp.glb') then deskLamp}
    <T
      is={deskLamp.scene}
      position={DESK_LAMP.POSITION.DEFAULT}
      rotation={DESK_LAMP.ROTATION.DEFAULT}
      scale={[DESK_LAMP.SCALE, DESK_LAMP.SCALE * 0.9, DESK_LAMP.SCALE * 0.8]}
      castShadow
      receiveShadow
    />
  {/await}

  {#if isGlowVisible}
    <T.Mesh
      position={BULB.POSITION}
      scale={BULB.SCALE}
      in={scale(1e3)}
      out={scale(2e2)}
      receiveShadow
    >
      <T.SphereGeometry args={BULB.GEOMETRY} />
      <FakeGlowMaterial
        glowColor={LIGHT.LAMP.color}
        glowInternalRadius={BULB.GLOW_RADIUS}
        falloff={BULB.FALLOFF}
      />
    </T.Mesh>
  {/if}
</T.Group>
