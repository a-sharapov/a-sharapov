import { desk } from './desk';
import { perspective } from './figures';
import {
  arrow,
  box,
  corners,
  dashed,
  dimension,
  ellipse,
  heading,
  line,
  lines,
  type Point,
  path,
  polygon,
  polyline,
  rounded,
  type Sketcher,
} from './pencil';

var _window = (
  sketch: Sketcher,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number
) => (
  sketch.erase(corners(x, y, w, h)),
  sketch.draw([rounded(x, y, w, h, 1.6, seed)], 'soft', 1.05),
  sketch.draw(
    [
      line([x, y + 4.4], [x + w, y + 4.4], seed + 1, 0.5),
      ...[0, 1, 2].map((i) =>
        ellipse(x + 2.6 + i * 2.6, y + 2.2, 0.75, 0.75, seed + 2 + i, {
          hand: 0.15,
        })
      ),
    ],
    'soft',
    0.9
  ),
  sketch.draw(
    [rounded(x + 11, y + 1.2, Math.min(w * 0.5, 48), 2.1, 1, seed + 5, 0.4)],
    'hard',
    1.1
  )
);

var _phone = (
  sketch: Sketcher,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number
) => (
  sketch.erase(corners(x, y, w, h)),
  sketch.draw(
    [
      rounded(x, y, w, h, Math.min(3.6, w * 0.16), seed),
      rounded(
        x + 1,
        y + 1,
        w - 2,
        h - 2,
        Math.min(2.8, w * 0.12),
        seed + 1,
        0.5
      ),
    ],
    'soft'
  ),
  sketch.draw(
    [
      rounded(
        x + w / 2 - w * 0.12,
        y + 1.9,
        w * 0.24,
        1.3,
        0.65,
        seed + 2,
        0.3
      ),
      line(
        [x + w / 2 - w * 0.15, y + h - 2.2],
        [x + w / 2 + w * 0.15, y + h - 2.2],
        seed + 3,
        0.3
      ),
    ],
    'soft',
    0.9
  )
);

var _avatar = (
  sketch: Sketcher,
  cx: number,
  cy: number,
  r: number,
  seed: number
) =>
  sketch.draw(
    [
      ellipse(cx, cy, r, r, seed, { hand: 0.3 }),
      ellipse(cx, cy - r * 0.25, r * 0.33, r * 0.33, seed + 1, { hand: 0.15 }),
      ellipse(cx, cy + r * 0.62, r * 0.58, r * 0.38, seed + 2, {
        from: 0.53,
        to: 0.97,
        hand: 0.15,
      }),
    ],
    'soft',
    0.9
  );

var _plate = (
  sketch: Sketcher,
  text: string,
  cx: number,
  baseline: number,
  size: number,
  bold: boolean
) =>
  ((width) =>
    sketch.erase(
      corners(
        cx - width / 2 - 0.5,
        baseline - size * 0.6,
        width + 1,
        size * 0.78
      ),
      0.9
    ))(sketch.measure(text, size, bold));

var _button = (
  sketch: Sketcher,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  seed: number,
  { filled = false, red = false, size = 2.2 } = {}
) => (
  filled &&
    sketch.hatch(corners(x, y, w, h), {
      step: 0.45,
      angle: -0.8,
      weight: red ? 1.1 : 0.8,
      pencil: red ? 'red' : 'shade',
      seed: seed + 1,
    }),
  sketch.draw(
    [rounded(x, y, w, h, h / 2, seed, 0.3)],
    filled ? 'dark' : 'soft',
    0.95
  ),
  filled &&
    _plate(sketch, text, x + w / 2, y + h / 2 + size * 0.28, size, true),
  sketch.write(text, x + w / 2, y + h / 2 + size * 0.28, {
    size,
    align: 'center',
    pencil: 'dark',
    bold: filled,
  })
);

var _label = (sketch: Sketcher, text: string, x: number, y: number) =>
  sketch.write(text, x, y, { size: 3.4, pencil: 'dark', bold: true });

var _site = (sketch: Sketcher) => {
  const x = 16;
  const y = 22;
  const w = 84;
  const h = 50;
  _window(sketch, x, y, w, h, 100);
  sketch.clip(corners(x + 0.4, y + 12.8, w - 0.8, h - 17.4), () =>
    desk(
      sketch,
      perspective({
        eye: [4, 34, 44],
        target: [-1, 3, -12],
        zoom: 58,
        at: [x + w / 2 + 2, y + 30],
        hand: 0.5,
      }),
      110,
      0.7
    )
  );
  sketch.write('а. шарапов', x + 3, y + 10.4, {
    size: 3.8,
    pencil: 'dark',
    bold: true,
  });
  const items = ['визитка', 'cv', 'услуги', 'контакты'];
  const widths = items.map((text) => sketch.measure(text, 3));
  const gap = 2.6;
  const start =
    x +
    70.5 -
    widths.reduce((sum, width) => sum + width, 0) -
    gap * (items.length - 1);
  const lefts = widths.map(
    (_, i) =>
      start +
      widths.slice(0, i).reduce((sum, width) => sum + width, 0) +
      gap * i
  );
  items.forEach((text, i) => {
    sketch.write(text, lefts[i]!, y + 10, {
      size: 3,
      pencil: i === 2 ? 'dark' : 'soft',
    });
    i > 0 &&
      sketch.draw(
        [
          ellipse(lefts[i]! - gap / 2, y + 9.2, 0.22, 0.22, 126 + i, {
            hand: 0.05,
          }),
        ],
        'soft'
      );
  });
  sketch.draw(
    [
      line(
        [lefts[2]! - 0.3, y + 4.9],
        [lefts[2]! + widths[2]! + 0.3, y + 4.9],
        130,
        0.1
      ),
    ],
    'red',
    1.2
  );
  sketch.draw(
    [
      ellipse(x + 75.4, y + 8.4, 1.6, 1.7, 131, {
        from: 0.32,
        to: 1.18,
        hand: 0.1,
      }),
      line([x + 74.6, y + 10.2], [x + 76.2, y + 10.2], 132, 0.05),
      ...polygon(
        [
          [x + 79.2, y + 7.6],
          [x + 80.2, y + 7.6],
          [x + 81.6, y + 6.6],
          [x + 81.6, y + 10.2],
          [x + 80.2, y + 9.2],
          [x + 79.2, y + 9.2],
        ],
        133,
        0.05
      ),
    ],
    'soft',
    0.9
  );
  sketch.draw([line([x, y + 12.6], [x + w, y + 12.6], 134, 0.4)], 'hard', 0.7);
  sketch.draw(
    [line([x, y + h - 4.4], [x + w, y + h - 4.4], 135, 0.4)],
    'hard',
    1.1
  );
  sketch.write('© копилефт · политика данных', x + w / 2, y + h - 1.3, {
    size: 2.4,
    align: 'center',
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw(dimension([x, y + 4.4], [x, y + 12.6], 2.4, 136), 'hard', 1.2);
  sketch.write('3.5rem', 12.6, y + 10.6, {
    size: 2.2,
    pencil: 'hard',
    weight: 1.4,
    turn: -Math.PI / 2,
    align: 'center',
  });
  sketch.draw(
    arrow(
      [x + 63, y - 3.4],
      [lefts[2]! + widths[2]! + 6, y - 2.6],
      [lefts[2]! + widths[2]! / 2 + 1, y + 4],
      138,
      1.4
    ),
    'red'
  );
  sketch.write('красная черта над текущим', x + 64, y - 2.4, {
    size: 2.8,
    pencil: 'red',
  });
};

var _mobile = (sketch: Sketcher) => {
  const x = 107;
  const y = 22;
  const w = 27;
  const h = 50;
  _phone(sketch, x, y, w, h, 200);
  sketch.write('а. ш.', x + 3.2, y + 7.8, {
    size: 3,
    pencil: 'dark',
    bold: true,
  });
  sketch.draw(
    [0, 1, 2].map((i) =>
      line(
        [x + w - 7, y + 5.6 + i * 1.1],
        [x + w - 3.4, y + 5.6 + i * 1.1],
        204 + i,
        0.2
      )
    ),
    'soft'
  );
  sketch.draw(
    [rounded(x + 2.4, y + 10, w - 4.8, 31.4, 0.8, 207, 0.4)],
    'soft',
    0.9
  );
  sketch.hatch(corners(x + 2.4, y + 10, w - 4.8, 31.4), {
    step: 1.6,
    angle: -0.6,
    weight: 0.25,
    seed: 208,
  });
  sketch.erase(corners(x + 3.8, y + 11.4, w - 7.6, 28.6), 0.92);
  sketch.write('услуги', x + 5, y + 15.8, {
    size: 3.6,
    pencil: 'dark',
    bold: true,
  });
  sketch.draw(lines(x + 5, y + 18.4, w - 10.4, 3, 1.5, 210), 'hard', 1.3);
  ['имиджевые 3d сайты', 'интеграция ии', 'веб-приложения'].forEach(
    (text, i) => {
      sketch.draw(
        [rounded(x + 5, y + 23.2 + i * 3.3, 1.1, 1.1, 0.2, 212 + i, 0.1)],
        'red',
        0.9
      );
      sketch.write(text, x + 7.2, y + 24.3 + i * 3.3, { size: 2.2 });
    }
  );
  _button(sketch, x + 5, y + 34.4, 13, 3.4, 'заявка', 218, {
    filled: true,
    red: true,
  });
  sketch.draw(
    [line([x + 2.4, y + h - 5.6], [x + w - 2.4, y + h - 5.6], 220, 0.3)],
    'hard',
    0.8
  );
  sketch.draw(
    dimension([x, y + h + 1.4], [x + w, y + h + 1.4], 1.2, 221),
    'hard',
    1.2
  );
  sketch.write('390', x + w / 2, y + h + 6, {
    size: 2.6,
    align: 'center',
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw(
    arrow([x - 1.4, y + 30], [x - 4, y + 32], [x - 6.4, y + 30], 223, 1.2),
    'soft',
    0.8
  );
};

var _bubble = (
  sketch: Sketcher,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  mine: boolean,
  seed: number
) => (
  sketch.draw([rounded(bx, by, bw, bh, 1.6, seed, 0.4)], 'soft', 0.95),
  mine &&
    sketch.hatch(corners(bx, by, bw, bh), {
      step: 0.9,
      angle: -0.8,
      weight: 0.4,
      seed: seed + 1,
    }),
  sketch.draw(
    polyline(
      mine
        ? [
            [bx + bw - 1.4, by + bh],
            [bx + bw + 0.6, by + bh + 1],
            [bx + bw - 3, by + bh - 0.2],
          ]
        : [
            [bx + 1.4, by + bh],
            [bx - 0.6, by + bh + 1],
            [bx + 3, by + bh - 0.2],
          ],
      seed + 2,
      0.2
    ),
    'soft',
    0.9
  )
);

var _chat = (sketch: Sketcher) => {
  const x = 16;
  const y = 81;
  const w = 28;
  const h = 52;
  _phone(sketch, x, y, w, h, 300);
  _avatar(sketch, x + 5.2, y + 7.6, 2, 303);
  sketch.write('консультант', x + 8.2, y + 7.4, {
    size: 2.9,
    pencil: 'dark',
    bold: true,
  });
  sketch.draw([ellipse(x + 8.9, y + 9.6, 0.4, 0.4, 307, { hand: 0.1 })], 'red');
  sketch.write('в сети', x + 10.2, y + 10.4, {
    size: 2.3,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw(
    [line([x + 1, y + 11.8], [x + w - 1, y + 11.8], 309, 0.3)],
    'hard',
    0.8
  );
  _bubble(sketch, x + 2.4, y + 13.4, 17.6, 6.8, false, 310);
  sketch.write('здравствуйте!', x + 3.6, y + 16.4, { size: 2.5 });
  sketch.write('чем помочь?', x + 3.6, y + 19.2, { size: 2.5 });
  _bubble(sketch, x + 8.6, y + 22.4, 16.8, 4, true, 315);
  sketch.write('нужен сайт с 3d', x + 9.8, y + 25.3, {
    size: 2.4,
    pencil: 'dark',
  });
  _bubble(sketch, x + 2.4, y + 28.6, 19.4, 12, false, 320);
  const image = corners(x + 3.8, y + 29.8, 16.6, 6.8);
  sketch.hatch(image, { step: 0.9, weight: 0.45, seed: 323 });
  sketch.draw(
    [
      ...polygon(image, 324, 0.2),
      line(image[0]!, image[2]!, 328, 0.2),
      line(image[1]!, image[3]!, 329, 0.2),
    ],
    'soft',
    0.85
  );
  sketch.write('пример: этот стол', x + 3.8, y + 39.2, { size: 2.3 });
  _button(sketch, x + 2.4, y + 41.8, 9.4, 2.8, 'смета', 330, { size: 2.1 });
  _button(sketch, x + 12.6, y + 41.8, 10.4, 2.8, 'созвон', 332, { size: 2.1 });
  sketch.draw(
    [rounded(x + 2.4, y + h - 6.2, w - 9, 3.2, 1.6, 344, 0.3)],
    'soft',
    0.9
  );
  sketch.write('сообщение…', x + 3.8, y + h - 3.9, {
    size: 2.2,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw(
    [
      rounded(x + w - 5.4, y + h - 6.3, 2, 2.8, 1, 345, 0.1),
      ellipse(x + w - 4.4, y + h - 4.2, 1.5, 1.5, 346, {
        from: 0.05,
        to: 0.45,
        hand: 0.1,
      }),
      line([x + w - 4.4, y + h - 2.7], [x + w - 4.4, y + h - 2.1], 347, 0.1),
    ],
    'soft',
    0.9
  );
};

var _crm = (sketch: Sketcher) => {
  const x = 50;
  const y = 81;
  const w = 87;
  const h = 52;
  _window(sketch, x, y, w, h, 400);
  sketch.draw([line([x + 9, y + 4.4], [x + 9, y + h], 401, 0.4)], 'soft', 0.8);
  sketch.hatch(corners(x + 0.4, y + 4.6, 8.4, h - 5), {
    step: 1.1,
    angle: -0.6,
    weight: 0.3,
    seed: 402,
  });
  [0, 1, 2, 3, 4].forEach(
    (i) =>
      void sketch.draw(
        [rounded(x + 2.8, y + 8 + i * 5.4, 3.4, 3.4, 0.8, 403 + i, 0.2)],
        i === 1 ? 'dark' : 'soft',
        0.9
      )
  );
  [
    { title: 'заявки', value: '24' },
    { title: 'в работе', value: '7' },
    { title: 'выручка', value: '180к' },
  ].forEach(({ title, value }, i) => {
    const cx = x + 12 + i * 19.6;
    sketch.draw([rounded(cx, y + 6.6, 17.6, 9, 1, 410 + i, 0.3)], 'soft', 0.9);
    sketch.write(title, cx + 1.6, y + 9.8, {
      size: 2.4,
      pencil: 'hard',
      weight: 1.4,
    });
    sketch.write(value, cx + 1.6, y + 14.4, {
      size: 4.6,
      pencil: 'dark',
      bold: true,
    });
    sketch.draw(
      [
        path(
          Array.from(
            { length: 6 },
            (_, k): Point => [
              cx + 10 + k * 1.3,
              y + 13.6 - Math.sin(k * 1.3 + i) * 1.1 - k * 0.25,
            ]
          ),
          419 + i,
          { hand: 0.2 }
        ),
      ],
      i === 2 ? 'red' : 'soft',
      0.9
    );
  });
  [
    { title: 'новые', cards: ['telegram', 'сайт', 'почта', 'звонок'] },
    { title: 'в работе', cards: ['сайт', 'telegram', 'почта'] },
    { title: 'готово', cards: ['сайт', 'почта'] },
  ].forEach(({ title, cards }, column) => {
    const cx = x + 12 + column * 15;
    sketch.write(title, cx, y + 20.2, {
      size: 2.7,
      pencil: 'dark',
      bold: true,
    });
    sketch.draw(
      [line([cx, y + 21.2], [cx + 13, y + 21.2], 433 + column, 0.3)],
      'hard',
      0.9
    );
    cards.forEach((card, k) => {
      const cy = y + 22.6 + k * 7;
      sketch.draw(
        [rounded(cx, cy, 13, 6, 0.8, 436 + column * 5 + k, 0.3)],
        column === 0 && k === 0 ? 'red' : 'soft',
        0.9
      );
      sketch.write(card, cx + 1.2, cy + 2.7, { size: 2.3 });
      sketch.draw(
        lines(cx + 1.2, cy + 4.3, 6, 1, 1, 468 + column * 5 + k),
        'hard',
        1.2
      );
      sketch.draw(
        [
          ellipse(cx + 11, cy + 4, 0.9, 0.9, 484 + column * 5 + k, {
            hand: 0.1,
          }),
        ],
        'soft',
        0.8
      );
    });
  });
  sketch.draw(
    arrow(
      [x + 25.4, y + 25.6],
      [x + 30, y + 22],
      [x + 33.4, y + 25.2],
      500,
      1.2
    ),
    'red',
    0.9
  );
  const chart = { x: x + 58.4, y: y + 20.4, w: 26, h: 13.4 };
  sketch.write('заявки по неделям', chart.x, chart.y - 0.8, {
    size: 2.3,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw(
    [
      line(
        [chart.x, chart.y + chart.h],
        [chart.x + chart.w, chart.y + chart.h],
        502,
        0.3
      ),
      line([chart.x, chart.y + 1], [chart.x, chart.y + chart.h], 503, 0.3),
    ],
    'soft',
    0.9
  );
  [5, 8, 6.4, 10, 8.6, 12].forEach((value, i) => {
    const bar = corners(
      chart.x + 1.6 + i * 4,
      chart.y + chart.h - value,
      2.6,
      value
    );
    sketch.draw(polygon(bar, 504 + i, 0.2), 'soft', 0.85);
    sketch.hatch(bar, {
      step: 0.5,
      angle: -0.9,
      weight: i === 5 ? 1.2 : 0.7,
      pencil: i === 5 ? 'red' : 'shade',
      seed: 512 + i,
    });
  });
  const donut = { cx: x + 64.4, cy: y + 43.6, r: 5 };
  sketch.draw(
    [
      ellipse(donut.cx, donut.cy, donut.r, donut.r, 520, { hand: 0.3 }),
      ellipse(donut.cx, donut.cy, donut.r * 0.5, donut.r * 0.5, 521, {
        hand: 0.2,
      }),
    ],
    'soft'
  );
  sketch.hatch(
    [
      ...Array.from({ length: 13 }, (_, i): Point => {
        const a = -Math.PI / 2 + (i / 12) * Math.PI * 1.2;
        return [
          donut.cx + Math.cos(a) * donut.r,
          donut.cy + Math.sin(a) * donut.r,
        ];
      }),
      ...Array.from({ length: 13 }, (_, i): Point => {
        const a = -Math.PI / 2 + ((12 - i) / 12) * Math.PI * 1.2;
        return [
          donut.cx + Math.cos(a) * donut.r * 0.5,
          donut.cy + Math.sin(a) * donut.r * 0.5,
        ];
      }),
    ],
    { step: 0.5, weight: 1, seed: 522 }
  );
  ['сайт', 'бот', 'почта'].forEach((text, i) => {
    sketch.draw(box(x + 72, y + 40 + i * 2.8, 1, 1, 526 + i, 0.1), 'soft');
    sketch.write(text, x + 74, y + 41.1 + i * 2.8, { size: 2.3 });
  });
};

var _flow = (sketch: Sketcher) => {
  const y = 141.5;
  const w = 18;
  const h = 32;
  const xs = [16, 40, 64, 88];
  _label(sketch, 'поток экранов', 16, 139);
  xs.forEach((x, i) => void _phone(sketch, x, y, w, h, 600 + i * 10));
  ((x) => (
    sketch.hatch(ellipse(x + 9, y + 10.6, 4.4, 4.4, 640), {
      step: 0.55,
      weight: 0.8,
      seed: 641,
    }),
    sketch.draw(
      [ellipse(x + 9, y + 10.6, 4.4, 4.4, 642, { hand: 0.3 })],
      'soft'
    ),
    sketch.erase(ellipse(x + 7.6, y + 9.2, 1.6, 1.6, 643), 0.9),
    sketch.write('добро', x + 9, y + 19.4, {
      size: 2.6,
      align: 'center',
      pencil: 'dark',
      bold: true,
    }),
    sketch.write('пожаловать', x + 9, y + 22, { size: 2.4, align: 'center' }),
    sketch.draw(
      [0, 1, 2].map((k) =>
        ellipse(x + 7.4 + k * 1.6, y + 24.4, 0.4, 0.4, 644 + k, { hand: 0.05 })
      ),
      'soft'
    ),
    sketch.smudge(
      ellipse(x + 7.4, y + 24.4, 0.4, 0.4, 647, { hand: 0.05 }),
      0.6
    ),
    _button(sketch, x + 3, y + 25.8, 12, 3, 'начать', 648, {
      filled: true,
      size: 2,
    })
  ))(xs[0]!);
  ((x) => (
    sketch.write('вход', x + 3, y + 8, {
      size: 3.4,
      pencil: 'dark',
      bold: true,
    }),
    sketch.draw(
      [
        rounded(x + 3, y + 10, 12, 3, 0.6, 650, 0.2),
        rounded(x + 3, y + 14.2, 12, 3, 0.6, 651, 0.2),
      ],
      'soft',
      0.9
    ),
    sketch.write('почта', x + 4, y + 12.2, {
      size: 2.1,
      pencil: 'hard',
      weight: 1.4,
    }),
    sketch.draw(
      [0, 1, 2, 3, 4].map((k) =>
        ellipse(x + 4.6 + k * 1.2, y + 15.7, 0.3, 0.3, 652 + k, { hand: 0.05 })
      ),
      'dark'
    ),
    _button(sketch, x + 3, y + 19.2, 12, 3.2, 'войти', 658, {
      filled: true,
      size: 2.1,
    }),
    sketch.write('забыли пароль?', x + 9, y + 25.8, {
      size: 1.9,
      align: 'center',
      pencil: 'hard',
      weight: 1.4,
    }),
    sketch.draw([ellipse(x + 9, y + 20.8, 7.6, 2.9, 660)], 'red')
  ))(xs[1]!);
  ((x) => (
    sketch.draw(
      [
        rounded(x + 2.6, y + 4.8, 12.8, 2.8, 1.4, 670, 0.2),
        ellipse(x + 4.2, y + 6.1, 0.6, 0.6, 671, { hand: 0.05 }),
      ],
      'soft',
      0.9
    ),
    sketch.write('поиск', x + 5.6, y + 7, {
      size: 1.9,
      pencil: 'hard',
      weight: 1.4,
    }),
    ['анна', 'заказ 12', 'отчёт', 'встреча'].forEach((text, k) => {
      const ry = y + 9.6 + k * 4.4;
      sketch.draw(
        [ellipse(x + 4.2, ry + 1.6, 1.2, 1.2, 672 + k, { hand: 0.1 })],
        'soft',
        0.9
      );
      sketch.write(text, x + 6.2, ry + 1.6, { size: 2.1 });
      sketch.draw(lines(x + 6.2, ry + 2.8, 8, 1, 1, 676 + k), 'hard', 1.1);
    }),
    sketch.draw(
      [line([x + 1, y + 27.4], [x + w - 1, y + 27.4], 680, 0.2)],
      'hard',
      0.9
    ),
    sketch.draw(
      [0, 1, 2, 3].map((k) =>
        rounded(x + 3 + k * 3.4, y + 28.2, 1.4, 1.4, 0.4, 681 + k, 0.05)
      ),
      'soft',
      0.9
    )
  ))(xs[2]!);
  ((x) => {
    const image = corners(x + 2.6, y + 4.6, 12.8, 8.4);
    sketch.hatch(corners(x + 2.6, y + 4.6, 5, 8.4), {
      step: 0.6,
      weight: 0.5,
      seed: 690,
    });
    sketch.draw(
      [
        ...polygon(image, 691, 0.2),
        line(image[0]!, image[2]!, 695, 0.2),
        line(image[1]!, image[3]!, 696, 0.2),
      ],
      'soft',
      0.85
    );
    sketch.write('карточка', x + 2.8, y + 16.2, {
      size: 2.7,
      pencil: 'dark',
      bold: true,
    });
    sketch.write('2 490 р.', x + 2.8, y + 19, { size: 2.3 });
    sketch.draw(lines(x + 2.8, y + 20.6, 11, 2, 1.2, 697), 'hard', 1.1);
    _button(sketch, x + 3, y + 24.6, 12, 3, 'в корзину', 698, {
      filled: true,
      red: true,
      size: 1.9,
    });
  })(xs[3]!);
  xs.slice(0, 3).forEach(
    (x, i) =>
      void sketch.draw(
        arrow(
          [x + w + 0.6, y + 15],
          [x + w + 3, y + 13.6],
          [x + w + 5.4, y + 15],
          700 + i,
          1.1
        ),
        i === 1 ? 'red' : 'soft',
        0.9
      )
  );
  ['1 · онбординг', '2 · вход', '3 · список', '4 · карточка'].forEach(
    (text, i) => void sketch.write(text, xs[i]!, y + h + 4, { size: 2.7 })
  );
};

var _states = (sketch: Sketcher) => {
  const x = 112;
  _label(sketch, 'состояния', x, 139);
  ['обычная', 'наведение', 'нажата', 'неактивна'].forEach((state, i) => {
    const y = 142 + i * 5.2;
    void [
      () => sketch.draw([rounded(x, y, 11, 3.6, 1.8, 720 + i, 0.3)], 'soft'),
      () => (
        sketch.draw([rounded(x, y, 11, 3.6, 1.8, 720 + i, 0.3)], 'dark'),
        sketch.draw(
          [line([x + 1.6, y + 4.3], [x + 10, y + 4.3], 724, 0.2)],
          'hard',
          1.2
        )
      ),
      () => (
        sketch.hatch(corners(x, y, 11, 3.6), {
          step: 0.45,
          weight: 1,
          seed: 725,
        }),
        sketch.draw([rounded(x, y, 11, 3.6, 1.8, 720 + i, 0.3)], 'dark'),
        _plate(sketch, 'кнопка', x + 5.5, y + 2.95, 2.1, false)
      ),
      () =>
        sketch.draw(
          dashed(corners(x, y, 11, 3.6).concat([[x, y]]), 726, 0.9, 0.7),
          'hard',
          1.1
        ),
    ][i]!();
    sketch.write('кнопка', x + 5.5, y + 2.7 + (i === 2 ? 0.25 : 0), {
      size: 2.1,
      align: 'center',
      pencil: i === 3 ? 'hard' : 'dark',
      weight: i === 3 ? 1.2 : 1,
    });
    sketch.write(state, x + 12.6, y + 2.7, {
      size: 2.4,
      pencil: 'hard',
      weight: 1.4,
    });
  });
  sketch.draw([rounded(x, 163, 23, 3.6, 0.6, 730, 0.3)], 'soft');
  sketch.write('поле ввода', x + 1.2, 165.7, {
    size: 2.2,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw([line([x + 12, 163.8], [x + 12, 165.9], 731, 0.05)], 'red', 1.2);
  sketch.draw(box(x, 169, 2.4, 2.4, 732, 0.2), 'soft');
  sketch.draw(
    [
      line([x + 0.4, 170.2], [x + 1.1, 171], 733, 0.1),
      line([x + 1.1, 171], [x + 2.6, 168.6], 734, 0.1),
    ],
    'dark'
  );
  sketch.write('да', x + 3.4, 171.3, { size: 2.4 });
  sketch.draw([ellipse(x + 10.6, 170.2, 1.2, 1.2, 735, { hand: 0.1 })], 'soft');
  sketch.smudge(ellipse(x + 10.6, 170.2, 0.55, 0.55, 736, { hand: 0.05 }), 0.7);
  sketch.write('нет', x + 12.6, 171.3, { size: 2.4 });
};

var _form = (sketch: Sketcher) => {
  const x = 16;
  _label(sketch, 'форма заявки', x, 183.4);
  sketch.write('имя', x, 188, { size: 2.5, pencil: 'hard', weight: 1.4 });
  sketch.draw([rounded(x, 188.8, 30, 3.8, 0.6, 800, 0.3)], 'soft');
  sketch.write('телефон или почта', x, 195.8, {
    size: 2.5,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw([rounded(x, 196.6, 30, 3.8, 0.6, 801, 0.3)], 'soft');
  sketch.write('задача', x + 34, 188, {
    size: 2.5,
    pencil: 'hard',
    weight: 1.4,
  });
  sketch.draw([rounded(x + 34, 188.8, 34, 7, 0.6, 802, 0.3)], 'soft');
  sketch.draw(lines(x + 35.4, 191, 30, 2, 1.6, 803), 'hard', 0.9);
  sketch.draw(box(x + 34, 198.2, 2.2, 2.2, 804, 0.2), 'soft');
  sketch.draw(
    [
      line([x + 34.4, 199.2], [x + 35, 199.9], 805, 0.1),
      line([x + 35, 199.9], [x + 36.4, 197.6], 806, 0.1),
    ],
    'red'
  );
  sketch.write('согласие', x + 37, 200.2, {
    size: 2.3,
    pencil: 'hard',
    weight: 1.4,
  });
  _button(sketch, x + 50, 197.4, 18, 3.8, 'отправить', 807, {
    filled: true,
    red: true,
    size: 2.3,
  });
  sketch.draw(
    polygon(
      [
        [x + 70, 199.6],
        [x + 74, 197.8],
        [x + 72.6, 201.2],
        [x + 71.6, 200.2],
      ],
      810,
      0.1
    ),
    'soft'
  );
};

var _glyphs = (sketch: Sketcher) => {
  _label(sketch, 'иконки шапки', 90, 183.4);
  const bulb = { cx: 95, cy: 193 };
  sketch.draw(
    [
      ellipse(bulb.cx, bulb.cy, 3.2, 3.4, 900, {
        from: 0.32,
        to: 1.18,
        hand: 0.2,
      }),
      line(
        [bulb.cx - 1.7, bulb.cy + 3],
        [bulb.cx - 1.4, bulb.cy + 4.8],
        901,
        0.1
      ),
      line(
        [bulb.cx + 1.7, bulb.cy + 3],
        [bulb.cx + 1.4, bulb.cy + 4.8],
        902,
        0.1
      ),
      line(
        [bulb.cx - 1.5, bulb.cy + 5.7],
        [bulb.cx + 1.5, bulb.cy + 5.7],
        903,
        0.1
      ),
      line(
        [bulb.cx - 1, bulb.cy + 6.8],
        [bulb.cx + 1, bulb.cy + 6.8],
        904,
        0.1
      ),
      path(
        [
          [bulb.cx - 0.9, bulb.cy + 1.4],
          [bulb.cx - 0.35, bulb.cy - 0.4],
          [bulb.cx + 0.35, bulb.cy + 1.2],
          [bulb.cx + 0.9, bulb.cy - 0.4],
        ],
        905,
        { hand: 0.1 }
      ),
    ],
    'soft',
    1.05
  );
  sketch.draw(
    [-2.3, -1.2, 0, 1.2, 2.3].map((a, i) =>
      line(
        [bulb.cx + Math.sin(a * 0.5) * 4.6, bulb.cy - Math.cos(a * 0.5) * 5],
        [bulb.cx + Math.sin(a * 0.5) * 6, bulb.cy - Math.cos(a * 0.5) * 6.4],
        906 + i,
        0.1
      )
    ),
    'red'
  );
  sketch.draw(
    [
      line(
        [bulb.cx - 2.2, bulb.cy + 8.6],
        [bulb.cx + 2.2, bulb.cy + 8.6],
        926,
        0.2
      ),
    ],
    'red',
    1.1
  );
  sketch.write('тема', bulb.cx, 205, {
    size: 2.6,
    align: 'center',
    pencil: 'hard',
    weight: 1.4,
  });
  const speaker = { x: 104, y: 192 };
  sketch.draw(
    [
      ...polygon(
        [
          [speaker.x, speaker.y],
          [speaker.x + 2, speaker.y],
          [speaker.x + 4.6, speaker.y - 2.6],
          [speaker.x + 4.6, speaker.y + 6.6],
          [speaker.x + 2, speaker.y + 4],
          [speaker.x, speaker.y + 4],
        ],
        912,
        0.1
      ),
      ...[2.4, 4.2].map((r, i) =>
        ellipse(speaker.x + 5, speaker.y + 2, r, r, 920 + i, {
          from: -0.16,
          to: 0.16,
          hand: 0.1,
        })
      ),
    ],
    'soft',
    1.05
  );
  sketch.draw(
    [
      line(
        [speaker.x + 6, speaker.y + 0.2],
        [speaker.x + 9.4, speaker.y + 3.8],
        924,
        0.1
      ),
      line(
        [speaker.x + 9.4, speaker.y + 0.2],
        [speaker.x + 6, speaker.y + 3.8],
        925,
        0.1
      ),
    ],
    'hard',
    1.2
  );
  sketch.write('звук', speaker.x + 4.4, 205, {
    size: 2.6,
    align: 'center',
    pencil: 'hard',
    weight: 1.4,
  });
  ['вкл', 'выкл'].forEach((text, i) => {
    const tx = 119;
    const ty = 188 + i * 6;
    i === 0 &&
      sketch.hatch(corners(tx, ty, 8, 4), {
        step: 0.6,
        weight: 0.7,
        pencil: 'red',
        seed: 934,
      });
    sketch.draw([rounded(tx, ty, 8, 4, 2, 930 + i, 0.15)], 'soft');
    sketch.erase(ellipse(tx + (i ? 2 : 6), ty + 2, 1.4, 1.4, 936 + i), 0.95);
    sketch.draw(
      [ellipse(tx + (i ? 2 : 6), ty + 2, 1.4, 1.4, 932 + i, { hand: 0.1 })],
      'dark'
    );
    sketch.write(text, tx + 9.4, ty + 2.9, { size: 2.6 });
  });
  sketch.write('превью при наведении', 119, 205, {
    size: 2.3,
    pencil: 'hard',
    weight: 1.4,
  });
};

export var MOCKUPS: Array<(sketch: Sketcher) => void> = [
  (sketch) => (
    heading(sketch, 'интерфейсы', 16, 16, 1000),
    sketch.write('сайты и приложения', 137, 15.6, {
      size: 3.2,
      align: 'right',
    }),
    _site(sketch),
    _mobile(sketch)
  ),
  (sketch) => (_chat(sketch), _crm(sketch)),
  (sketch) => (_flow(sketch), _states(sketch)),
  (sketch) => (_form(sketch), _glyphs(sketch)),
];
