<script>
  import { T, useThrelte } from '@threlte/core'
  import { ContactShadows, Environment, interactivity } from '@threlte/extras'
  import { onMount } from 'svelte'
  import { cubicOut, expoIn } from 'svelte/easing'
  import { spring, tweened } from 'svelte/motion'
  import { CAMERA, COLORS, PAPER, VCARD } from './assets'
  import CoffeeCup from './CoffeeCup.svelte'
  import Desk from './Desk.svelte'
  import DeskLamp from './DeskLamp.svelte'
  import Dust from './Dust/Dust.svelte'
  import PaperPlane from './PaperPlane.svelte'
  import PenHolder from './PenHolder.svelte'
  import { currentState, INTRO, LANDSCAPE, PORTRAIT } from './state'
  import VCard from './VCard.svelte'

  const { scene, camera, renderer, invalidate } = useThrelte()
  renderer.antialias = true

  let vcardScale = spring(1)
  let vcadGeometry = spring(VCARD.GEOMETRY)
  let zoom = tweened(1, {
    duration: 2e3,
    easing: cubicOut
  })
  let currentCameraPosition = tweened(CAMERA.POSITION.DEFAULT, {
    duration: 1e3,
    easing: cubicOut
  })
  let currentCameraPov = tweened(CAMERA.LOOK_AT.DEFAULT, {
    duration: 15e2,
    easing: expoIn
  })

  let vcardPosition = spring(VCARD.POSITION.DEFAULT)
  let vcardRotation = spring(VCARD.ROTATION.DEFAULT)

  const setVcardActive = () => {
    vcardPosition.set(VCARD.POSITION.ACTIVE)
    vcardRotation.set(VCARD.ROTATION.ACTIVE)
    currentCameraPosition.set(CAMERA.POSITION.VCARD_ACTIVE)
    vcardScale.set(VCARD.SCALE * 0.9)
    zoom.set(1.3)
  }

  const setVcardInactive = () => {
    vcardPosition.set(VCARD.POSITION.DEFAULT)
    vcardRotation.set(VCARD.ROTATION.DEFAULT)
    currentCameraPosition.set(CAMERA.POSITION.DEFAULT)
    vcardScale.set(VCARD.SCALE)
    zoom.set(1)
  }

  const setContentState = () => currentState.set(LANDSCAPE)

  interactivity()

  let sceneRotation = 0
  onMount(() => {
    currentCameraPov.subscribe((pov) => void $camera.lookAt(...pov))

    document.addEventListener('mousemove', (e) => {
      const movementOffset = (window.innerWidth / 2 - e.clientX) / window.innerWidth
      $currentState === INTRO && (sceneRotation = movementOffset * 0.2)
    })

    window.addEventListener('resize', () => {
      $camera.aspect = window.innerWidth / window.innerHeight
      $camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    })

    currentState.subscribe((state) => {
      zoom.set(1)
      sceneRotation = 0

      switch (state) {
        case INTRO:
          vcadGeometry.set(VCARD.GEOMETRY)
          vcardPosition.set(VCARD.POSITION.DEFAULT)
          vcardRotation.set(VCARD.ROTATION.DEFAULT)
          currentCameraPosition.set(CAMERA.POSITION.DEFAULT)
          currentCameraPov.set(CAMERA.LOOK_AT.VCARD_ACTIVE)
          zoom.set(1)
          break
        case PORTRAIT:
          vcadGeometry.set(PAPER.GEOMETRY)
          vcardPosition.set(PAPER.POSITION.DEFAULT)
          vcardRotation.set(PAPER.ROTATION.DEFAULT)
          currentCameraPosition.set(CAMERA.POSITION.PORTRAIT)
          currentCameraPov.set(CAMERA.LOOK_AT.PORTRAIT)
          zoom.set(2)
          break
        case LANDSCAPE:
          vcadGeometry.set(PAPER.GEOMETRY)
          vcardPosition.set(PAPER.POSITION.DEFAULT)
          vcardRotation.set(PAPER.ROTATION.LANDSCAPE)
          currentCameraPosition.set(CAMERA.POSITION.LANDSCAPE)
          currentCameraPov.set(CAMERA.LOOK_AT.LANDSCAPE)
          zoom.set(2)
          break
        default:
          currentCameraPov.set(CAMERA.LOOK_AT.DEFAULT)
          zoom.set(1)
          break
      }

      invalidate()
    })
  })
</script>

<T.Color attach="background" args={[COLORS.BG]} />
<Environment format="hdr" path="/hdr/" files="aerodynamics_workshop_1k.hdr" />

<T.PerspectiveCamera
  makeDefault
  position={$currentCameraPosition}
  fov={CAMERA.FOV}
  zoom={$zoom}
  near={CAMERA.NEAR}
  far={CAMERA.FAR}
  on:create={({ ref }) => ref.lookAt(...CAMERA.LOOK_AT.DEFAULT)}
/>

<T.AmbientLight intensity={Math.PI / 3} color={COLORS.LIGHT} />
<T.AmbientLight intensity={Math.PI / 2} color={COLORS.GROW} />
<T.SpotLight decay={0} position={[5, 5, -10]} intensity={0.5} angle={Math.PI / 4} penumbra={1} />
<T.PointLight decay={0} position={[-10, -10, -10]} />

<T.DirectionalLight position={[5, 5, 5]} color={COLORS.GROW} />
<T.DirectionalLight position={[15, 22, 25]} color={COLORS.LIGHT} />

<ContactShadows scale={50} blur={3} far={1.5} opacity={0.25} color={COLORS.GROW} />
<ContactShadows scale={5} blur={10} far={2} opacity={0.15} color={COLORS.GRAY} />
<ContactShadows scale={10} blur={2} far={5} opacity={0.5} color={COLORS.BG} />

<Dust />
<T.Group position={[0, 0, 0]} rotation.y={sceneRotation}>
  <VCard
    {vcardPosition}
    {vcardRotation}
    {vcardScale}
    {vcadGeometry}
    {setVcardActive}
    {setVcardInactive}
    {setContentState}
  />

  <CoffeeCup />
  <PenHolder />
  <PaperPlane />
  <DeskLamp />

  <Desk />
</T.Group>
