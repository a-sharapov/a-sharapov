import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const COLORS = {
  BACKGROUND: new THREE.Color(0xcfcfcf),
  FLOOR: new THREE.Color(0xffffff),
  LIGHT: new THREE.Color(0xffffff),
  FOG: new THREE.Color(0xcccccc),
  VCARD: new THREE.Color(0xefefef)
}
const ASSETS = {}

export var initScene = (window, id) => {
  const loadingManager = new THREE.LoadingManager()

  loadingManager.onStart = () => {
    document.getElementById(id).style.display = 'none'
  }
  loadingManager.onLoad = () => {
    document.getElementById(id).style.display = 'block'
  }
  loadingManager.onProgress = () => {}

  const { innerWidth: width, innerHeight: height } = window
  let cursor = {
    x: 0,
    y: 0
  }
  const center = new THREE.Vector3(0, 0, 0)

  const scene = new THREE.Scene({
    antialias: true
  })

  scene.background = COLORS.BACKGROUND

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshPhysicalMaterial({
      color: COLORS.BACKGROUND,
      wireframe: false,
      metalness: 0,
      roughness: 0.1,
      side: THREE.DoubleSide,
      flatShading: true,
      transparent: false
    })
  )
  floor.receiveShadow = true
  floor.position.set(0, 0, 0)
  floor.rotation.x = -Math.PI * 0.5
  scene.add(floor)

  const ambientLight = new THREE.HemisphereLight(COLORS.LIGHT, COLORS.LIGHT, 0.6)
  ambientLight.position.set(0, 50, 0)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(COLORS.LIGHT, 3)
  directionalLight.position.set(15, 15, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  scene.add(directionalLight)

  const fog = new THREE.FogExp2(COLORS.FOG, 0.2)
  scene.fog = fog

  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  const group = new THREE.Group()

  const loader = new GLTFLoader()

  const vcard = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 1.25, 0.01),
    new THREE.MeshMatcapMaterial({
      color: COLORS.VCARD,
      wireframe: false,
      roughness: 0.5,
      metalness: 0.5,
      receiveShadow: true
    })
  )
  vcard.position.set(0, 0.625, 0)

  // cube.rotation.x = Math.PI * 0.25
  // cube.rotation.y = Math.PI * 0.25

  // cube.rotation.redorder('YXZ')

  group.add(vcard)

  scene.add(group)

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 0.75, 5)
  scene.add(camera)

  camera.lookAt(vcard.position)

  const renderer = new THREE.WebGLRenderer()

  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const canvas = document.body.appendChild(renderer.domElement)
  canvas.setAttribute('id', id)

  const raycaster = new THREE.Raycaster()
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  const tick = (time) => {
    controls.update()
    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(tick)

  const handleClick = (event) => {
    const pointer = new THREE.Vector2()
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(pointer, camera)

    const intersects = raycaster.intersectObject(group.children)

    intersects.forEach((intersect) => {
      intersect.object.name === 'vcard' && intersect.object.material.color.set(0xff0000)
    })
  }

  window.addEventListener('click', handleClick)

  window.addEventListener('resize', (event) => {
    const { innerWidth: width, innerHeight: height } = event.target
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.render(scene, camera)
  })

  window.addEventListener('dblclick', (event) =>
    !!document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen()
  )

  return { scene, camera, renderer }
}
