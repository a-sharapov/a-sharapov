<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { Color, type Group, Matrix4, Quaternion, Vector2, Vector3 } from 'three';
  import { color, mix, texture as textureNode, uniform, uv, vec2, vec4 } from 'three/tsl';
  import { MeshPhysicalNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
  import { flatOnly } from '../layers';
  import type { Placement } from '../layout';
  import { createSag, createSagUniforms, sagNode, sliceGeometry, stepSag } from '../paper-bend';
  import { rig } from '../state.svelte';
  import { createCvTexture } from '../textures';
  import { PAPER, PLATINUM, useGrain } from './materials.svelte';
  import { extrudeFrom, MM, parseSvg, sweepFrom } from './svg';
  import source from './svg/cv.svg?raw';

  interface IResume {
    placement: Placement;
  }

  let { placement }: IResume = $props();

  let root = $state.raw<Group>();
  $effect(() => void (root && flatOnly(root)));

  const paths = parseSvg(source);
  const _SHEET = 0.1;
  const _STEP = 0.12;
  const _WIRE: [number, number] = [0.5, 0.3];
  const _CLIP: [number, number] = [94, -152];
  const _CLIP_TINT = '#8d8b87';
  const _SHEETS = 4;
  const _HALF: [number, number] = [(210 * MM) / 2, (297 * MM) / 2];
  const _SLICE = 1;

  const sheet = sliceGeometry(
    extrudeFrom(paths.sheet!, { depth: _SHEET }).rotateX(-Math.PI / 2),
    2,
    _SLICE
  );
  const _sheetY = (i: number) => (_WIRE[1] * 2 + i * _STEP) * MM;

  const _top = _WIRE[1] * 2 + (_SHEETS - 1) * _STEP + _SHEET + _WIRE[1];
  const _bottom = _WIRE[1];
  const clip = sweepFrom(paths.clip!, {
    radius: _WIRE,
    segments: 420,
    radial: 16,
    lift: (t, { 0: x, 1: y }) =>
      x < 2.4
        ? _bottom + (_top - _bottom) * Math.min(1, Math.max(0, (y - 0.5) / 5.5))
        : t < 0.465
          ? _top
          : _bottom,
  })
    .applyMatrix4(new Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1))
    .translate(_CLIP[0] * MM, 0, _CLIP[1] * MM);

  const bend = createSagUniforms();
  const bent = sagNode(bend, _HALF[1]);

  const page = Object.assign(createCvTexture(), { flipY: false });
  const grain = useGrain(0.04, 17);
  const blank = uniform(0);
  const topMaterial = Object.assign(new MeshStandardNodeMaterial(), {
    roughness: PAPER.roughness,
    bumpMap: grain,
    bumpScale: PAPER.bumpScale,
    positionNode: bent,
  });
  topMaterial.colorNode = mix(
    textureNode(
      page,
      uv()
        .mul(vec2(1 / 210, 1 / 297))
        .add(0.5)
    ),
    vec4(color(new Color(PAPER.color)), 1),
    blank
  );
  const paperMaterial = Object.assign(new MeshStandardNodeMaterial(PAPER), {
    bumpMap: grain,
    positionNode: bent,
  });
  const wireMaterial = Object.assign(
    new MeshPhysicalNodeMaterial({ ...PLATINUM, color: _CLIP_TINT }),
    {
      positionNode: bent,
    }
  );

  const sag = createSag();
  const world = new Vector3();
  const last = new Vector3();
  const motion = new Vector3();
  const turn = new Quaternion();
  const lead = new Vector2();
  const heading = new Vector2();
  let seen = false;

  const _drive = (delta: number, group: Group) => (
    group.updateWorldMatrix(true, false),
    group.getWorldPosition(world),
    group.getWorldQuaternion(turn),
    motion
      .subVectors(world, last)
      .divideScalar(seen ? Math.max(delta, 1e-4) : Number.POSITIVE_INFINITY)
      .applyQuaternion(turn.invert()),
    last.copy(world),
    (seen = true),
    lead.set(motion.x, motion.z),
    stepSag(
      sag,
      delta,
      world.y,
      Math.max(0, world.y),
      heading.copy(lead).normalize(),
      lead.length()
    ),
    (bend.droop.value = sag.droop.value),
    (bend.curl.value = sag.curl.value),
    bend.lead.value.copy(sag.lead),
    (bend.reach.value = Math.abs(sag.lead.x) * _HALF[0] + Math.abs(sag.lead.y) * _HALF[1]),
    sag.active && (rig.shadowsDirty = true)
  );

  useTask('resume-page', (delta) => {
    blank.value = rig.actors.resume;
    void (root && _drive(delta, root));
  });

  onDestroy(() => {
    sheet.dispose();
    clip.dispose();
    page.dispose();
    topMaterial.dispose();
    paperMaterial.dispose();
    wireMaterial.dispose();
  });
</script>

<T.Group name="resume" bind:ref={root} position={placement.position} rotation.y={placement.yaw}>
  {#each Array.from({ length: _SHEETS }) as _, i (i)}
    <T.Mesh
      geometry={sheet}
      material={i === _SHEETS - 1 ? topMaterial : paperMaterial}
      position.y={_sheetY(i)}
      castShadow
      receiveShadow
    />
  {/each}
  <T.Mesh geometry={clip} material={wireMaterial} castShadow receiveShadow />
</T.Group>
