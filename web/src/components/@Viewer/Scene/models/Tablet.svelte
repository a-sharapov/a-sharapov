<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { type BufferGeometry, Color, type Group } from 'three';
  import { float, min, mix, positionGeometry, uniform, vec2 } from 'three/tsl';
  import { MeshPhysicalNodeMaterial } from 'three/webgpu';
  import { clamp } from '$lib/common/utils';
  import { feedback, framed } from '../feedback';
  import { flatOnly } from '../layers';
  import type { Placement } from '../layout';
  import { MOODS } from '../mood';
  import { rig } from '../state.svelte';
  import { PLATINUM } from './materials.svelte';
  import { extrudeFrom, MM, parseSvg } from './svg';
  import source from './svg/tablet.svg?raw';

  interface ITablet {
    placement: Placement;
    screenColor?: Color;
  }

  let { placement, screenColor = new Color(MOODS.day.colors.screen) }: ITablet = $props();

  let root = $state.raw<Group>();
  $effect(() => void (root && flatOnly(root)));

  const paths = parseSvg(source);
  const _BODY = 5.4;
  const _GLASS = 0.6;
  const _flat = (geometry: BufferGeometry) => geometry.rotateX(-Math.PI / 2);
  const _onGlass = (id: string, depth: number) =>
    _flat(extrudeFrom(paths[id]!, { depth, curveSegments: 24 })).translate(
      0,
      (_BODY + _GLASS - 0.02) * MM,
      0
    );

  const body = _flat(
    extrudeFrom(paths.body!, {
      depth: _BODY,
      bevel: 1.5,
      bevelSegments: 6,
      curveSegments: 24,
    })
  );
  const glass = _flat(
    extrudeFrom(paths.glass!, {
      depth: _GLASS,
      bevel: 0.25,
      bevelSegments: 2,
      curveSegments: 24,
    })
  ).translate(0, (_BODY - 0.02) * MM, 0);
  const display = _onGlass('display', 0.05);
  const camera = _onGlass('camera', 0.05);
  const lens = _onGlass('lens', 0.08);

  const screen = new MeshPhysicalNodeMaterial({
    color: '#07090c',
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  const _bounds = (display.computeBoundingBox(), display.boundingBox!);
  const _ratio = (_bounds.max.x - _bounds.min.x) / (_bounds.max.z - _bounds.min.z);
  const _frameUv = vec2(
    positionGeometry.x.sub(_bounds.min.x).div(_bounds.max.x - _bounds.min.x),
    float(_bounds.max.z)
      .sub(positionGeometry.z)
      .div(_bounds.max.z - _bounds.min.z)
  )
    .sub(0.5)
    .mul(vec2(min(1, float(_ratio).div(feedback.aspect)), min(1, feedback.aspect.div(_ratio))))
    .add(0.5);
  const glowColor = uniform(new Color());
  const glow = uniform(0);
  const recursion = uniform(0);
  screen.emissiveNode = mix(glowColor, framed(_frameUv), recursion).mul(glow);
  const _GLOW = 1.02;
  const _step = (lo: number, hi: number, x: number) =>
    ((t) => t * t * (3 - 2 * t))(clamp((x - lo) / (hi - lo)));

  useTask('tablet-screen', () =>
    ((p) =>
      ((lit) =>
        void (glowColor.value.copy(screenColor),
        (glow.value = _GLOW * (0.1 * _step(0.45, 0.6, p) + 0.9 * lit)),
        (recursion.value = feedback.recursive ? 1 : 0),
        Object.assign(screen, {
          roughness: 0.12 + 0.43 * lit,
          clearcoat: 1 - 0.85 * lit,
          clearcoatRoughness: 0.05 + 0.4 * lit,
        })))(_step(0.68, 0.97, p)))(rig.actors.tablet)
  );

  onDestroy(() => screen.dispose());
</script>

<T.Group name="tablet" bind:ref={root} position={placement.position} rotation.y={placement.yaw}>
  <T.Mesh geometry={body} castShadow>
    <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.55} />
  </T.Mesh>
  <T.Mesh geometry={glass} castShadow receiveShadow>
    <T.MeshPhysicalMaterial
      color="#0d0e11"
      roughness={0.08}
      clearcoat={1}
      clearcoatRoughness={0.04}
    />
  </T.Mesh>
  <T.Mesh geometry={display} material={screen} receiveShadow />
  <T.Mesh geometry={camera}> <T.MeshStandardMaterial color="#1b1c20" roughness={0.3} /> </T.Mesh>
  <T.Mesh geometry={lens}>
    <T.MeshPhysicalMaterial color="#020203" roughness={0.05} clearcoat={1} />
  </T.Mesh>
</T.Group>
