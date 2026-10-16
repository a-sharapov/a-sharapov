import { hash, softCanvas, valueNoise } from '../textures';

export type Point = [x: number, y: number];
export type Stroke = Point[];

export var PENCILS = {
  hard: { ink: '70, 72, 84', alpha: 0.5, width: 0.18 },
  soft: { ink: '44, 44, 52', alpha: 0.86, width: 0.3 },
  dark: { ink: '30, 30, 36', alpha: 0.95, width: 0.4 },
  shade: { ink: '58, 58, 68', alpha: 0.5, width: 0.2 },
  red: { ink: '192, 36, 14', alpha: 0.84, width: 0.32 },
} as const;

export type Pencil = keyof typeof PENCILS;

export var HAND = 'Caveat';

var _wander = (along: number, seed: number) =>
  valueNoise(along * 0.45 + 64, seed, 4096, seed) - 0.5;

export var line = (from: Point, to: Point, seed: number, hand = 1): Stroke => {
  const { 0: x0, 1: y0 } = from;
  const length = Math.hypot(to[0] - x0, to[1] - y0) || 1;
  const ux = (to[0] - x0) / length;
  const uy = (to[1] - y0) / length;
  const start = -(0.1 + hash(seed, 1, 9) * 0.7) * hand;
  const end = length + (0.1 + hash(seed, 2, 9) * 0.7) * hand;
  const bow = (hash(seed, 3, 9) - 0.5) * Math.min(1, length * 0.014) * hand;
  const steps = Math.max(2, Math.ceil(length / 1.5));
  return Array.from({ length: steps + 1 }, (_, i): Point => {
    const t = i / steps;
    const along = start + (end - start) * t;
    const across =
      bow * Math.sin(Math.PI * t) + _wander(along, seed) * 0.26 * hand;
    return [x0 + ux * along - uy * across, y0 + uy * along + ux * across];
  });
};

export var path = (
  points: Point[],
  seed: number,
  { hand = 1, closed = false } = {}
): Stroke => {
  const ring = closed
    ? [...points, ...points.slice(1, 2 + Math.floor(hash(seed, 4, 9) * 2))]
    : points;
  const lengths = ring.reduce<number[]>(
    (acc, point, i) => [
      ...acc,
      i === 0
        ? 0
        : acc[i - 1]! +
          Math.hypot(point[0] - ring[i - 1]![0], point[1] - ring[i - 1]![1]),
    ],
    []
  );
  const total = lengths.at(-1) || 1;
  const head = closed ? 0 : (0.1 + hash(seed, 1, 9) * 0.6) * hand;
  const tail = closed ? 0 : (0.1 + hash(seed, 2, 9) * 0.6) * hand;
  const steps = Math.max(2, Math.ceil((total + head + tail) / 1.2));
  return Array.from({ length: steps + 1 }, (_, i): Point => {
    const s = -head + ((total + head + tail) * i) / steps;
    const k = Math.min(
      ring.length - 2,
      Math.max(
        0,
        lengths.findLastIndex((length) => length <= s)
      )
    );
    const { 0: ax, 1: ay } = ring[k]!;
    const { 0: bx, 1: by } = ring[k + 1]!;
    const span = Math.hypot(bx - ax, by - ay) || 1;
    const ux = (bx - ax) / span;
    const uy = (by - ay) / span;
    const t = s - lengths[k]!;
    const across = _wander(s, seed) * 0.26 * hand;
    return [ax + ux * t - uy * across, ay + uy * t + ux * across];
  });
};

export var polyline = (points: Point[], seed: number, hand = 1): Stroke[] =>
  points
    .slice(1)
    .map((point, i) => line(points[i]!, point, seed * 7 + i, hand));

export var polygon = (points: Point[], seed: number, hand = 1): Stroke[] =>
  points.map((point, i) =>
    line(point, points[(i + 1) % points.length]!, seed * 7 + i, hand)
  );

export var ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  { from = 0, to = 1, hand = 1, turn = 0 } = {}
): Stroke => {
  const count = Math.max(8, Math.ceil(Math.PI * (rx + ry) * (to - from)));
  return path(
    Array.from({ length: count + 1 }, (_, i): Point => {
      const a = (from + ((to - from) * i) / count) * Math.PI * 2;
      const x = rx * Math.cos(a);
      const y = ry * Math.sin(a);
      return [
        cx + x * Math.cos(turn) - y * Math.sin(turn),
        cy + x * Math.sin(turn) + y * Math.cos(turn),
      ];
    }),
    seed,
    { hand, closed: to - from >= 1 }
  );
};

export var corners = (x: number, y: number, w: number, h: number): Point[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

export var box = (
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  hand = 1
): Stroke[] => polygon(corners(x, y, w, h), seed, hand);

export var rounded = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  seed: number,
  hand = 1
): Stroke => {
  const radius = Math.min(r, w / 2, h / 2);
  return path(
    [
      [-Math.PI / 2, x + w - radius, y + radius],
      [0, x + w - radius, y + h - radius],
      [Math.PI / 2, x + radius, y + h - radius],
      [Math.PI, x + radius, y + radius],
    ].flatMap(({ 0: from, 1: cx, 2: cy }) =>
      Array.from(
        { length: 5 },
        (_, i): Point => [
          cx! + radius * Math.cos(from! + (Math.PI / 2) * (i / 4)),
          cy! + radius * Math.sin(from! + (Math.PI / 2) * (i / 4)),
        ]
      )
    ),
    seed,
    { hand, closed: true }
  );
};

export var arrow = (
  from: Point,
  via: Point,
  to: Point,
  seed: number,
  head = 2
): Stroke[] => {
  const angle = Math.atan2(to[1] - via[1], to[0] - via[0]);
  return [
    path(
      Array.from({ length: 17 }, (_, i): Point => {
        const t = i / 16;
        const u = 1 - t;
        return [
          u * u * from[0] + 2 * u * t * via[0] + t * t * to[0],
          u * u * from[1] + 2 * u * t * via[1] + t * t * to[1],
        ];
      }),
      seed
    ),
    ...[1, -1].map((side) =>
      line(
        to,
        [
          to[0] - head * Math.cos(angle + side * 0.45),
          to[1] - head * Math.sin(angle + side * 0.45),
        ],
        seed + side,
        0.4
      )
    ),
  ];
};

export var dashed = (
  points: Point[],
  seed: number,
  dash = 1.4,
  gap = 1
): Stroke[] =>
  points.slice(1).flatMap((to, k) => {
    const from = points[k]!;
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
    const at = (s: number): Point => [
      from[0] + ((to[0] - from[0]) * s) / length,
      from[1] + ((to[1] - from[1]) * s) / length,
    ];
    return Array.from(
      { length: Math.max(1, Math.round(length / (dash + gap))) },
      (_, i): Stroke => [
        at(i * (dash + gap) + (hash(i, seed + k, 5) - 0.5) * 0.3),
        at(Math.min(length, i * (dash + gap) + dash)),
      ]
    );
  });

export var dimension = (
  from: Point,
  to: Point,
  offset: number,
  seed: number
): Stroke[] => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const ux = (to[0] - from[0]) / length;
  const uy = (to[1] - from[1]) / length;
  const side = Math.sign(offset) || 1;
  const shift = (point: Point, by: number): Point => [
    point[0] - uy * by,
    point[1] + ux * by,
  ];
  const a = shift(from, offset);
  const b = shift(to, offset);
  const tick = (point: Point, i: number) =>
    line(
      [point[0] - (ux - uy) * 0.7, point[1] - (uy + ux) * 0.7],
      [point[0] + (ux - uy) * 0.7, point[1] + (uy + ux) * 0.7],
      seed + 3 + i,
      0.2
    );
  return [
    line(shift(from, side * 0.6), shift(a, side * 1), seed, 0.3),
    line(shift(to, side * 0.6), shift(b, side * 1), seed + 1, 0.3),
    line(a, b, seed + 2, 0.4),
    tick(a, 0),
    tick(b, 1),
  ];
};

export var lines = (
  x: number,
  y: number,
  width: number,
  count: number,
  gap: number,
  seed: number
): Stroke[] =>
  Array.from({ length: count }, (_, i) =>
    line(
      [x, y + i * gap],
      [
        x +
          width *
            (i === count - 1 && count > 1
              ? 0.4 + hash(i, seed, 3) * 0.3
              : 0.8 + hash(i, seed, 5) * 0.2),
        y + i * gap,
      ],
      seed * 31 + i,
      0.5
    )
  );

var _TILE = 128;

var _tooth: Uint8ClampedArray | null = null;

var _tiles = new Map<string, HTMLCanvasElement>();

var _grain = () => {
  _tooth ??= Uint8ClampedArray.from({ length: _TILE * _TILE }, (_, i) => {
    const x = i % _TILE;
    const y = Math.floor(i / _TILE);
    const tooth =
      valueNoise(x / 2, y / 3.2, _TILE / 2, 71) * 0.6 + hash(x, y, 73) * 0.4;
    return 255 * (1 - Math.max(0, Math.min(1, (tooth - 0.5) * 2.2)));
  });
  return _tooth;
};

var _tile = (ink: string) =>
  _tiles.get(ink) ??
  ((canvas) => {
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(_TILE, _TILE);
    const { 0: r, 1: g, 2: b } = ink.split(',').map(Number);
    const tooth = _grain();
    for (let i = 0; i < tooth.length; i += 1) {
      image.data[i * 4] = r!;
      image.data[i * 4 + 1] = g!;
      image.data[i * 4 + 2] = b!;
      image.data[i * 4 + 3] = tooth[i]!;
    }
    context.putImageData(image, 0, 0);
    _tiles.set(ink, canvas);
    return canvas;
  })(softCanvas(_TILE, _TILE));

export type Sketcher = ReturnType<typeof sketcher>;

type Writing = {
  size?: number;
  pencil?: Pencil;
  weight?: number;
  align?: CanvasTextAlign;
  bold?: boolean;
  turn?: number;
};

type Hatching = {
  angle?: number;
  step?: number;
  pencil?: Pencil;
  weight?: number;
  seed?: number;
};

var _pattern = (
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  mm: number
) =>
  ((pattern) => (
    pattern.setTransform(new DOMMatrix().scaleSelf(1 / mm, 1 / mm)), pattern
  ))(context.createPattern(source, 'repeat')!);

export var sketcher = (
  context: CanvasRenderingContext2D,
  mm: number,
  paper: HTMLCanvasElement
) => {
  const count = { strokes: 0 };
  const leads = Object.fromEntries(
    Object.entries(PENCILS).map(({ 0: name, 1: { ink } }) => [
      name,
      _pattern(context, _tile(ink), mm),
    ])
  ) as Record<Pencil, CanvasPattern>;
  const blank = _pattern(context, paper, mm);
  const style = (pencil: Pencil, weight: number) =>
    void ((count.strokes += 1),
    (context.strokeStyle = leads[pencil]),
    (context.globalAlpha = Math.min(
      1,
      PENCILS[pencil].alpha * weight * (0.8 + hash(count.strokes, 3, 17) * 0.32)
    )),
    (context.lineWidth = PENCILS[pencil].width));
  const trace = (points: Point[]) =>
    points.forEach(
      ({ 0: x, 1: y }, i) =>
        void (i === 0 ? context.moveTo(x, y) : context.lineTo(x, y))
    );
  const stroke = (points: Stroke) =>
    void (context.beginPath(), trace(points), context.stroke());
  const clip = (area: Point[], paint: () => void) =>
    void (context.save(),
    context.beginPath(),
    trace(area),
    context.closePath(),
    context.clip(),
    paint(),
    context.restore());
  const draw = (strokes: Stroke[], pencil: Pencil, weight = 1) =>
    strokes.forEach((points) => void (style(pencil, weight), stroke(points)));
  const hatch = (
    area: Point[],
    {
      angle = -0.95,
      step = 0.9,
      pencil = 'shade',
      weight = 1,
      seed = 0,
    }: Hatching = {}
  ) =>
    clip(area, () => {
      const xs = area.map(({ 0: x }) => x);
      const ys = area.map(({ 1: y }) => y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const reach =
        Math.hypot(
          Math.max(...xs) - Math.min(...xs),
          Math.max(...ys) - Math.min(...ys)
        ) /
          2 +
        1;
      Array.from({ length: Math.ceil((2 * reach) / step) + 1 }).forEach(
        (_, i) => {
          const turn = angle + (hash(i, seed, 23) - 0.5) * 0.05;
          const offset =
            -reach + i * step + (hash(i, seed, 29) - 0.5) * step * 0.4;
          const dx = Math.cos(turn);
          const dy = Math.sin(turn);
          const ox = cx - Math.sin(angle) * offset;
          const oy = cy + Math.cos(angle) * offset;
          style(pencil, weight * (0.75 + hash(i, seed, 19) * 0.4));
          stroke(
            line(
              [ox - dx * reach, oy - dy * reach],
              [ox + dx * reach, oy + dy * reach],
              seed * 101 + i,
              0.3
            )
          );
        }
      );
    });
  const fill = (area: Point[], style: string | CanvasPattern, alpha: number) =>
    void (context.beginPath(),
    trace(area),
    context.closePath(),
    (context.fillStyle = style),
    (context.globalAlpha = alpha),
    context.fill());
  const smudge = (area: Point[], alpha = 0.08) =>
    fill(area, leads.shade, alpha * 1.6);
  const erase = (area: Point[], amount = 0.88) => fill(area, blank, amount);
  const side = (area: Point[], share: number, hatching: Hatching = {}) => {
    const xs = area.map(({ 0: x }) => x);
    const ys = area.map(({ 1: y }) => y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const width = (Math.max(...xs) - left) * Math.abs(share);
    clip(area, () =>
      hatch(
        corners(
          share > 0 ? left : Math.max(...xs) - width,
          top,
          width,
          Math.max(...ys) - top
        ),
        hatching
      )
    );
  };
  const font = (size: number, bold: boolean) =>
    void (context.font = `${bold ? 700 : 400} ${size}px ${HAND}, cursive`);
  const measure = (text: string, size = 3.4, bold = false) => (
    font(size, bold), context.measureText(text).width
  );
  const write = (
    text: string,
    x: number,
    y: number,
    {
      size = 3.4,
      pencil = 'soft',
      weight = 1,
      align = 'left',
      bold = false,
      turn = 0,
    }: Writing = {}
  ) => (
    style(pencil, weight * 1.08),
    font(size, bold),
    (context.fillStyle = leads[pencil]),
    (context.textAlign = align),
    context.save(),
    context.translate(x, y),
    context.rotate(turn + (hash(count.strokes, 5, 31) - 0.5) * 0.035),
    context.fillText(text, 0, 0),
    context.restore()
  );
  return { draw, hatch, smudge, clip, erase, side, write, measure, count };
};

export var graphite = (
  page: CanvasRenderingContext2D,
  mm: number,
  paper: HTMLCanvasElement,
  paint: (sketch: Sketcher) => void
) => (
  page.save(),
  page.setTransform(mm, 0, 0, mm, 0, 0),
  (page.lineCap = 'round'),
  (page.lineJoin = 'round'),
  paint(sketcher(page, mm, paper)),
  page.restore()
);

export var heading = (
  sketch: Sketcher,
  text: string,
  x: number,
  y: number,
  seed: number
) => (
  sketch.write(text, x, y, { size: 7.2, pencil: 'dark', bold: true }),
  sketch.draw(
    [
      line(
        [x, y + 1.8],
        [x + sketch.measure(text, 7.2, true) + 1, y + 2.1],
        seed
      ),
    ],
    'dark'
  )
);
