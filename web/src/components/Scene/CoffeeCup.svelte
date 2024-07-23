<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'

  import { COFFEE, CUP } from './assets'
</script>

<T.Group position={COFFEE.POSITION.DEFAULT} rotation={COFFEE.ROTATION.DEFAULT} scale={COFFEE.SCALE}>
  {#await useGltf('/models/coffee.glb') then cup}
    <T
      is={cup.scene}
      position={CUP.POSITION.DEFAULT}
      rotation={CUP.ROTATION.DEFAULT}
      scale={CUP.SCALE}
      castShadow
      receiveShadow
    />
  {/await}
</T.Group>
