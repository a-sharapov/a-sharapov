<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'

  import { DESK_LAMP } from './assets'
</script>

{#await useGltf('/models/desk_lamp.glb') then deskLamp}
  <T
    is={deskLamp.scene}
    position={DESK_LAMP.POSITION.DEFAULT}
    rotation={DESK_LAMP.ROTATION.DEFAULT}
    scale={[DESK_LAMP.SCALE, DESK_LAMP.SCALE * 0.9, DESK_LAMP.SCALE * 0.8]}
    castShadow
  />
{/await}
