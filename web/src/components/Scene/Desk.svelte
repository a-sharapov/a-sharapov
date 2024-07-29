<script>
  import { T } from '@threlte/core'
  import { COLORS } from './assets'

  const DESK_SIZE = [1e2, 64]
  const DESK_POSITION = [0, -0.1, 0]
  const rotationX = -Math.PI / 2
</script>

<T.Mesh rotation.x={rotationX} position={DESK_POSITION} receiveShadow>
  <T.CircleGeometry args={DESK_SIZE} />
  <T.MeshStandardMaterial color={COLORS.LIGHT} metalness={0} roughness={1} />
</T.Mesh>
