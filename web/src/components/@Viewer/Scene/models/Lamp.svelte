<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { Color, type Mesh, Quaternion, type SpotLight, Vector3 } from 'three';
  import {
    max,
    mix,
    normalView,
    positionLocal,
    positionViewDirection,
    pow,
    smoothstep,
    uniform,
    vec3,
  } from 'three/tsl';
  import { MeshStandardNodeMaterial } from 'three/webgpu';
  import type { XYZ } from '$lib/common/types';
  import { computeLampRig, LAMP_DIMENSIONS } from '../lamp-rig';
  import { LAMP } from '../layout';
  import type { MixedMood } from '../mood';
  import { pcssFilter } from '../soft-shadows';
  import { rig } from '../state.svelte';
  import { LAMP_LIGHT } from '../volumetric';
  import { OAK, PLATINUM, useGrain, useWood, WHITE_PAINT } from './materials.svelte';
  import { latheFrom, MM, parseSvg } from './svg';
  import source from './svg/lamp.svg?raw';

  interface ILamp {
    mood: MixedMood;
    shadows: boolean;
  }

  let { mood, shadows }: ILamp = $props();

  const { scene } = useThrelte();

  const paths = parseSvg(source);
  const geometry = {
    base: latheFrom(paths.base, { baseline: 12, segments: 72 }),
    pad: latheFrom(paths.pad, { baseline: 0.8, segments: 48 }),
    bezel: latheFrom(paths.bezel, {
      baseline: 1.2,
      segments: 32,
      divisions: 3,
    }),
    button: latheFrom(paths.button, {
      baseline: 1.8,
      segments: 32,
      divisions: 3,
    }),
    collar: latheFrom(paths.collar, { baseline: 6, segments: 32 }),
    stem: latheFrom(paths.stem, { baseline: 90, segments: 32 }),
    joint: latheFrom(paths.joint, { baseline: 14, segments: 32 }).translate(0, -0.7, 0),
    knob: latheFrom(paths.knob, { baseline: 6, segments: 24 }),
    arm: latheFrom(paths.arm, { baseline: 270, segments: 16 }),
    grip: latheFrom(paths.grip, { baseline: 36, segments: 24 }),
    shade: latheFrom(paths.shade, { baseline: 63, segments: 72 }).translate(0, -6.3, 0),
    reflector: latheFrom(paths.reflector, {
      baseline: 63,
      segments: 72,
    }).translate(0, -6.3, 0),
    cap: latheFrom(paths.cap, { baseline: 5, segments: 48 }),
    bulb: latheFrom(paths.bulb, { baseline: 30, segments: 32 }).translate(0, -4.4, 0),
  };

  const _Y = new Vector3(0, 1, 0);
  const _xyz = (v: Vector3) => v.toArray() as XYZ;
  const _quat = (q: Quaternion): [number, number, number, number] => [q.x, q.y, q.z, q.w];

  const lamp = computeLampRig();
  const { yaw, joint: _JOINT, armStart } = lamp;
  const _world = lamp.world;
  const armQuaternion = yaw
    .clone()
    .multiply(new Quaternion().setFromUnitVectors(_Y, lamp.armDirection));
  const jointQuaternion = yaw
    .clone()
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));

  const shadeOrigin = lamp.shade;
  const shadeQuaternion = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), lamp.aim);
  const bulbPosition = lamp.bulb;

  const grain = useGrain(3);
  const wood = {
    stem: useWood(geometry.stem),
    knob: useWood(geometry.knob),
    grip: useWood(geometry.grip),
    cap: useWood(geometry.cap),
    button: useWood(geometry.button),
  };

  const buttonPosition: XYZ = [LAMP.button[0], LAMP_DIMENSIONS.baseHeight - 0.02, LAMP.button[2]];

  const _PRESS = 0.08;
  let button = $state<Mesh>();
  useTask('lamp-button', () => void (button && (button.position.y = -_PRESS * rig.lamp.press)));

  const _EMBER = new Color('#ff7a3c');
  const _FILAMENT = new Color('#fff1da');
  const bulbTint = uniform(new Color('#fff1da'));
  const bulbGlow = uniform(1);
  const bulbMaterial = new MeshStandardNodeMaterial({
    color: '#f6f2ec',
    roughness: 0.35,
  });
  bulbMaterial.emissiveNode = bulbTint
    .mul(bulbGlow)
    .mul(
      mix(
        vec3(1, 0.84, 0.62).mul(0.45),
        vec3(1),
        pow(max(normalView.dot(positionViewDirection).saturate(), 1e-4), 1.2)
      )
    );

  geometry.reflector.computeBoundingBox();
  const { min: _glowFrom, max: _glowTo } = geometry.reflector.boundingBox!;
  const shadeGlow = uniform(1);
  const shadeColor = uniform(new Color('#ffe2c4'));
  const reflectorMaterial = new MeshStandardNodeMaterial({
    color: '#f3eee6',
    roughness: 0.7,
    envMapIntensity: 0.25,
  });
  reflectorMaterial.emissiveNode = shadeColor
    .mul(shadeGlow)
    .mul(mix(0.2, 1, pow(max(smoothstep(_glowFrom.y, _glowTo.y, positionLocal.y), 1e-4), 0.8)));

  $effect(() => {
    bulbGlow.value = mood.bulb;
    bulbTint.value.copy(_EMBER).lerp(_FILAMENT, Math.sqrt(mood.filament));
    shadeColor.value.copy(mood.colors.lamp);
    shadeGlow.value = mood.shadeGlow * 0.9;
    lampOn.value = mood.lamp;
  });

  const lampOn = uniform(0);
  const lampShadow = pcssFilter({
    lightSize: 66,
    perspective: true,
    active: lampOn,
  });

  onDestroy(() => {
    bulbMaterial.dispose();
    reflectorMaterial.dispose();
  });

  const bindTarget = (light: SpotLight) => {
    light.target.position.set(...LAMP.target);
    scene.add(light.target);
    return () => void scene.remove(light.target);
  };
</script>

<T.Group name="lamp">
  <T.Group position={LAMP.base} quaternion={_quat(yaw)}>
    <T.Mesh geometry={geometry.base} castShadow receiveShadow>
      <T.MeshPhysicalMaterial {...WHITE_PAINT} bumpMap={grain} />
    </T.Mesh>
    <T.Mesh geometry={geometry.pad}>
      <T.MeshStandardMaterial color="#1e1e20" roughness={0.9} />
    </T.Mesh>
    <T.Mesh geometry={geometry.collar} position.y={12 * MM} castShadow>
      <T.MeshPhysicalMaterial {...WHITE_PAINT} />
    </T.Mesh>
    <T.Mesh geometry={geometry.stem} position.y={12 * MM} castShadow receiveShadow>
      <T.MeshStandardMaterial {...OAK} map={wood.stem} bumpMap={wood.stem} />
    </T.Mesh>
  </T.Group>

  <T.Group name="lampButton" position={buttonPosition}>
    <T.Mesh geometry={geometry.bezel} castShadow receiveShadow>
      <T.MeshPhysicalMaterial {...PLATINUM} />
    </T.Mesh>
    <T.Mesh geometry={geometry.button} bind:ref={button} castShadow receiveShadow>
      <T.MeshStandardMaterial {...OAK} map={wood.button} bumpMap={wood.button} />
    </T.Mesh>
  </T.Group>

  <T.Mesh
    geometry={geometry.joint}
    position={_xyz(_world(_JOINT))}
    quaternion={_quat(jointQuaternion)}
    castShadow
  >
    <T.MeshPhysicalMaterial {...WHITE_PAINT} />
  </T.Mesh>
  <T.Mesh
    geometry={geometry.knob}
    position={_xyz(_world(_JOINT.clone().add(new Vector3(0, 0, 0.7))))}
    quaternion={_quat(jointQuaternion)}
    castShadow
  >
    <T.MeshStandardMaterial {...OAK} map={wood.knob} bumpMap={wood.knob} />
  </T.Mesh>
  <T.Mesh
    geometry={geometry.arm}
    position={_xyz(_world(armStart))}
    quaternion={_quat(armQuaternion)}
    castShadow
  >
    <T.MeshPhysicalMaterial {...WHITE_PAINT} />
  </T.Mesh>
  <T.Mesh
    geometry={geometry.grip}
    position={_xyz(_world(armStart))}
    quaternion={_quat(armQuaternion)}
    castShadow
  >
    <T.MeshStandardMaterial {...OAK} map={wood.grip} bumpMap={wood.grip} />
  </T.Mesh>

  <T.Group position={_xyz(shadeOrigin)} quaternion={_quat(shadeQuaternion)}>
    <T.Mesh geometry={geometry.shade} castShadow>
      <T.MeshPhysicalMaterial {...WHITE_PAINT} bumpMap={grain} />
    </T.Mesh>
    <T.Mesh geometry={geometry.reflector} material={reflectorMaterial} />
    <T.Mesh geometry={geometry.cap} castShadow>
      <T.MeshStandardMaterial {...OAK} map={wood.cap} bumpMap={wood.cap} />
    </T.Mesh>
    <T.Mesh geometry={geometry.bulb} material={bulbMaterial} />
  </T.Group>
</T.Group>

<T.SpotLight
  name={LAMP_LIGHT}
  position={_xyz(bulbPosition)}
  color={mood.colors.lamp}
  intensity={540 * mood.lamp}
  angle={0.9}
  penumbra={1}
  decay={2}
  distance={0}
  castShadow={shadows}
  shadow.mapSize={[1024, 1024]}
  shadow.filterNode={lampShadow}
  shadow.bias={-0.0004}
  shadow.normalBias={0.02}
  shadow.camera.near={1}
  shadow.camera.far={120}
  oncreate={bindTarget}
/>
<T.PointLight
  position={_xyz(bulbPosition)}
  color={mood.colors.lamp}
  intensity={18 * mood.lamp}
  decay={2}
  distance={24}
/>
