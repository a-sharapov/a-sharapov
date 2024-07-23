<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { PEN_COMPOSITION, PEN_HOLDER, PENCIL } from './assets'
</script>

<T.Group
  position={PEN_COMPOSITION.POSITION.DEFAULT}
  rotation={PEN_COMPOSITION.ROTATION.DEFAULT}
  scale={PEN_COMPOSITION.SCALE}
>
  {#await useGltf('/models/pen_holder.glb') then penHolder}
    <T
      is={penHolder.scene}
      position={PEN_HOLDER.POSITION.DEFAULT}
      rotation={PEN_HOLDER.ROTATION.DEFAULT}
      scale={PEN_HOLDER.SCALE}
      castShadow
      receiveShadow
    />
  {/await}
  {#await useGltf('/models/pencil.glb') then pencil}
    <T
      is={pencil.scene}
      position={PENCIL.POSITION.DEFAULT}
      rotation={PENCIL.ROTATION.DEFAULT}
      scale={PENCIL.SCALE}
      castShadow
      receiveShadow
    />
  {/await}
</T.Group>
