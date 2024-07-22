<script>
  import { T } from '@threlte/core'
  import {
    ContactShadows,
    CSM,
    Environment,
    FakeGlowMaterial,
    interactivity
  } from '@threlte/extras'
  import { onMount } from 'svelte'
  import { spring } from 'svelte/motion'
  import { Vector3 } from 'three'
  import { CAMERA, VCARD_POSITION, VCARD_ROTATION } from './assets'

  let vcardScale = spring(1)
  let currentCameraPosition = spring(CAMERA.DEFAULT)
  let currentCameraRotation = [0, 0, 0]

  let vcardPosition = spring(VCARD_POSITION.DEFAULT)
  let vcardRotation = spring(VCARD_ROTATION.DEFAULT)

  const setVcardActive = () => {
    vcardPosition.set(VCARD_POSITION.ACTIVE)
    vcardRotation.set(VCARD_ROTATION.ACTIVE)
    currentCameraPosition.set(CAMERA.VCARD_ACTIVE)
    vcardScale.set(0.95)
  }

  const setVcardInactive = () => {
    vcardPosition.set(VCARD_POSITION.DEFAULT)
    vcardRotation.set(VCARD_ROTATION.DEFAULT)
    currentCameraPosition.set(CAMERA.DEFAULT)
    vcardScale.set(1)
  }

  interactivity()

  onMount(() => {
    document.addEventListener('mousemove', (e) => {
      const k = 2
    })
  })
</script>

<CSM
  enabled
  args={{
    lightDirection: new Vector3(5, -1, 5).normalize()
  }}
>
  <T.Color attach="background" args={['#f0f0f0']} />
  <Environment format="hdr" path="/hdr/" files="aerodynamics_workshop_1k.hdr" />

  <T.PerspectiveCamera
    makeDefault
    position={$currentCameraPosition}
    fov={60}
    near={0.1}
    far={100}
    on:create={({ ref }) => ref.lookAt(0, 0.5, 0)}
    on:update={({ ref }) => ref.lookAt(0, 0.5, 0)}
  />

  <T.AmbientLight intensity={Math.PI / 3} color="#fff" />
  <T.AmbientLight intensity={Math.PI / 2} color="#fefefe" />
  <T.SpotLight decay={0} position={[5, 5, -10]} intensity={0.5} angle={Math.PI / 4} penumbra={1} />
  <T.PointLight decay={0} position={[-10, -10, -10]} />

  <T.DirectionalLight position={[5, 5, 5]} />
  <T.DirectionalLight position={[15, 22, 25]} />

  <ContactShadows scale={50} blur={3} far={1.5} opacity={0.25} />
  <ContactShadows scale={5} blur={10} far={2} opacity={0.15} />
  <ContactShadows scale={10} blur={2} far={5} opacity={0.5} />

  <T.Mesh
    position={$vcardPosition}
    rotation={$vcardRotation}
    scale={$vcardScale}
    on:pointerenter={setVcardActive}
    on:pointerleave={setVcardInactive}
    castShadow
    receiveShadow
  >
    <T.BoxGeometry args={[9, 5, 0.05]} />
    <FakeGlowMaterial glowColor="#efefef" />
    <T.MeshStandardMaterial color="#fff" />
  </T.Mesh>
</CSM>
