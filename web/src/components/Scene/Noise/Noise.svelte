<script>
  import { T } from '@threlte/core'
  import * as THREE from 'three'
  import { fragmentShader, vertexShader } from './shaders'
</script>

<T.ShaderMaterial
  {vertexShader}
  {fragmentShader}
  uniforms={{
    time: { value: 0 },
    color: { value: new THREE.Color(0xfefefe) }
  }}
/>
