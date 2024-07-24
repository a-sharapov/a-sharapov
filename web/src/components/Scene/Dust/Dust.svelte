<script>
  import { T, useTask } from '@threlte/core'
  import { writable } from 'svelte/store'
  import * as THREE from 'three'
  import { fragmentShader, vertexShader } from './shaders'

  let shader
  let timer = writable(0)

  const particleCount = 5e2
  const particles = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    particles[i * 3 + 0] = (Math.random() - 0.5) * 10
    particles[i * 3 + 1] = (Math.random() - 0.5) * 10
    particles[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3))

  useTask('dust', (delta) => requestAnimationFrame(() => timer.update((t) => t + delta * 0.2)))
</script>

<T.Points {geometry} scale={5}>
  <T.ShaderMaterial
    bind:ref={shader}
    {fragmentShader}
    {vertexShader}
    transparent={true}
    uniforms={{
      time: {
        value: 0
      }
    }}
    uniforms.time.value={$timer}
  />
</T.Points>
