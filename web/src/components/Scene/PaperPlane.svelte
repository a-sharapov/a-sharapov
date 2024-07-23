<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { PAPER_PLANE } from './assets'
</script>

{#await useGltf('/models/paper_plane.glb') then paperPlane}
  <T
    is={paperPlane.scene}
    position={PAPER_PLANE.POSITION.DEFAULT}
    rotation={PAPER_PLANE.ROTATION.DEFAULT}
    scale={[PAPER_PLANE.SCALE, PAPER_PLANE.SCALE, PAPER_PLANE.SCALE * 0.55]}
    castShadow
    receiveShadow
  />
{/await}
