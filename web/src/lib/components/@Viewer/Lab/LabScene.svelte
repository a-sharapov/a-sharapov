<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import { onDestroy } from 'svelte';
  import { Color, type DirectionalLight, type Texture } from 'three';
  import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
  import { PMREMGenerator, type WebGPURenderer } from 'three/webgpu';
  import { FLAT_LAYER } from '../Scene/layers';
  import Cup from '../Scene/models/Cup.svelte';
  import PaperPlane from '../Scene/models/PaperPlane.svelte';
  import Pen from '../Scene/models/Pen.svelte';
  import Resume from '../Scene/models/Resume.svelte';
  import Sketchbook from '../Scene/models/Sketchbook.svelte';
  import Tablet from '../Scene/models/Tablet.svelte';
  import { mixMood } from '../Scene/mood';
  import { type Actor, rig } from '../Scene/state.svelte';
  import { createNoiseTexture } from '../Scene/textures';

  interface ILabScene {
    model: string;
  }

  let { model }: ILabScene = $props();

  const _DAY = mixMood(0);
  const _query = new URLSearchParams(location.search);
  const _vec = (key: string, fallback: [number, number, number]) =>
    ((value) =>
      value?.length === 3 && value.every(Number.isFinite)
        ? (value as [number, number, number])
        : fallback)(_query.get(key)?.split(',').map(Number));
  const camera = _vec('cam', [0, 11.3, 35]);
  const look = _vec('look', [0, 3, 0]);
  const yaw = Number(_query.get('yaw') ?? 0.15);
  const spin = _query.get('spin') !== '0';
  const lay = _query.get('lay') === '1';

  let turn = $state(0);
  useTask((delta) => void (spin && (turn += delta * 0.6)));

  const _ACTOR: Record<string, Actor> = {
    cv: 'resume',
    sketchbook: 'sketchbook',
    tablet: 'tablet',
    plane: 'plane',
  };
  const actorProgress = Number(_query.get('actor') ?? 0);
  const face = (_query.get('face') ?? '21,15').split(',').map(Number);
  void (
    _ACTOR[model] &&
    ((rig.actors[_ACTOR[model]!] = Math.min(1, Math.max(0, actorProgress))),
    (rig.stages.plane.face = [face[0], face[1]]))
  );

  const { scene, renderer } = useThrelte();
  const gpu = renderer as unknown as WebGPURenderer;
  const pmrem = new PMREMGenerator(gpu);
  let environment: Texture | null = null;
  void gpu
    .init()
    .then(
      () =>
        void ((environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture),
        (scene.environment = environment))
    );
  scene.environmentIntensity = 0.55;
  scene.background = new Color('#d8d0c2');

  const linen = createNoiseTexture(256, 64, 21);
  linen.repeat.set(10, 6);
  const wood = createNoiseTexture(256, 8, 5);
  wood.repeat.set(1, 12);

  const bind = (light: DirectionalLight) => {
    light.target.position.set(0, 2, 0);
    light.shadow.camera.layers.enable(FLAT_LAYER);
    scene.add(light.target);
  };

  onDestroy(() => {
    [environment, linen, wood].forEach((_) => void _?.dispose());
    pmrem.dispose();
  });
</script>

<T.PerspectiveCamera
  makeDefault
  fov={30}
  position={camera}
  oncreate={(lab) => void lab.layers.enable(FLAT_LAYER)}
>
  <OrbitControls target={look} enableDamping />
</T.PerspectiveCamera>

<T.HemisphereLight args={['#fffaf2', '#cfc6b8', 0.9]} />
<T.DirectionalLight
  position={[-30, 40, 30]}
  intensity={2.2}
  castShadow
  shadow.mapSize={[2048, 2048]}
  shadow.radius={12}
  shadow.blurSamples={20}
  shadow.camera.left={-30}
  shadow.camera.right={30}
  shadow.camera.top={30}
  shadow.camera.bottom={-30}
  oncreate={bind}
/>

<T.Mesh position={[0, 30, -40]} receiveShadow>
  <T.PlaneGeometry args={[220, 80]} />
  <T.MeshStandardMaterial color="#d9cfbf" roughness={1} bumpMap={linen} bumpScale={2} />
</T.Mesh>
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.PlaneGeometry args={[220, 120]} />
  <T.MeshStandardMaterial color="#e3ded6" roughness={0.85} bumpMap={wood} bumpScale={1.2} />
</T.Mesh>

<T.Group rotation.y={turn}>
  {#if model === 'cup'}
    <Cup
      placement={{ position: [0, 0, 0], yaw }}
      steamOpacity={0.55}
      steamColor={new Color('#ffffff')}
      mood={_DAY}
    />
  {:else if model === 'plane'}
    <PaperPlane placement={{ position: [0, 0, 0], yaw }} />
  {:else if model === 'tablet'}
    <Tablet placement={{ position: [0, 0, 0], yaw }} />
  {:else if model === 'cv'}
    <Resume placement={{ position: [0, 0, 0], yaw }} />
  {:else if model === 'sketchbook'}
    <Sketchbook placement={{ position: [0, 0, 0], yaw }} />
  {:else if model === 'pen'}
    <T.Group rotation.z={lay ? Math.PI / 2 : 0} position={lay ? [7, 0.43, 0] : [0, 0, 0]}>
      <Pen />
    </T.Group>
  {/if}
</T.Group>
