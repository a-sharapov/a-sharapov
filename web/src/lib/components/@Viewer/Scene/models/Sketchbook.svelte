<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { type BufferGeometry, Color, Group, type Material, Matrix4, Mesh } from 'three';
  import {
    bumpMap,
    color,
    float,
    mix,
    positionLocal,
    texture as textureNode,
    uniform,
    vec2,
    vec4,
  } from 'three/tsl';
  import { MeshPhysicalNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
  import { idleWhenSettled } from '../idle.svelte';
  import { flatOnly } from '../layers';
  import type { Placement } from '../layout';
  import {
    createFlex,
    createFlexUniforms,
    createFrameUniforms,
    flexInFrameNode,
    flexNode,
    setFrame,
    stepFlex,
  } from '../paper-bend';
  import { pageSurface } from '../sketches/page-surface';
  import { createSketchPageTexture, sketchPagePainter } from '../sketches/page-textures';
  import { SKETCH_PAPER } from '../sketches/pages';
  import { SKETCH_TIMELINE } from '../staging';
  import { rig } from '../state.svelte';
  import { createLinenTexture, createPageEdgeTexture } from '../textures';
  import { geometryOf } from './geometry-jobs';
  import { PAPER, useGrain } from './materials.svelte';
  import { BLOCK, PAGE_HEIGHT, SPINE_WIDTH } from './sketchbook-geometry';
  import {
    ELASTIC_ANCHOR,
    foldSketchbook,
    HINGE,
    type SketchbookPose,
    smoothstep,
  } from './sketchbook-rig';
  import { MM } from './svg';

  interface ISketchbook {
    placement: Placement;
  }

  let { placement }: ISketchbook = $props();

  let root = $state.raw<Group>();
  $effect(() => void (root && flatOnly(root)));

  const { covers, spine, spineHalves, spineMiddle, blocks, pages, ribbon, elastic } =
    geometryOf('sketchbook');
  const _SIDES = ['left', 'right'] as const;
  const spread = _SIDES.map(() => Object.assign(createSketchPageTexture(), { flipY: false }));
  const painters = _SIDES.map((side, i) => sketchPagePainter(spread[i]!, side));
  idleWhenSettled(painters.flatMap(({ tasks }) => tasks));
  const grain = useGrain(1, 23);
  grain.repeat.set(148 / 25, PAGE_HEIGHT / 25);
  const edges = createPageEdgeTexture();
  const linen = createLinenTexture();
  linen.repeat.set(1 / 12.8, 1 / 12.8);

  const flexing = createFlexUniforms();
  const strapFrame = createFrameUniforms();
  const _CLOTH = {
    color: '#0a0a0c',
    roughness: 0.34,
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    bumpMap: linen,
    bumpScale: 0.12,
  };
  const cloth = new MeshPhysicalNodeMaterial(_CLOTH);
  const clothFlexed = Object.assign(new MeshPhysicalNodeMaterial(_CLOTH), {
    positionNode: flexNode(flexing, { kind: 'rigid' }),
  });
  const _edgeUv = vec2(positionLocal.x.add(positionLocal.z), positionLocal.y);
  const _edge = () =>
    Object.assign(new MeshStandardNodeMaterial(), {
      roughness: PAPER.roughness,
      colorNode: textureNode(edges, _edgeUv).mul(color(new Color('#e4ddd0'))),
      normalNode: bumpMap(textureNode(edges, _edgeUv), float(0.2)),
    });
  const edge = _edge();
  const edgeFlexed = Object.assign(_edge(), {
    positionNode: flexNode(flexing, {
      kind: 'fan',
      base: BLOCK[0],
      top: BLOCK[1],
    }),
  });
  const blank = uniform(0);
  const leaves = spread.map((map, i) =>
    Object.assign(new MeshStandardNodeMaterial(), {
      roughness: PAPER.roughness,
      bumpMap: grain,
      bumpScale: PAPER.bumpScale,
      colorNode: pageSurface(
        mix(textureNode(map), vec4(color(new Color(SKETCH_PAPER)), 1), blank),
        SKETCH_PAPER,
        _SIDES[i]!
      ),
      ...(i === 1 ? { positionNode: flexNode(flexing, { kind: 'page' }) } : {}),
    })
  );
  const satin = new MeshPhysicalNodeMaterial({
    color: '#c51c00',
    roughness: 0.78,
    sheen: 0.45,
    sheenRoughness: 0.55,
    sheenColor: '#ff7a5c',
  });
  const rubber = Object.assign(
    new MeshPhysicalNodeMaterial({
      color: '#3b3c40',
      roughness: 0.64,
      sheen: 0.45,
      sheenRoughness: 0.45,
      sheenColor: '#8a8b92',
    }),
    { positionNode: flexInFrameNode(flexing, strapFrame) }
  );

  const _mesh = (geometry: BufferGeometry, material: Material, castShadow = true) =>
    Object.assign(new Mesh(geometry, material), {
      castShadow,
      receiveShadow: true,
    });
  const spineWhole = _mesh(spine, cloth);
  const halves = spineHalves.map((geometry, i) => _mesh(geometry, i === 1 ? clothFlexed : cloth));
  const middle = _mesh(spineMiddle, cloth);
  const blockMeshes = blocks.map((geometry, i) => _mesh(geometry, i === 1 ? edgeFlexed : edge));
  const pageMeshes = pages.map((geometry, i) => _mesh(geometry, leaves[i]!, false));
  const ribbonMesh = _mesh(ribbon, satin);
  const elasticMesh = _mesh(elastic, rubber);
  const left = [
    _mesh(covers[0]!, cloth),
    spineWhole,
    halves[0]!,
    middle,
    blockMeshes[0]!,
    pageMeshes[0]!,
    ribbonMesh,
  ];
  const right = [_mesh(covers[1]!, clothFlexed), halves[1]!, blockMeshes[1]!, pageMeshes[1]!];
  const hinge = Object.assign(new Group(), { name: 'sketchbook-hinge' });
  hinge.position.y = HINGE * MM;
  const strap = new Group();
  strap.position.set(ELASTIC_ANCHOR[0] * MM, ELASTIC_ANCHOR[1] * MM, 0);
  elasticMesh.position.set(-ELASTIC_ANCHOR[0] * MM, -ELASTIC_ANCHOR[1] * MM, 0);

  const _apply = ({
    angle,
    flat,
    ribbon: weights,
    spine: middlePose,
    elastic: band,
  }: SketchbookPose) => {
    hinge.rotation.z = angle;
    [...blockMeshes, ...pageMeshes].forEach((mesh) => void (mesh.morphTargetInfluences![0] = flat));
    ribbonMesh.morphTargetInfluences!.splice(0, 2, ...weights);
    spineWhole.visible = angle <= 1e-3;
    [...halves, middle].forEach((mesh) => void (mesh.visible = angle > 1e-3));
    middle.position.set(middlePose.x * MM, middlePose.y * MM, 0);
    middle.rotation.z = middlePose.angle;
    middle.scale.x = middlePose.length / SPINE_WIDTH;
    strap.rotation.z = band.angle;
    strap.scale.x = band.stretch;
    elasticMesh.morphTargetInfluences![0] = band.twist;
  };

  const flex = createFlex();
  const strapMatrix = new Matrix4();

  const _flex = (delta: number, angle: number) => (
    stepFlex(flex, delta, angle),
    (flexing.bend.value = flex.bend.value),
    (flexing.fan.value = flex.fan.value),
    flex.active &&
      (strap.updateMatrix(),
      elasticMesh.updateMatrix(),
      setFrame(strapFrame, strapMatrix.multiplyMatrices(strap.matrix, elasticMesh.matrix)),
      (rig.shadowsDirty = true))
  );

  let shown = Number.NaN;
  useTask('sketchbook-fold', (delta) => {
    const progress = rig.actors.sketchbook;
    const open = smoothstep(SKETCH_TIMELINE.open[0], SKETCH_TIMELINE.open[1], progress);
    const pose = foldSketchbook(open);
    blank.value = smoothstep(SKETCH_TIMELINE.blank[0], SKETCH_TIMELINE.blank[1], progress);
    void (open > 0 && painters.forEach(({ finish }) => void finish()));
    void (open !== shown && (_apply(pose), (shown = open), (rig.shadowsDirty = true)));
    _flex(delta, pose.angle);
  });

  onDestroy(() =>
    [
      ...covers,
      spine,
      ...spineHalves,
      spineMiddle,
      ...blocks,
      ...pages,
      ribbon,
      elastic,
      ...spread,
      edges,
      linen,
      cloth,
      clothFlexed,
      edge,
      edgeFlexed,
      ...leaves,
      satin,
      rubber,
    ].forEach((_) => void _.dispose())
  );
</script>

<T.Group name="sketchbook" bind:ref={root} position={placement.position} rotation.y={placement.yaw}>
  {#each left as mesh (mesh.uuid)}
    <T is={mesh} />
  {/each}
  <T is={hinge}>
    <T.Group position.y={-HINGE * MM}>
      {#each right as mesh (mesh.uuid)}
        <T is={mesh} />
      {/each}
      <T is={strap}> <T is={elasticMesh} /> </T>
    </T.Group>
  </T>
</T.Group>
