<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { GLASSES } from './assets'
</script>

<T.Group>
  {#await useGltf('/models/glasses.glb') then glasses}
    <T
      is={glasses.scene}
      position={GLASSES.POSITION.DEFAULT}
      rotation={GLASSES.ROTATION.DEFAULT}
      scale={[GLASSES.SCALE, GLASSES.SCALE, GLASSES.SCALE]}
      castShadow
    />
  {/await}
</T.Group>
