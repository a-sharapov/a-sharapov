<script>
  import { T, useTask } from '@threlte/core'
  import { writable } from 'svelte/store'
  import * as THREE from 'three'
  import { fragmentShader, vertexShader } from './shaders'

  const textureLoader = new THREE.TextureLoader()
  const STEAM_POSITION = [-0.3, 5.5, 0]

  let uTimer = writable(0)
  let shader

  const geometry = new THREE.PlaneGeometry(1, 1, 16, 64)
  geometry.translate(0, 0.5, 0)
  geometry.scale(1.5, 3, 1.5)
  geometry.computeVertexNormals()

  const texture = textureLoader.load('/images/noise.png')
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  useTask('steam', (delta) => requestAnimationFrame(() => uTimer.update((t) => t + delta * 0.9)))
</script>

<T.Mesh {geometry} position={STEAM_POSITION} rotation={[0, 0, 0]} scale={4}>
  <T.ShaderMaterial
    bind:ref={shader}
    {fragmentShader}
    {vertexShader}
    side={THREE.DoubleSide}
    transparent={true}
    depthWrite={false}
    uniforms={{
      uTime: {
        value: 1.21
      },
      uPerlinTexture: {
        value: texture
      }
    }}
    uniforms.uTime.value={$uTimer}
  />
</T.Mesh>
