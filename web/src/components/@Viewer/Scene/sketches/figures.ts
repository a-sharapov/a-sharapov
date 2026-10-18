import { line, type Point, path, type Stroke } from './pencil';

export type Vec = [x: number, y: number, z: number];

export var add = (a: Vec, b: Vec): Vec => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export var sub = (a: Vec, b: Vec): Vec => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export var scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export var dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export var cross3 = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export var unit = (a: Vec): Vec => scale(a, 1 / (Math.hypot(...a) || 1));

export type View = {
  project: (point: Vec) => Point;
  toward: (point: Vec) => Vec;
  hand: number;
};

export var perspective = ({
  eye,
  target,
  zoom,
  at,
  up = [0, 1, 0],
  hand = 1,
}: {
  eye: Vec;
  target: Vec;
  zoom: number;
  at: Point;
  up?: Vec;
  hand?: number;
}): View => {
  const forward = unit(sub(target, eye));
  const right = unit(cross3(forward, up));
  const upward = cross3(right, forward);
  return {
    project: (point) => {
      const offset = sub(point, eye);
      const depth = Math.max(dot(offset, forward), 1e-3);
      return [
        at[0] + (zoom * dot(offset, right)) / depth,
        at[1] - (zoom * dot(offset, upward)) / depth,
      ];
    },
    toward: (point) => sub(eye, point),
    hand,
  };
};

export var turned =
  (origin: Vec, yaw = 0) =>
  ({ 0: x, 1: y, 2: z }: Vec): Vec => [
    origin[0] + x * Math.cos(yaw) + z * Math.sin(yaw),
    origin[1] + y,
    origin[2] - x * Math.sin(yaw) + z * Math.cos(yaw),
  ];

export var hull = (points: Point[]): Point[] => {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const side = (a: Point, b: Point, c: Point) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const chain = (list: Point[]) =>
    list.reduce<Point[]>((acc, point) => {
      while (
        acc.length >= 2 &&
        side(acc[acc.length - 2]!, acc[acc.length - 1]!, point) <= 0
      )
        acc.pop();
      acc.push(point);
      return acc;
    }, []);
  const lower = chain(sorted);
  const upper = chain([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

export var shadowOf = (points: Vec[], light: Vec, floor = 0): Vec[] =>
  points.map((point) =>
    sub(point, scale(light, (point[1] - floor) / Math.max(light[1], 1e-3)))
  );

export type Figure = {
  lines: Stroke[];
  hidden: Stroke[];
  faces: { area: Point[]; normal: Vec }[];
  area: Point[];
  points: Vec[];
};

var _BOX_FACES: [normal: Vec, loop: number[]][] = [
  [
    [-1, 0, 0],
    [0, 4, 6, 2],
  ],
  [
    [1, 0, 0],
    [1, 3, 7, 5],
  ],
  [
    [0, -1, 0],
    [0, 1, 5, 4],
  ],
  [
    [0, 1, 0],
    [2, 6, 7, 3],
  ],
  [
    [0, 0, -1],
    [0, 2, 3, 1],
  ],
  [
    [0, 0, 1],
    [4, 5, 7, 6],
  ],
];

export var cuboid = (
  view: View,
  {
    at,
    size,
    yaw = 0,
    seed,
  }: { at: Vec; size: Vec; yaw?: number; seed: number }
): Figure => {
  const place = turned(at, yaw);
  const local = Array.from(
    { length: 8 },
    (_, i): Vec => [
      ((i & 1) - 0.5) * size[0],
      ((i >> 1) & 1) * size[1],
      (((i >> 2) & 1) - 0.5) * size[2],
    ]
  );
  const points = local.map(place);
  const screen = points.map(view.project);
  const normalOf = (normal: Vec) =>
    sub(turned([0, 0, 0], yaw)(normal), [0, 0, 0]);
  const shown = _BOX_FACES.map(({ 0: normal, 1: loop }) =>
    ((center) => dot(normalOf(normal), view.toward(center)) > 0)(
      scale(
        loop.reduce<Vec>((sum, i) => add(sum, points[i]!), [0, 0, 0]),
        1 / 4
      )
    )
  );
  const edges = _BOX_FACES.flatMap(({ 1: loop }, face) =>
    loop.map((a, k) => ({
      key: [a, loop[(k + 1) % 4]!].sort().join(),
      a,
      b: loop[(k + 1) % 4]!,
      shown: shown[face]!,
    }))
  );
  const keys = [...new Set(edges.map(({ key }) => key))];
  const visible = (key: string) =>
    edges.some((edge) => edge.key === key && edge.shown);
  const stroke = (key: string, i: number) =>
    ((edge) =>
      line(screen[edge.a]!, screen[edge.b]!, seed * 13 + i, view.hand))(
      edges.find((edge) => edge.key === key)!
    );
  return {
    lines: keys.filter(visible).map(stroke),
    hidden: keys.filter((key) => !visible(key)).map(stroke),
    faces: _BOX_FACES
      .filter((_, face) => shown[face])
      .map(({ 0: normal, 1: loop }) => ({
        area: loop.map((i) => screen[i]!),
        normal: normalOf(normal),
      })),
    area: hull(screen),
    points,
  };
};

export type Lathe = {
  base: Vec;
  axis?: Vec;
  profile: [radius: number, height: number][];
  rings?: number[];
  rims?: number[];
  seed: number;
  segments?: number;
};

export var lathe = (
  view: View,
  {
    base,
    axis = [0, 1, 0],
    profile,
    rings = [],
    rims = [],
    seed,
    segments = 48,
  }: Lathe
): Figure => {
  const along = unit(axis);
  const side = unit(
    Math.abs(along[1]) > 0.9
      ? cross3(along, [0, 0, 1])
      : cross3(along, [0, 1, 0])
  );
  const other = cross3(along, side);
  const radial = (theta: number) =>
    add(scale(side, Math.cos(theta)), scale(other, Math.sin(theta)));
  const angles = Array.from(
    { length: segments + 1 },
    (_, i) => (i / segments) * Math.PI * 2
  );
  const turns = angles.map(radial);
  const grid = profile.map(({ 0: r, 1: h }, k) => {
    const a = profile[Math.max(0, k - 1)]!;
    const b = profile[Math.min(profile.length - 1, k + 1)]!;
    const slope = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const center = add(base, scale(along, h));
    return turns.map((turn) => {
      const world = add(center, scale(turn, r));
      return {
        world,
        screen: view.project(world),
        facing: dot(
          add(scale(turn, Math.cos(slope)), scale(along, -Math.sin(slope))),
          view.toward(world)
        ),
      };
    });
  });
  const edges = grid.map((ring) =>
    ring
      .slice(0, -1)
      .flatMap(({ facing: a }, i) =>
        ((b) => (a * b < 0 ? [{ i, t: a / (a - b), rising: b > a }] : []))(
          ring[i + 1]!.facing
        )
      )
  );
  const track = (rising: boolean) =>
    grid.flatMap((ring, k) =>
      profile[k]![0] < 1e-3
        ? []
        : edges[k]!.filter((edge) => edge.rising === rising)
            .slice(0, 1)
            .map(({ i, t }): Point => {
              const { 0: ax, 1: ay } = ring[i]!.screen;
              const { 0: bx, 1: by } = ring[i + 1]!.screen;
              return [ax + (bx - ax) * t, ay + (by - ay) * t];
            })
    );
  const arcs = (k: number, wanted: boolean) => {
    const ring = grid[k]!;
    const split = ring
      .reduce<Point[][]>(
        (acc, { screen, facing }, i) =>
          facing > 0 === wanted
            ? i > 0 && ring[i - 1]!.facing > 0 === wanted
              ? (acc[acc.length - 1]!.push(screen), acc)
              : [...acc, [screen]]
            : acc,
        []
      )
      .filter((arc) => arc.length > 1);
    const seam =
      split.length > 1 &&
      ring[0]!.facing > 0 === wanted &&
      ring[segments]!.facing > 0 === wanted;
    return seam
      ? [[...split.at(-1)!, ...split[0]!.slice(1)], ...split.slice(1, -1)]
      : split;
  };
  const ring = (k: number) => grid[k]!.map(({ screen }) => screen);
  const points = grid.flatMap((ring) =>
    ring.filter((_, i) => i % 6 === 0).map(({ world }) => world)
  );
  return {
    lines: [
      ...[true, false]
        .map(track)
        .filter((points) => points.length > 1)
        .map((points, i) => path(points, seed * 17 + i, { hand: view.hand })),
      ...rims.map((k) =>
        path(ring(k), seed * 17 + 10 + k, { hand: view.hand, closed: true })
      ),
      ...rings.flatMap((k) =>
        arcs(k, true).map((arc, i) =>
          path(arc, seed * 17 + 40 + k * 5 + i, { hand: view.hand })
        )
      ),
    ],
    hidden: rings.flatMap((k) =>
      arcs(k, false).map((arc, i) =>
        path(arc, seed * 17 + 80 + k * 5 + i, { hand: view.hand * 0.6 })
      )
    ),
    faces: [],
    area: hull(profile.flatMap((_, k) => ring(k))),
    points,
  };
};

export var segment = (view: View, from: Vec, to: Vec, seed: number) =>
  line(view.project(from), view.project(to), seed, view.hand);

export var curve = (view: View, points: Vec[], seed: number) =>
  path(points.map(view.project), seed, { hand: view.hand });
