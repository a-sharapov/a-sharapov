<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Group,
    type Material,
    Matrix4,
    Mesh,
    ShapePath,
    Triangle,
    Vector3,
  } from 'three';
  import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
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
    sliceGeometry,
    stepFlex,
  } from '../paper-bend';
  import { pageSurface } from '../sketches/page-surface';
  import {
    createSketchPageTexture,
    loadSketchHand,
    SKETCH_PAPER,
    sketchPagePainter,
  } from '../sketches/pages';
  import { SKETCH_TIMELINE } from '../staging';
  import { rig } from '../state.svelte';
  import { createLinenTexture, createPageEdgeTexture } from '../textures';
  import { PAPER, useGrain } from './materials.svelte';
  import {
    BOARD,
    ELASTIC,
    ELASTIC_ANCHOR,
    ELASTIC_REACH,
    FLAT,
    foldSketchbook,
    HINGE,
    JOINT,
    pageProfile,
    RIBBON,
    ribbonForms,
    type SketchbookPose,
    SPINE,
    smoothstep,
  } from './sketchbook-rig';
  import { extrudeFrom, MM, parseSvg, sheetFrom, sweepFrom } from './svg';
  import source from './svg/sketchbook.svg?raw';

  interface ISketchbook {
    placement: Placement;
  }

  let { placement }: ISketchbook = $props();

  let root = $state.raw<Group>();
  $effect(() => void (root && flatOnly(root)));

  const paths = parseSvg(source);
  const _PAGE_HEIGHT = 210;
  const _DIVISIONS = 32;
  const _TAIL = _PAGE_HEIGHT / 2;
  const _COVER = [150, 107] as const;
  const _SPINE_WIDTH = 18;
  const _BEND_STEP = 0.6;
  const _BLOCK: [number, number] = [2.5 * MM, FLAT * MM];

  const _sliced = (geometry: BufferGeometry) =>
    ((cut) => (geometry.dispose(), cut))(sliceGeometry(geometry, 0, _BEND_STEP));

  const _flat = (id: string, depth: number, bevel: number) =>
    extrudeFrom(paths[id]!, {
      depth,
      bevel,
      bevelSegments: 4,
      curveSegments: 16,
    }).rotateX(-Math.PI / 2);
  const _merge = (parts: BufferGeometry[]) =>
    ((merged) => (parts.forEach((part) => void part.dispose()), merged))(mergeGeometries(parts));
  const covers = (['left', 'right'] as const).map((side) =>
    ((merged) => (side === 'right' ? _sliced(merged) : merged))(
      _merge([
        _flat(`board-${side}`, BOARD, 0.6),
        _flat(`joint-${side}`, JOINT, 0.3).translate(0, 0.1 * MM, 0),
      ])
    )
  );
  const spine = _flat('spine', SPINE, 0.5);
  const spineHalves = (['left', 'right'] as const).map((side) =>
    _flat(`spine-${side}`, SPINE, 0.5)
  );
  const spineMiddle = _flat('spine', SPINE, 0.5).translate((_SPINE_WIDTH / 2) * MM, -SPINE * MM, 0);

  const _withoutTop = (geometry: BufferGeometry) =>
    ((position) =>
      ((open) => (geometry.dispose(), open.computeVertexNormals(), open))(
        new BufferGeometry().setAttribute(
          'position',
          new Float32BufferAttribute(
            Array.from({ length: position.count / 3 }, (_, face) =>
              [0, 1, 2].map((k) => new Vector3().fromBufferAttribute(position, face * 3 + k))
            )
              .filter(
                ({ 0: a, 1: b, 2: c }) => new Triangle(a, b, c).getNormal(new Vector3()).y < 0.01
              )
              .flat()
              .flatMap((vertex) => vertex.toArray()),
            3
          )
        )
      ))(geometry.getAttribute('position'));

  const _morph = (
    geometry: BufferGeometry,
    targets: { position: number[]; normal?: number[] }[]
  ) => (
    (geometry.morphAttributes.position = targets.map(
      ({ position }) => new Float32BufferAttribute(position, 3)
    )),
    targets[0]?.normal &&
      (geometry.morphAttributes.normal = targets.map(
        ({ normal }) => new Float32BufferAttribute(normal!, 3)
      )),
    geometry.computeBoundingSphere(),
    geometry
  );
  const _flatten = (geometry: BufferGeometry, top: (y: number) => boolean, normals: boolean) =>
    ((position) =>
      _morph(geometry, [
        {
          position: Array.from(position.array, (value, i) =>
            i % 3 === 1 && top(value) ? FLAT * MM : value
          ),
          normal: normals ? Array.from(position.array, (_, i) => (i % 3 === 1 ? 1 : 0)) : undefined,
        },
      ]))(geometry.getAttribute('position'));

  const blocks = (['left', 'right'] as const).map((side) =>
    ((block) => (side === 'right' ? _sliced(block) : block))(
      _flatten(
        _withoutTop(
          extrudeFrom(paths[`block-${side}`]!, {
            depth: _PAGE_HEIGHT,
            curveSegments: _DIVISIONS,
          }).translate(0, 0, (-_PAGE_HEIGHT / 2) * MM)
        ),
        (y) => y > 2.9 * MM,
        false
      )
    )
  );
  const pages = (['page-left', 'page-right'] as const).map((id) =>
    _flatten(
      sheetFrom(paths[id]!, {
        depth: _PAGE_HEIGHT,
        divisions: _DIVISIONS,
      }).translate(0, 0, (-_PAGE_HEIGHT / 2) * MM),
      () => true,
      true
    )
  );

  const profile = pageProfile(
    paths['page-right']!.subPaths.flatMap((subPath) => subPath.getPoints(_DIVISIONS))
  );

  const _DRAPE = 3;
  const _REST = RIBBON[1] + 0.03;
  const _fall = (z: number) => Math.exp(-((Math.max(0, z - _TAIL) / _DRAPE) ** 2));
  const _ends = (t: number): [number, number] => [1, Math.min(1, t / 0.004, (1 - t) / 0.004)];
  const _NOTCH = 4.5;
  const _notch = ((length) =>
    (
      (depth, from) => (t: number, side: number) =>
        t <= from ? t : from + ((t - from) * (1 - depth * (1 - Math.abs(side)) - from)) / (1 - from)
    )(_NOTCH / length, 1 - (4 * _NOTCH) / length))(
    ((points) => points.slice(1).reduce((sum, point, i) => sum + point.distanceTo(points[i]!), 0))(
      paths.ribbon!.subPaths.flatMap((subPath) => subPath.getPoints(24))
    )
  );
  const _ribbon = ({ shift, lift, roll }: ReturnType<typeof ribbonForms>[number]) =>
    sweepFrom(paths.ribbon!, {
      radius: RIBBON,
      squareness: 8,
      segments: 480,
      radial: 8,
      profile: _ends,
      reach: _notch,
      pitch: true,
      lift: (_t, { 0: x, 1: z }) => _REST + (lift(x + shift) - _REST) * _fall(z),
      roll: (_t, { 0: x, 1: z }) => roll(x + shift) * _fall(z),
    })
      .rotateX(-Math.PI / 2)
      .translate(shift * MM, 0, 0);
  const _attributes = (geometry: BufferGeometry) =>
    ((attributes) => (geometry.dispose(), attributes))({
      position: Array.from(geometry.getAttribute('position').array),
      normal: Array.from(geometry.getAttribute('normal').array),
    });
  const ribbon = (({ 0: gutter, 1: slope, 2: closed }) =>
    _morph(_ribbon(gutter), [_attributes(_ribbon(slope)), _attributes(_ribbon(closed))]))(
    ribbonForms(profile)
  );

  const _outside = (x: number, z: number) => Math.max(0, x - _COVER[0], Math.abs(z) - _COVER[1]);
  const _ELASTIC_SEGMENTS = 400;
  const _WOBBLE = [
    [0.55, 0.031, 1.3],
    [0.35, 0.074, 0.4],
    [0.2, 0.17, 2.1],
  ] as const;
  const _wobble = (z: number) =>
    (1 - smoothstep(78, 96, Math.abs(z))) *
    (0.5 +
      _WOBBLE.reduce(
        (sum, { 0: size, 1: rate, 2: phase }) => sum + size * Math.sin(z * rate + phase),
        0
      ));
  const _loop = ((x, reach, z, t) =>
    ((path) => (
      path.moveTo(x, -100),
      path.lineTo(x, -(z - 1.45)),
      path.quadraticCurveTo(x, -z, x + 1.45, -z),
      path.lineTo(x + reach - t, -z),
      path.quadraticCurveTo(x + reach, -z, x + reach, -(z - t)),
      path.lineTo(x + reach, z - t),
      path.quadraticCurveTo(x + reach, z, x + reach - t, z),
      path.lineTo(x + 1.45, z),
      path.quadraticCurveTo(x, z, x, z - 1.45),
      path.lineTo(x, 100),
      path
    ))(new ShapePath()))(ELASTIC_ANCHOR[0], ELASTIC_REACH, _COVER[1] + ELASTIC[1], ELASTIC[1]);
  const elastic = _morph(
    sweepFrom(paths.elastic!, {
      radius: ELASTIC,
      squareness: 8,
      segments: _ELASTIC_SEGMENTS,
      radial: 8,
      pitch: true,
      lift: (_t, { 0: x, 1: z }) =>
        ELASTIC[1] +
        0.02 +
        (BOARD / 2 - ELASTIC[1] - 0.02) * (1 - smoothstep(0, 4, _outside(x, z))),
      shift: (_t, { 1: z }) => _wobble(z),
    }).rotateX(-Math.PI / 2),
    [
      _attributes(
        sweepFrom(_loop, {
          radius: ELASTIC,
          squareness: 8,
          segments: _ELASTIC_SEGMENTS,
          radial: 8,
          lift: () => ELASTIC_ANCHOR[1],
          roll: () => Math.PI / 2,
        }).rotateX(-Math.PI / 2)
      ),
    ]
  );

  const _SIDES = ['left', 'right'] as const;
  const spread = _SIDES.map(() => Object.assign(createSketchPageTexture(), { flipY: false }));
  const painters = _SIDES.map((side, i) => sketchPagePainter(spread[i]!, side));
  void loadSketchHand().catch(() => undefined);
  idleWhenSettled(painters.flatMap(({ tasks }) => tasks));
  const grain = useGrain(1, 23);
  grain.repeat.set(148 / 25, _PAGE_HEIGHT / 25);
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
      base: _BLOCK[0],
      top: _BLOCK[1],
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
    middle.scale.x = middlePose.length / _SPINE_WIDTH;
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
