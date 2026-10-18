import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapePath,
  Triangle,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sliceGeometry } from '../paper-slice';
import {
  BOARD,
  ELASTIC,
  ELASTIC_ANCHOR,
  ELASTIC_REACH,
  FLAT,
  JOINT,
  pageProfile,
  RIBBON,
  ribbonForms,
  SPINE,
  smoothstep,
} from './sketchbook-rig';
import { extrudeFrom, MM, type SvgPaths, sheetFrom, sweepFrom } from './svg';

export var PAGE_HEIGHT = 210;
var _DIVISIONS = 32;
var _TAIL = PAGE_HEIGHT / 2;
var _COVER = [150, 107] as const;
export var SPINE_WIDTH = 18;
var _BEND_STEP = 0.6;
export var BLOCK: [number, number] = [2.5 * MM, FLAT * MM];

export var buildSketchbookGeometry = (paths: SvgPaths) => {
  const _sliced = (geometry: BufferGeometry) =>
    ((cut) => (geometry.dispose(), cut))(
      sliceGeometry(geometry, 0, _BEND_STEP)
    );

  const _flat = (id: string, depth: number, bevel: number) =>
    extrudeFrom(paths[id]!, {
      depth,
      bevel,
      bevelSegments: 4,
      curveSegments: 16,
    }).rotateX(-Math.PI / 2);
  const _merge = (parts: BufferGeometry[]) =>
    ((merged) => (parts.forEach((part) => void part.dispose()), merged))(
      mergeGeometries(parts)
    );
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
  const spineMiddle = _flat('spine', SPINE, 0.5).translate(
    (SPINE_WIDTH / 2) * MM,
    -SPINE * MM,
    0
  );

  const _withoutTop = (geometry: BufferGeometry) =>
    ((position) =>
      ((open) => (geometry.dispose(), open.computeVertexNormals(), open))(
        new BufferGeometry().setAttribute(
          'position',
          new Float32BufferAttribute(
            Array.from({ length: position.count / 3 }, (_, face) =>
              [0, 1, 2].map((k) =>
                new Vector3().fromBufferAttribute(position, face * 3 + k)
              )
            )
              .filter(
                ({ 0: a, 1: b, 2: c }) =>
                  new Triangle(a, b, c).getNormal(new Vector3()).y < 0.01
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
  const _flatten = (
    geometry: BufferGeometry,
    top: (y: number) => boolean,
    normals: boolean
  ) =>
    ((position) =>
      _morph(geometry, [
        {
          position: Array.from(position.array, (value, i) =>
            i % 3 === 1 && top(value) ? FLAT * MM : value
          ),
          normal: normals
            ? Array.from(position.array, (_, i) => (i % 3 === 1 ? 1 : 0))
            : undefined,
        },
      ]))(geometry.getAttribute('position'));

  const blocks = (['left', 'right'] as const).map((side) =>
    ((block) => (side === 'right' ? _sliced(block) : block))(
      _flatten(
        _withoutTop(
          extrudeFrom(paths[`block-${side}`]!, {
            depth: PAGE_HEIGHT,
            curveSegments: _DIVISIONS,
          }).translate(0, 0, (-PAGE_HEIGHT / 2) * MM)
        ),
        (y) => y > 2.9 * MM,
        false
      )
    )
  );
  const pages = (['page-left', 'page-right'] as const).map((id) =>
    _flatten(
      sheetFrom(paths[id]!, {
        depth: PAGE_HEIGHT,
        divisions: _DIVISIONS,
      }).translate(0, 0, (-PAGE_HEIGHT / 2) * MM),
      () => true,
      true
    )
  );

  const profile = pageProfile(
    paths['page-right']!.subPaths.flatMap((subPath) =>
      subPath.getPoints(_DIVISIONS)
    )
  );

  const _DRAPE = 3;
  const _REST = RIBBON[1] + 0.03;
  const _fall = (z: number) =>
    Math.exp(-((Math.max(0, z - _TAIL) / _DRAPE) ** 2));
  const _ends = (t: number): [number, number] => [
    1,
    Math.min(1, t / 0.004, (1 - t) / 0.004),
  ];
  const _NOTCH = 4.5;
  const _notch = ((length) =>
    (
      (depth, from) => (t: number, side: number) =>
        t <= from
          ? t
          : from +
            ((t - from) * (1 - depth * (1 - Math.abs(side)) - from)) /
              (1 - from)
    )(_NOTCH / length, 1 - (4 * _NOTCH) / length))(
    ((points) =>
      points
        .slice(1)
        .reduce((sum, point, i) => sum + point.distanceTo(points[i]!), 0))(
      paths.ribbon!.subPaths.flatMap((subPath) => subPath.getPoints(24))
    )
  );
  const _ribbon = ({
    shift,
    lift,
    roll,
  }: ReturnType<typeof ribbonForms>[number]) =>
    sweepFrom(paths.ribbon!, {
      radius: RIBBON,
      squareness: 8,
      segments: 480,
      radial: 8,
      profile: _ends,
      reach: _notch,
      pitch: true,
      lift: (_t, { 0: x, 1: z }) =>
        _REST + (lift(x + shift) - _REST) * _fall(z),
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
    _morph(_ribbon(gutter), [
      _attributes(_ribbon(slope)),
      _attributes(_ribbon(closed)),
    ]))(ribbonForms(profile));

  const _outside = (x: number, z: number) =>
    Math.max(0, x - _COVER[0], Math.abs(z) - _COVER[1]);
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
        (sum, { 0: size, 1: rate, 2: phase }) =>
          sum + size * Math.sin(z * rate + phase),
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
    ))(new ShapePath()))(
    ELASTIC_ANCHOR[0],
    ELASTIC_REACH,
    _COVER[1] + ELASTIC[1],
    ELASTIC[1]
  );
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
        (BOARD / 2 - ELASTIC[1] - 0.02) *
          (1 - smoothstep(0, 4, _outside(x, z))),
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

  return {
    covers,
    spine,
    spineHalves,
    spineMiddle,
    blocks,
    pages,
    ribbon,
    elastic,
  };
};
