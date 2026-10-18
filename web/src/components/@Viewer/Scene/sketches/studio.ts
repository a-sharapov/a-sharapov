import { desk } from './desk';
import { perspective, type View } from './figures';
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
  polygon,
  polyline,
  rounded,
  type Sketcher,
} from './pencil';

var _note = (
  sketch: Sketcher,
  anchor: Point,
  label: Point,
  text: string,
  seed: number,
  align: CanvasTextAlign = 'left'
) => (
  sketch.draw(
    [
      line(
        anchor,
        [label[0] + (align === 'right' ? 1 : -1), label[1] - 1],
        seed,
        0.4
      ),
    ],
    'hard',
    1.1
  ),
  sketch.draw(
    [ellipse(anchor[0], anchor[1], 0.45, 0.45, seed + 1, { hand: 0.2 })],
    'soft'
  ),
  sketch.write(text, label[0], label[1], { size: 3.3, align })
);

var _scene = (sketch: Sketcher) => {
  const view = perspective({
    eye: [4, 34, 44],
    target: [-1, 3, -12],
    zoom: 118,
    at: [70, 54],
  });
  const at = desk(sketch, view, 20);
  _note(sketch, at.lamp, [103, 28], 'лампа — свет вечером', 300);
  _note(sketch, at.pile, [16, 26], 'стопка: cv, услуги, 404', 303);
  _note(sketch, at.holder, [12, 57], 'стакан', 306);
  _note(sketch, at.card, [33, 93], 'визитка 90×50, клик — оборот', 309);
  _note(sketch, at.cup, [111, 71], 'чашка, пар', 312);
  sketch.draw(
    [
      ...arrow([96, 84], [118, 90], [126, 46], 320, 2.4),
      ...[0.15, 0.45, 0.75].map((t, i) =>
        ((x, y) => ellipse(x, y, 0.55, 0.55, 324 + i, { hand: 0.2 }))(
          (1 - t) ** 2 * 96 + 2 * (1 - t) * t * 118 + t * t * 126,
          (1 - t) ** 2 * 84 + 2 * (1 - t) * t * 90 + t * t * 46
        )
      ),
    ],
    'red'
  );
  sketch.draw(
    [
      ...box(121.4, 37, 7.2, 4.4, 330, 0.5),
      ...polygon(
        [
          [121.4, 38.2],
          [118, 37],
          [118, 42.6],
          [121.4, 40.6],
        ],
        331,
        0.4
      ),
      ellipse(123.2, 35.2, 1.6, 1.6, 332, { hand: 0.2 }),
      ellipse(126.8, 35.2, 1.6, 1.6, 333, { hand: 0.2 }),
    ],
    'red',
    0.9
  );
  sketch.write('отъезд камеры', 121, 58, {
    size: 3.1,
    pencil: 'red',
    align: 'right',
  });
};

var _node = (
  sketch: Sketcher,
  x: number,
  y: number,
  text: string,
  seed: number,
  { width = 15, loose = false } = {}
) => (
  sketch.draw(
    loose
      ? dashed(corners(x, y, width, 6).concat([[x, y]]), seed, 1, 0.8)
      : [rounded(x, y, width, 6, 1.2, seed, 0.4)],
    loose ? 'hard' : 'soft',
    loose ? 1.3 : 1
  ),
  sketch.write(text, x + width / 2, y + 4.3, { size: 3.1, align: 'center' })
);

var _sitemap = (sketch: Sketcher) => {
  sketch.write('карта сайта', 11, 104.4, {
    size: 3.4,
    pencil: 'dark',
    bold: true,
  });
  _node(sketch, 24.5, 107, 'визитка', 400, { width: 20 });
  [
    { x: 11, text: 'cv' },
    { x: 27, text: 'услуги' },
    { x: 43, text: 'контакты' },
  ].forEach(({ x, text }, i) => void _node(sketch, x, 119, text, 402 + i * 2));
  sketch.draw(
    [
      ...polyline(
        [
          [34.5, 113],
          [34.5, 116],
        ],
        410,
        0.3
      ),
      line([18.5, 116], [50.5, 116], 411, 0.3),
      ...[18.5, 34.5, 50.5].map((x, i) =>
        line([x, 116], [x, 119], 412 + i, 0.2)
      ),
      line([18.5, 125], [18.5, 131], 416, 0.2),
      line([50.5, 125], [50.5, 131], 417, 0.2),
    ],
    'soft',
    0.9
  );
  _node(sketch, 11, 131, 'политика', 420);
  _node(sketch, 43, 131, 'форма', 422);
  _node(sketch, 27, 140, '404', 424, { loose: true });
  sketch.write('→ бот в telegram', 43, 142, {
    size: 2.8,
    pencil: 'hard',
    weight: 1.3,
  });
  sketch.write('планшет-рекурсия', 26, 150.4, {
    size: 2.6,
    pencil: 'hard',
    weight: 1.3,
  });
  sketch.draw([ellipse(34.5, 122, 10.6, 5.4, 426)], 'red');
};

var _screen = (
  sketch: Sketcher,
  x: number,
  y: number,
  w: number,
  h: number,
  sheet: [number, number],
  seed: number
) => {
  sketch.draw([rounded(x, y, w, h, 1.2, seed, 0.5)], 'soft');
  sketch.draw(
    [
      line([x, y + 3], [x + w, y + 3], seed + 1, 0.3),
      ...Array.from({ length: Math.max(1, Math.round(w / 10)) }, (_, i) =>
        line(
          [x + w - 2 - i * 2.4, y + 1.6],
          [x + w - 3.2 - i * 2.4, y + 1.6],
          seed + 2 + i,
          0.1
        )
      ),
    ],
    'soft',
    0.8
  );
  const left = x + (w - sheet[0]) / 2;
  const top = y + 4.6;
  sketch.draw(box(left, top, sheet[0], sheet[1], seed + 10, 0.3), 'soft', 0.9);
  sketch.draw(
    lines(
      left + 1.2,
      top + 2,
      sheet[0] - 2.4,
      Math.floor((sheet[1] - 3) / 1.5),
      1.5,
      seed + 11
    ),
    'hard',
    1.1
  );
};

var _breakpoints = (sketch: Sketcher) => {
  sketch.write('адаптив', 64, 104.4, { size: 3.4, pencil: 'dark', bold: true });
  sketch.draw(
    Array.from({ length: 13 }, (_, i) =>
      line([66 + i * 3.1, 110.5], [66 + i * 3.1, 132.6], 500 + i, 0.15)
    ),
    'hard',
    0.45
  );
  _screen(sketch, 64, 107, 42, 27, [12, 21.4], 520);
  _screen(sketch, 110, 109, 17, 25, [13, 18.4], 540);
  _screen(sketch, 129.5, 116, 8, 18, [6.4, 12], 560);
  [
    { from: 64, to: 106, text: '1440' },
    { from: 110, to: 127, text: '768' },
    { from: 129.5, to: 137.5, text: '390' },
  ].forEach(({ from, to, text }, i) => {
    sketch.draw(
      dimension([from, 136], [to, 136], 1.6, 580 + i * 6),
      'hard',
      1.2
    );
    sketch.write(text, (from + to) / 2, 141.4, {
      size: 2.8,
      align: 'center',
      pencil: 'hard',
      weight: 1.4,
    });
  });
  sketch.write('лист всегда в центре кадра', 64, 148, {
    size: 3,
    pencil: 'soft',
  });
};

var _frame = (
  sketch: Sketcher,
  x: number,
  y: number,
  seed: number,
  current: number,
  paint: (view: View) => void,
  view: View
) => (
  sketch.clip(corners(x, y, 27, 15.2), () => paint(view)),
  sketch.erase(corners(x, y, 27, 2.4), 0.92),
  sketch.draw(
    [
      line([x, y + 2.4], [x + 27, y + 2.4], seed + 1, 0.2),
      ...[0, 1, 2, 3].map((i) =>
        line(
          [x + 15 + i * 2.6, y + 1.3],
          [x + 16.6 + i * 2.6, y + 1.3],
          seed + 2 + i,
          0.08
        )
      ),
    ],
    'soft',
    0.8
  ),
  sketch.draw(
    [
      line(
        [x + 15 + current * 2.6, y + 0.35],
        [x + 16.6 + current * 2.6, y + 0.35],
        seed + 6,
        0.08
      ),
    ],
    'red',
    1.2
  ),
  sketch.draw(box(x, y, 27, 15.2, seed, 0.5), 'soft')
);

var _storyboard = (sketch: Sketcher) => {
  const top = 158;
  const frames = [11, 42, 73, 104];
  _frame(
    sketch,
    frames[0]!,
    top,
    700,
    0,
    (view) => void desk(sketch, view, 710, 0.6),
    perspective({
      eye: [19, 6.6, 20],
      target: [2, 4, -6],
      zoom: 15,
      at: [frames[0]! + 13.5, top + 8.4],
      hand: 0.45,
    })
  );
  _frame(
    sketch,
    frames[1]!,
    top,
    720,
    0,
    (view) => void desk(sketch, view, 730, 0.6),
    perspective({
      eye: [4, 34, 44],
      target: [-1, 3, -12],
      zoom: 24,
      at: [frames[1]! + 13.5, top + 7.4],
      hand: 0.4,
    })
  );
  _frame(
    sketch,
    frames[2]!,
    top,
    740,
    1,
    (view) => (
      desk(sketch, view, 750, 0.5),
      sketch.erase(corners(frames[2]! + 9.5, top + 3, 8.6, 11.4)),
      sketch.draw(box(frames[2]! + 9.5, top + 3, 8.6, 11.4, 751, 0.4), 'soft'),
      sketch.draw(
        lines(frames[2]! + 10.6, top + 5, 6.2, 5, 1.5, 752),
        'hard',
        1.3
      )
    ),
    perspective({
      eye: [-2, 80, 2],
      target: [-2, 0, -2],
      zoom: 33,
      at: [frames[2]! + 13.5, top + 8.4],
      up: [0, 0, -1],
      hand: 0.4,
    })
  );
  _frame(
    sketch,
    frames[3]!,
    top,
    760,
    2,
    (view) => (
      desk(sketch, view, 770, 0.5),
      sketch.erase(corners(frames[3]! + 6, top + 3.6, 15, 9.6)),
      sketch.draw(
        [
          ...box(frames[3]! + 6, top + 3.6, 15, 9.6, 771, 0.4),
          line(
            [frames[3]! + 13.5, top + 3.6],
            [frames[3]! + 13.5, top + 13.2],
            772,
            0.3
          ),
        ],
        'soft'
      ),
      sketch.draw(
        lines(frames[3]! + 7.2, top + 5.4, 5, 4, 1.6, 773),
        'hard',
        1.2
      ),
      sketch.draw(
        lines(frames[3]! + 14.6, top + 5.4, 5, 4, 1.6, 774),
        'hard',
        1.2
      )
    ),
    perspective({
      eye: [-2, 80, 2],
      target: [-2, 0, -2],
      zoom: 30,
      at: [frames[3]! + 13.5, top + 8.4],
      up: [0, 0, -1],
      hand: 0.4,
    })
  );
  sketch.write('переходы между страницами', 11, 155.4, {
    size: 3.4,
    pencil: 'dark',
    bold: true,
  });
  ['1 · вступление', '2 · общий план', '3 · cv, лист a4', '4 · услуги'].forEach(
    (text, i) => {
      sketch.write(text, frames[i]!, top + 19.4, { size: 3 });
      i < 3 &&
        sketch.draw(
          arrow(
            [frames[i]! + 27.6, top + 7.6],
            [frames[i]! + 29, top + 7],
            [frames[i]! + 30.6, top + 7.6],
            792 + i,
            1
          ),
          'soft'
        );
    }
  );
};

var _tokens = (sketch: Sketcher) => {
  const y = 183;
  sketch.write('Аа', 11, y + 13, { size: 15, pencil: 'dark', bold: true });
  [
    { text: 'заголовок', size: 4.6, bold: true, mark: '32' },
    { text: 'подзаголовок', size: 3.8, bold: false, mark: '24' },
    { text: 'основной текст', size: 3.2, bold: false, mark: '16' },
    { text: 'подпись', size: 2.7, bold: false, mark: '13' },
  ].forEach(({ text, size, bold, mark }, i) => {
    const baseline = y + 1.4 + [0, 5.6, 10.6, 15][i]!;
    sketch.write(text, 31, baseline, {
      size,
      bold,
      pencil: i === 0 ? 'dark' : 'soft',
    });
    sketch.write(mark, 59, baseline, {
      size: 2.6,
      pencil: 'hard',
      weight: 1.4,
      align: 'right',
    });
  });
  sketch.draw([line([30, y + 18.4], [59, y + 18.4], 900, 0.3)], 'hard', 0.7);
  sketch.write('pt sans · pt sans narrow', 31, y + 22.4, {
    size: 2.8,
    pencil: 'hard',
    weight: 1.4,
  });
  [
    { text: 'бумага', paint: () => undefined },
    {
      text: 'графит',
      paint: (area: Point[]) => (
        sketch.smudge(area, 0.3), sketch.hatch(area, { step: 0.4, seed: 911 })
      ),
    },
    {
      text: 'серый',
      paint: (area: Point[]) =>
        sketch.hatch(area, { step: 0.7, weight: 0.8, seed: 912 }),
    },
    {
      text: 'акцент',
      paint: (area: Point[]) =>
        sketch.hatch(area, {
          step: 0.45,
          pencil: 'red',
          weight: 1.1,
          seed: 913,
        }),
    },
  ].forEach(({ text, paint }, i) => {
    const area = corners(64 + i * 9, y - 2.6, 6.6, 6.6);
    paint(area);
    sketch.draw(polygon(area, 914 + i, 0.3), i === 3 ? 'red' : 'soft', 0.9);
    sketch.write(text, 67.3 + i * 9, y + 7.4, {
      size: 2.6,
      align: 'center',
      pencil: 'hard',
      weight: 1.4,
    });
  });
  [4, 8, 12, 16, 24].reduce((x, space, i) => {
    const side = space / 4;
    sketch.hatch(corners(x, y + 18.6 - side, side, side), {
      step: 0.4,
      weight: 0.8,
      seed: 930 + i,
    });
    sketch.draw(
      polygon(corners(x, y + 18.6 - side, side, side), 935 + i, 0.1),
      'soft',
      0.9
    );
    sketch.write(String(space), x + side / 2, y + 22.2, {
      size: 2.4,
      align: 'center',
      pencil: 'hard',
      weight: 1.4,
    });
    return x + side + 3.2;
  }, 65);
  sketch.write('отступы', 65, y + 13.2, {
    size: 2.6,
    pencil: 'hard',
    weight: 1.4,
  });
};

var _checklist = (sketch: Sketcher) => {
  [
    'раскладка соседей',
    'переходы камеры',
    'тёмная тема',
    'звук',
    'мобильная версия',
  ].forEach((text, i) => {
    const y = 183 + i * 4.8;
    sketch.draw(box(104, y - 2.4, 2.4, 2.4, 950 + i, 0.3), 'soft');
    sketch.write(text, 108.4, y, { size: 3.2 });
    i < 3 &&
      sketch.draw(
        [
          line([104.3, y - 1.4], [105.3, y - 0.3], 962 + i, 0.2),
          line([105.3, y - 0.3], [107.4, y - 3.4], 966 + i, 0.2),
        ],
        i === 2 ? 'red' : 'dark',
        0.9
      );
  });
};

export var STUDIO: Array<(sketch: Sketcher) => void> = [
  (sketch) => (
    heading(sketch, 'a-sharapov.com', 11, 16, 1),
    sketch.write('концепт: 3d-стол вместо меню', 134, 15.6, {
      size: 3.2,
      align: 'right',
    }),
    _scene(sketch),
    sketch.draw([line([11, 99], [134, 99.4], 3, 0.6)], 'hard', 0.5)
  ),
  (sketch) => (_sitemap(sketch), _breakpoints(sketch)),
  _storyboard,
  (sketch) => (_tokens(sketch), _checklist(sketch)),
];
