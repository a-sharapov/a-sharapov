<script>
  import store from '@lib/shared/store'
  import { T, useTask } from '@threlte/core'
  import { writable } from 'svelte/store'
  import * as THREE from 'three'
  import { fragmentShader, vertexShader } from './shaders'

  const COLORS = [new THREE.Color(1, 1, 1), new THREE.Color(0.6, 0.6, 0.6)]

  let shader
  let timer = writable(0)
  let dustColor = writable(COLORS[1])

  const particleCount = 5e2
  const particles = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    particles[i * 3 + 0] = (Math.random() - 0.5) * 10
    particles[i * 3 + 1] = (Math.random() - 0.5) * 10
    particles[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3))

  $: {
    let currentIndex = +($store.theme === Symbol.for('light'))
    dustColor.set(COLORS[currentIndex])
  }

  useTask('dust', (delta) => requestAnimationFrame(() => timer.update((t) => t + delta * 0.5)))
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
      },
      color: {
        value: COLORS[1]
      }
    }}
    uniforms.time.value={$timer}
    uniforms.color.value={$dustColor}
  />
</T.Points>
