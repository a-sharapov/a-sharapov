import {
  add,
  cuboid,
  curve,
  dot,
  type Figure,
  hull,
  lathe,
  scale,
  segment,
  shadowOf,
  sub,
  turned,
  unit,
  type Vec,
  type View,
} from './figures';
import { type Point, polygon, type Sketcher } from './pencil';

var _LIGHT = unit([52, 54, 48]);

var _LAMP_BASE: Vec = [12, 0, -27];

var _LAMP_CAP: Vec = [5, 22.5, -13];

var _CUP: [number, number][] = [
  [1.2, 0],
  [1.74, 0.05],
  [1.79, 0.32],
  [2.03, 0.63],
  [2.36, 1.14],
  [2.63, 1.89],
  [2.84, 2.84],
  [3.02, 3.83],
  [3.15, 4.74],
  [3.24, 5.36],
  [3.26, 5.53],
];

var _SAUCER: [number, number][] = [
  [3.4, 0],
  [4.4, 0.3],
  [5.2, 0.75],
  [5.5, 0.95],
];

var _SHADE: [number, number][] = [
  [1.38, 0],
  [1.38, 0.6],
  [1.5, 1.4],
  [2, 2.4],
  [2.6, 3.8],
  [3.08, 5],
  [3.15, 6.3],
];

var _HANDLE: [radius: number, height: number][] = [
  [3.05, 4.5],
  [3.9, 4.65],
  [4.45, 4.05],
  [4.3, 3],
  [3.65, 2.25],
  [2.75, 1.95],
];

var _render = (
  sketch: Sketcher,
  figure: Figure,
  seed: number,
  { erase = true, weight = 1, shade = true } = {}
) => (
  erase && sketch.erase(figure.area),
  sketch.draw(figure.hidden, 'hard', 0.75),
  sketch.draw(figure.lines, 'soft', weight),
  shade &&
    figure.faces.forEach(
      ({ area, normal }, i) =>
        void ((light) =>
          light < 0.4 &&
          sketch.hatch(area, {
            step: 0.5 + Math.max(0, light) * 1.4,
            weight: 0.95 - Math.max(0, light),
            seed: seed * 7 + i,
          }))(dot(normal, _LIGHT))
    )
);

var _castShadow = (
  sketch: Sketcher,
  view: View,
  points: Vec[],
  seed: number,
  weight = 0.55
) =>
  sketch.hatch(hull(shadowOf(points, _LIGHT).map(view.project)), {
    angle: -0.45,
    step: 0.7,
    weight,
    seed,
  });

var _shadeSide = (
  sketch: Sketcher,
  figure: Figure,
  seed: number,
  share = 0.32
) => sketch.side(figure.area, share, { step: 0.75, weight: 0.8, seed });

var _cup = (view: View, at: Vec, yaw: number, seed: number) => {
  const place = turned(at, yaw);
  const saucer = lathe(view, {
    base: at,
    profile: _SAUCER,
    rims: [3],
    rings: [0],
    seed,
  });
  const cup = lathe(view, {
    base: add(at, [0, 0.62, 0]),
    profile: _CUP,
    rims: [10],
    rings: [0],
    seed: seed + 1,
  });
  const coffee = lathe(view, {
    base: add(at, [0, 0.62, 0]),
    profile: [
      [2.95, 4.95],
      [2.95, 4.95],
    ],
    rims: [0],
    seed: seed + 2,
  });
  const handle = (inset: number) =>
    curve(
      view,
      _HANDLE.map(({ 0: r, 1: h }, i) =>
        place([
          (r - (i > 0 && i < _HANDLE.length - 1 ? inset : 0)) * Math.cos(-0.15),
          0.62 + h - (i > 0 && i < _HANDLE.length - 1 ? inset * 0.4 : 0),
          (r - (i > 0 && i < _HANDLE.length - 1 ? inset : 0)) * Math.sin(-0.15),
        ])
      ),
      seed + 3 + inset * 10
    );
  const steam = [0, 1].map((k) =>
    curve(
      view,
      Array.from(
        { length: 12 },
        (_, i): Vec =>
          add(at, [
            Math.sin(i * 0.8 + k * 2.1) * (0.25 + i * 0.05) + k * 0.4 - 0.2,
            6.2 + i * 0.62,
            Math.cos(i * 0.6 + k) * 0.3,
          ])
      ),
      seed + 5 + k
    )
  );
  return { saucer, cup, coffee, handle: [handle(0), handle(0.45)], steam };
};

var _lamp = (view: View, base: Vec, cap: Vec, target: Vec, seed: number) => {
  const top = add(base, [0, 10.2, 0]);
  return {
    foot: lathe(view, {
      base,
      profile: [
        [3.3, 0],
        [3.3, 0.9],
        [3.0, 1.2],
      ],
      rims: [2],
      rings: [0],
      seed,
    }),
    stem: lathe(view, {
      base: add(base, [0, 1.2, 0]),
      profile: [
        [0.42, 0],
        [0.42, 9],
      ],
      seed: seed + 1,
    }),
    joint: cuboid(view, {
      at: add(top, [0, -0.6, 0]),
      size: [1.1, 1.3, 1.1],
      seed: seed + 2,
    }),
    arm: lathe(view, {
      base: top,
      axis: sub(cap, top),
      profile: [
        [0.17, 0],
        [0.17, Math.hypot(...sub(cap, top))],
      ],
      seed: seed + 3,
    }),
    shade: lathe(view, {
      base: cap,
      axis: sub(target, cap),
      profile: _SHADE,
      rings: [0, 6],
      seed: seed + 4,
    }),
  };
};

var _plane = (view: View, at: Vec, yaw: number, size: number) => {
  const place = turned(at, yaw);
  const nose = place(scale([0, 0.5, 6.5], size));
  const tail = place(scale([0, 1.5, -5], size));
  const keel = place(scale([0, 0, -5], size));
  const left = place(scale([-3.4, 2.5, -5], size));
  const right = place(scale([3.4, 2.5, -5], size));
  return {
    points: [nose, tail, keel, left, right],
    wings: [
      [nose, left, tail],
      [nose, right, tail],
    ].map((loop) => loop.map(view.project)),
    keel: [nose, keel, tail].map(view.project),
    fold: [nose, tail].map(view.project),
  };
};

export var desk = (sketch: Sketcher, view: View, seed: number, detail = 1) => {
  const { draw } = sketch;
  const pileAt: Vec = [-12, 0, -42];
  const pile = turned(pileAt, 0.3);
  const resume = cuboid(view, {
    at: pileAt,
    size: [21, 0.35, 29.7],
    yaw: 0.3,
    seed,
  });
  const book = cuboid(view, {
    at: pile([0.5, 0.35, 0.8]),
    size: [15, 1.4, 21],
    yaw: 0.24,
    seed: seed + 1,
  });
  const tablet = cuboid(view, {
    at: pile([0.3, 1.75, 0.6]),
    size: [17.8, 0.7, 24.7],
    yaw: 0.36,
    seed: seed + 2,
  });
  const lamp = _lamp(view, _LAMP_BASE, _LAMP_CAP, [0, 2.7, 0], seed + 10);
  const holder = lathe(view, {
    base: [-15.5, 0, -3.5],
    profile: [
      [3.1, 0],
      [3.25, 9.2],
    ],
    rims: [1],
    rings: [0],
    seed: seed + 20,
  });
  const tilt = 0.21;
  const card = [
    [-4.5, 0.9, 0],
    [4.5, 0.9, 0],
    [4.5, 0.9 + 5 * Math.cos(tilt), -5 * Math.sin(tilt)],
    [-4.5, 0.9 + 5 * Math.cos(tilt), -5 * Math.sin(tilt)],
  ] as Vec[];
  const stand = cuboid(view, {
    at: [0, 0, -0.5],
    size: [9.4, 0.35, 1.6],
    seed: seed + 30,
  });
  const plane = _plane(view, [-12.5, 0, 5], 2.5, 1.1);
  const cup = _cup(view, [11.5, 0, 7.5], -0.35, seed + 40);
  const tools = [
    { from: [-14.6, 8.6, -3.5], to: [-12.2, 17.4, -4.5] },
    { from: [-16.4, 8.6, -3.2], to: [-19.4, 15.8, -2.2] },
    { from: [-15.2, 8.6, -4.3], to: [-14, 16.8, -7.8] },
  ] as { from: Vec; to: Vec }[];

  [
    {
      points: [...resume.points, ...book.points, ...tablet.points],
      weight: 0.45,
    },
    {
      points: [
        ...lamp.foot.points,
        ...lamp.stem.points,
        ...lamp.arm.points,
        ...lamp.shade.points,
      ],
      weight: 0.35,
    },
    { points: holder.points, weight: 0.6 },
    { points: [...card, ...stand.points], weight: 0.6 },
    { points: plane.points, weight: 0.5 },
    { points: [...cup.saucer.points, ...cup.cup.points], weight: 0.6 },
  ].forEach(
    ({ points, weight }, i) =>
      void _castShadow(sketch, view, points, seed + 50 + i, weight * detail)
  );

  [resume, book, tablet].forEach(
    (figure, i) => void _render(sketch, figure, seed + 60 + i)
  );
  draw(
    [0, 1, 2].map((k) =>
      segment(
        view,
        pile([-9.5 + k * 0.35, 0.35 + k * 0.03, -14.6]),
        pile([9.5 - k * 0.2, 0.35 + k * 0.03, -14.6]),
        seed + 64 + k
      )
    ),
    'hard',
    0.6
  );
  _render(sketch, lamp.foot, seed + 70);
  _shadeSide(sketch, lamp.foot, seed + 71);
  _render(sketch, lamp.stem, seed + 72);
  _render(sketch, lamp.joint, seed + 73);
  _render(sketch, lamp.arm, seed + 74, { erase: false });
  _render(sketch, lamp.shade, seed + 75);
  _shadeSide(sketch, lamp.shade, seed + 76, 0.45);

  _render(sketch, holder, seed + 80);
  _shadeSide(sketch, holder, seed + 81, 0.38);
  tools.forEach(
    ({ from, to }, i) =>
      void ((side) =>
        draw(
          [
            segment(view, add(from, side), add(to, side), seed + 82 + i * 3),
            segment(view, sub(from, side), sub(to, side), seed + 83 + i * 3),
            ...[side, scale(side, -1)].map((offset, k) =>
              segment(
                view,
                add(to, offset),
                add(to, scale(sub(to, from), 0.12)),
                seed + 90 + i * 2 + k
              )
            ),
          ],
          'soft',
          0.9
        ))(scale(unit([-(to[2] - from[2]), 0, to[0] - from[0]]), 0.38))
  );

  _render(sketch, stand, seed + 100, { shade: false });
  ((face: Point[]) => (
    sketch.erase(face),
    draw(polygon(face, seed + 101, view.hand), 'soft', 1.05),
    ((center: Point, width: number) =>
      sketch.write('а. шарапов', center[0], center[1] + width * 0.06, {
        size: width * 0.17,
        pencil: 'dark',
        bold: true,
        align: 'center',
      }))(
      [(face[0]![0] + face[2]![0]) / 2, (face[0]![1] + face[2]![1]) / 2],
      Math.abs(face[1]![0] - face[0]![0])
    )
  ))(card.map(view.project));

  sketch.erase(hull([...plane.wings.flat(), ...plane.keel]));
  draw(
    plane.wings.flatMap((loop, i) => polygon(loop, seed + 110 + i, view.hand)),
    'soft'
  );
  draw(polygon(plane.keel, seed + 113, view.hand), 'hard');
  sketch.hatch(plane.keel, { step: 0.6, weight: 0.8, seed: seed + 114 });

  _render(sketch, cup.saucer, seed + 120);
  _render(sketch, cup.cup, seed + 121);
  _shadeSide(sketch, cup.cup, seed + 122, 0.3);
  sketch.smudge(cup.coffee.area, 0.16);
  sketch.hatch(cup.coffee.area, {
    angle: 0.3,
    step: 0.55,
    weight: 0.7,
    seed: seed + 123,
  });
  draw(cup.coffee.lines, 'soft', 0.8);
  draw(cup.handle, 'soft');
  draw(cup.steam, 'hard', 0.9);

  return {
    lamp: view.project(
      add(_LAMP_CAP, scale(unit(sub([0, 2.7, 0], _LAMP_CAP)), 6.3))
    ),
    card: view.project([0, 3.4, -0.5]),
    cup: view.project([11.5, 6.2, 7.5]),
    pile: view.project(pile([4, 2.6, -6])),
    plane: plane.fold[0]!,
    holder: view.project([-15.5, 9.2, -3.5]),
  };
};
