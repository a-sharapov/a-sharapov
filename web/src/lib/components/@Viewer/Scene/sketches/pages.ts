import { hash } from '../pixels';
import { draw2d, sheet } from './canvas';
import { MOCKUPS } from './mockups';
import { graphite, HAND } from './pencil';
import { STUDIO } from './studio';

export var SKETCH_PAGE_SIZE = [1036, 1470] as const;

export var SKETCH_PAPER = '#f6f2ea';

var _HAND_FILES = [
  {
    url: '/fonts/caveat-cyrillic.woff2',
    range: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  },
  {
    url: '/fonts/caveat-latin.woff2',
    range:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
];

var _hand = { ready: false, loading: null as Promise<void> | null };

var _fonts = (): FontFaceSet | undefined =>
  typeof document === 'undefined'
    ? (globalThis as { fonts?: FontFaceSet }).fonts
    : document.fonts;

var _addHand = (fonts: FontFaceSet) =>
  Promise.all(
    _HAND_FILES.map(({ url, range }) =>
      new FontFace(HAND, `url(${url}) format('woff2')`, {
        weight: '400 700',
        unicodeRange: range,
      })
        .load()
        .then((face) => void fonts.add(face))
    )
  ).then(() => void (_hand.ready = true));

export var loadSketchHand = (): Promise<void> =>
  (_hand.loading ??= ((fonts) =>
    fonts ? _addHand(fonts) : Promise.reject(new Error('no FontFaceSet')))(
    _fonts()
  ));

export var sketchHandReady = () => _hand.ready;

var _paper = () => {
  const { 0: width, 1: height } = SKETCH_PAGE_SIZE;
  const canvas = sheet(width, height);
  const context = draw2d(canvas);
  context.fillStyle = SKETCH_PAPER;
  context.fillRect(0, 0, width, height);
  const image = context.getImageData(0, 0, width, height);
  for (let i = 0; i < 14000; i += 1) {
    const alpha = hash(i, 12, 4) * 0.05;
    const x = Math.floor(hash(i, 14, 5) * width);
    const y = Math.floor(hash(i, 16, 6) * height);
    for (let k = 0; k < 4; k += 1) {
      const at = ((y + (k >> 1)) * width + x + (k & 1)) * 4;
      image.data[at] += (110 - image.data[at]!) * alpha;
      image.data[at + 1] += (90 - image.data[at + 1]!) * alpha;
      image.data[at + 2] += (60 - image.data[at + 2]!) * alpha;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
};

export type Side = 'left' | 'right';

export var sketchPageSteps = (canvas: OffscreenCanvas, side: Side) => {
  const { 0: width, 1: height } = SKETCH_PAGE_SIZE;
  const mm = width / 148;
  const state = { paper: null as OffscreenCanvas | null };
  const context = () => draw2d(canvas);
  return [
    () =>
      void ((canvas.width = width),
      (canvas.height = height),
      (state.paper = _paper()),
      context().drawImage(state.paper, 0, 0)),
    ...{ left: STUDIO, right: MOCKUPS }[side].map(
      (part) => () => graphite(context(), mm, state.paper!, part)
    ),
    () => void (state.paper = null),
  ];
};

export var drawSketchPage = (
  side: Side,
  canvas: OffscreenCanvas = sheet(...SKETCH_PAGE_SIZE)
) => (sketchPageSteps(canvas, side).forEach((step) => void step()), canvas);
