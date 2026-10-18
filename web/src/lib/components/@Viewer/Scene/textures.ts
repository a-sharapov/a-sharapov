import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  type Texture,
} from 'three';
import type { ContactKind, ContactRecord } from '#lib/common/types.ts';
import { splitLabel } from '#lib/common/utils.ts';
import Phone from '#lib/i/phone.svg?raw';
import Telegram from '#lib/i/telegram.svg?raw';
import { fillPixels } from './pixel-jobs';
import { COATING_TILE, hash } from './pixels';

var _repeat = <T extends Texture>(texture: T, repeat = 1): T => {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.needsUpdate = true;
  return texture;
};

export var createNoiseTexture = (size = 128, period = 8, seed = 1) =>
  _repeat(
    fillPixels(
      Object.assign(
        new DataTexture(
          new Uint8Array(size * size * 4),
          size,
          size,
          RGBAFormat
        ),
        {
          magFilter: LinearFilter,
          minFilter: LinearMipmapLinearFilter,
          generateMipmaps: true,
        }
      ),
      { kind: 'grain', size, period, seed }
    )
  );

export var softCanvas = (width: number, height: number) =>
  ((canvas) => (canvas.getContext('2d', { willReadFrequently: true }), canvas))(
    Object.assign(document.createElement('canvas'), { width, height })
  );

export type CardFace = {
  tagline: string;
  logo?: HTMLImageElement | null;
};

export type CardBack = {
  name: string;
  role: string;
  contacts: Pick<ContactRecord, 'kind' | 'label' | 'href' | 'group'>[];
};

export type CardLink = {
  index: number;
  href: string;
  rect: [x: number, y: number, w: number, h: number];
};

export type CardIcon = {
  raster: HTMLCanvasElement;
  box: [x: number, y: number, w: number, h: number];
  scale: number;
};

export type CardIcons = Partial<Record<ContactKind, CardIcon>>;

var _LOCKUP = {
  width: 0.66,
  centroid: 0.0094,
  gap: 44,
  center: 0.48,
  tagline: 60,
};

var _LOGO_ASPECT = 247.338 / 718.887;

var _INK = '#2a292d';

var _SANS = '"PT Sans", "PT Sans Fallback", sans-serif';
var _NARROW = `"PT Sans Narrow", "PT Sans Narrow Fallback", ${_SANS}`;

var _svgImage = (svg: string) =>
  ((image) => image.decode().then(() => image))(
    Object.assign(new Image(), {
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replaceAll('currentColor', _INK))}`,
    })
  );

export var loadCardLogo = _svgImage;

var _ENVELOPE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M4.2 5h15.6A2.2 2.2 0 0 1 22 7.2v9.6a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 16.8V7.2A2.2 2.2 0 0 1 4.2 5zM3.6 7.4l8.4 5.6 8.4-5.6v1.9L12 14.9 3.6 9.3z"/></svg>`;

var _ICONS: Partial<Record<ContactKind, string>> = {
  phone: Phone,
  telegram: Telegram,
  email: _ENVELOPE,
};

var _MUTED = '#6d6b70';

var _monochrome = (svg: string) =>
  svg.replace(/fill="#[0-9a-f]{3,6}"/gi, `fill="${_MUTED}"`);

var _RASTER = 256;

var _ICON_WEIGHT = { box: 37.5, ink: 26 };

var _measureIcon = (image: HTMLImageElement): CardIcon =>
  ((raster) =>
    ((context) => {
      context.drawImage(image, 0, 0, _RASTER, _RASTER);
      const { data } = context.getImageData(0, 0, _RASTER, _RASTER);
      const ink = Array.from({ length: _RASTER * _RASTER }).reduce<{
        sum: number;
        box: [number, number, number, number];
      }>(
        (acc, _, i) =>
          ((alpha) =>
            alpha > 8
              ? ((x, y) => ({
                  sum: acc.sum + alpha / 255,
                  box: [
                    Math.min(acc.box[0], x),
                    Math.min(acc.box[1], y),
                    Math.max(acc.box[2], x),
                    Math.max(acc.box[3], y),
                  ],
                }))(i % _RASTER, Math.floor(i / _RASTER))
              : acc)(data[i * 4 + 3]!),
        { sum: 0, box: [_RASTER, _RASTER, 0, 0] }
      );
      const { 0: x0, 1: y0, 2: x1, 3: y1 } = ink.box;
      const box: CardIcon['box'] = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
      return {
        raster,
        box,
        scale: ((fit) =>
          Math.min(
            fit * 1.03,
            Math.sqrt(fit * (_ICON_WEIGHT.ink / Math.sqrt(ink.sum)))
          ))(_ICON_WEIGHT.box / Math.max(box[2], box[3])),
      };
    })(raster.getContext('2d', { willReadFrequently: true })!))(
    softCanvas(_RASTER, _RASTER)
  );

export var loadCardIcons = (): Promise<CardIcons> =>
  Promise.all(
    Object.entries(_ICONS).map(({ 0: kind, 1: svg }) =>
      _svgImage(_monochrome(svg!)).then(
        (image) => [kind, _measureIcon(image)] as const
      )
    )
  ).then(Object.fromEntries);

export var CARD_FACE_SIZE = [1800, 1000] as const;

var _paper = (context: CanvasRenderingContext2D) =>
  ((width: number, height: number) => {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#fdfdfc');
    gradient.addColorStop(1, '#f5f5f4');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  })(...CARD_FACE_SIZE);

export var PAPER_RELIEF_REPEAT = [
  CARD_FACE_SIZE[0] / COATING_TILE,
  CARD_FACE_SIZE[1] / COATING_TILE,
] as const;

export var createPaperRelief = () =>
  _repeat(
    fillPixels(
      Object.assign(
        new DataTexture(
          new Uint8Array(COATING_TILE ** 2 * 4),
          COATING_TILE,
          COATING_TILE,
          RGBAFormat
        ),
        {
          magFilter: LinearFilter,
          minFilter: LinearMipmapLinearFilter,
          generateMipmaps: true,
          anisotropy: 8,
        }
      ),
      { kind: 'coating' }
    )
  );

export var drawCardFace = (canvas: HTMLCanvasElement, face: CardFace) => {
  const { 0: width, 1: height } = CARD_FACE_SIZE;
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  _paper(context);

  const logoWidth = width * _LOCKUP.width;
  const logoHeight = logoWidth * _LOGO_ASPECT;
  context.font = `700 ${_LOCKUP.tagline}px ${_NARROW}`;
  context.letterSpacing = '8px';
  const cap = context.measureText('Н').actualBoundingBoxAscent;
  const top = height * _LOCKUP.center - (logoHeight + _LOCKUP.gap + cap) / 2;

  void (
    face.logo &&
    context.drawImage(
      face.logo,
      (width - logoWidth) / 2 - logoWidth * _LOCKUP.centroid,
      top,
      logoWidth,
      logoHeight
    )
  );

  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#2a272c';
  context.fillText(
    face.tagline.toUpperCase(),
    width / 2,
    top + logoHeight + _LOCKUP.gap + cap
  );

  return canvas;
};

export var createCardTexture = (face: CardFace) => {
  const texture = new CanvasTexture(drawCardFace(softCanvas(1, 1), face));
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

export var updateCardTexture = (texture: CanvasTexture, face: CardFace) => {
  drawCardFace(texture.image as HTMLCanvasElement, face);
  texture.needsUpdate = true;
  return texture;
};

export var CV_PAGE_SIZE = [1029, 1455] as const;

var _CV = {
  left: 20.3,
  width: 169.5,
  pitch: 9,
  body: 2.6,
};

export var drawCvPage = (canvas: HTMLCanvasElement) => {
  const { 0: width, 1: height } = CV_PAGE_SIZE;
  const mm = width / 210;
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#f7f5f0';
  context.fillRect(0, 0, width, height);

  const _INK = '#2a292d';
  const _ROLE = '#5a595e';
  const _TEXT = '#a8a6a2';
  const _QUIET = '#c4c1bc';
  const _RULE = '#77757a';

  const bar = (x: number, y: number, w: number, h: number, fill: string) =>
    void ((context.fillStyle = fill),
    context.beginPath(),
    context.roundRect(x * mm, y * mm, w * mm, h * mm, (h * mm) / 2),
    context.fill());
  const text = (x: number, y: number, w: number, size: number, fill: string) =>
    bar(x, y - size / 2, w, size, fill);
  const lines = (
    x: number,
    y: number,
    widths: number[],
    size: number,
    fill: string,
    pitch = _CV.pitch
  ) => widths.forEach((w, i) => void text(x, y + i * pitch, w, size, fill));
  const section = (y: number, w: number) => (
    text(_CV.left, y, w, 3, _INK),
    (context.fillStyle = _RULE),
    context.fillRect(_CV.left * mm, (y + 6) * mm, _CV.width * mm, 0.3 * mm)
  );
  const point = (y: number, widths: number[]) => (
    bar(_CV.left + 1.6, y - 0.8, 1.6, 1.6, _QUIET),
    lines(_CV.left + 6.4, y, widths, _CV.body, _TEXT)
  );

  text(_CV.left, 27.9, 118.9, 8.6, _INK);
  lines(_CV.left, 42, [163.5, 91.3], 3.4, _ROLE, 9.5);
  (
    [
      [65.1, 0, 57.5],
      [65.1, 64.4, 43.5],
      [74.1, 0, 92],
      [74.1, 98.9, 51.3],
    ] as const
  ).forEach(
    ({ 0: y, 1: x, 2: w }) => void text(_CV.left + x, y, w, 2.4, _QUIET)
  );

  section(93.2, 26.6);
  lines(_CV.left, 109.4, [164.1, 152, 139.8, 159.2, 22.2], _CV.body, _TEXT);
  lines(_CV.left, 158.6, [165, 44.2], _CV.body, _TEXT);

  section(186.9, 39.5);
  text(_CV.left, 203.3, 75, 3.2, _INK);
  text(162.3, 203.7, 27.4, 2.4, _QUIET);
  text(_CV.left, 212.4, 70.3, _CV.body, _QUIET);
  (
    [
      [223.8, [154.8, 53.7]],
      [243.5, [151.9, 114.5]],
      [263.2, [153.6, 135]],
      [282.9, [160, 87.5]],
    ] as const
  ).forEach(({ 0: y, 1: widths }) => void point(y, [...widths]));
  return canvas;
};

export var createCvTexture = () =>
  Object.assign(new CanvasTexture(drawCvPage(softCanvas(1, 1))), {
    colorSpace: SRGBColorSpace,
    anisotropy: 8,
  });

var _BACK = {
  margin: 145,
  name: 253,
  role: 333,
  last: 795,
  first: 440,
  row: 84,
  values: 242,
};
var _PRIMARY = '#c51c00';

var _CAP_MIDDLE = 14.9;

var _SMALL_TEXT = 0.7;

var _drawIcon = (
  context: CanvasRenderingContext2D,
  icon: CardIcon,
  x: number,
  y: number
) =>
  ((w: number, h: number) =>
    context.drawImage(icon.raster, ...icon.box, x, y - h / 2, w, h))(
    icon.box[2] * icon.scale,
    icon.box[3] * icon.scale
  );

export var drawCardBack = (
  canvas: HTMLCanvasElement,
  back: CardBack,
  icons: CardIcons,
  hovered = -1
): CardLink[] => {
  const { 0: width, 1: height } = CARD_FACE_SIZE;
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  _paper(context);
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';

  context.fillStyle = _INK;
  context.font = `700 68px ${_NARROW}`;
  context.letterSpacing = '22px';
  const fit = width - _BACK.margin * 2;
  context.fillText(back.name.toUpperCase(), _BACK.margin, _BACK.name, fit);
  context.fillStyle = _MUTED;
  context.font = `700 40px ${_NARROW}`;
  context.letterSpacing = '13px';
  context.fillText(back.role.toUpperCase(), _BACK.margin, _BACK.role, fit);

  const contacts = back.contacts.filter(({ kind }) => kind in _ICONS);
  const step = Math.min(
    _BACK.row,
    (_BACK.last - _BACK.first) / Math.max(1, contacts.length - 1)
  );
  context.letterSpacing = '1px';
  const links = contacts.flatMap((contact, index): CardLink[] => {
    const y = _BACK.last - (contacts.length - 1 - index) * step;
    const previous = contacts[index - 1];
    const repeat =
      previous?.kind === contact.kind && previous.group === contact.group;
    const icon = repeat ? null : icons[contact.kind];
    void (icon && _drawIcon(context, icon, _BACK.margin, y - _CAP_MIDDLE));
    const { 0: head, 1: tail } = splitLabel(contact.label);
    const active = index === hovered;
    context.fillStyle = active ? _PRIMARY : _INK;
    context.strokeStyle = context.fillStyle;
    context.lineWidth = _SMALL_TEXT;
    context.font = `400 42px ${_SANS}`;
    context.fillText(head, _BACK.values, y);
    context.strokeText(head, _BACK.values, y);
    const headWidth = context.measureText(head).width;
    context.font = `700 42px ${_SANS}`;
    context.fillText(tail, _BACK.values + headWidth, y);
    const right = _BACK.values + headWidth + context.measureText(tail).width;
    void (
      active && context.fillRect(_BACK.values, y + 10, right - _BACK.values, 3)
    );
    return contact.href
      ? [
          {
            index,
            href: contact.href,
            rect: [
              _BACK.margin - 14,
              y - step * 0.66,
              right - _BACK.margin + 28,
              step,
            ],
          },
        ]
      : [];
  });

  context.restore();
  return links;
};

export var createCardBackTexture = () =>
  Object.assign(
    new CanvasTexture(
      ((canvas) => (_paper(canvas.getContext('2d')!), canvas))(
        softCanvas(...CARD_FACE_SIZE)
      )
    ),
    { colorSpace: SRGBColorSpace, anisotropy: 8 }
  );

export var linkAt = (links: CardLink[], uv: { x: number; y: number }) =>
  ((x: number, y: number) =>
    links.find(
      ({ rect: { 0: left, 1: top, 2: w, 3: h } }) =>
        x >= left && x <= left + w && y >= top && y <= top + h
    ))((1 - uv.x) * CARD_FACE_SIZE[0], (1 - uv.y) * CARD_FACE_SIZE[1]);

export var createPageEdgeTexture = () =>
  _repeat(
    new CanvasTexture(
      ((canvas) => {
        const context = canvas.getContext('2d')!;
        Array.from({ length: 512 }).forEach((_, row) => {
          const leaf = Math.floor(row / 5);
          const shade =
            244 +
            hash(leaf, 1, 41) * 11 -
            (row % 5 === 0 ? 14 : 0) -
            (leaf % 16 === 0 && row % 5 < 2 ? 30 : 0);
          context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          context.fillRect(0, row, 16, 1);
        });
        return canvas;
      })(softCanvas(16, 512))
    )
  );

export var createLinenTexture = () =>
  _repeat(
    new CanvasTexture(
      ((canvas) => {
        const context = canvas.getContext('2d')!;
        const pitch = 8;
        context.fillStyle = 'rgb(150, 150, 150)';
        context.fillRect(0, 0, 256, 256);
        Array.from({ length: 32 * 32 }).forEach((_, i) => {
          const column = i % 32;
          const row = Math.floor(i / 32);
          const warp = (column + row) % 2 === 0;
          const tone = 200 + hash(warp ? column : row, warp ? 1 : 2, 57) * 45;
          const gradient = warp
            ? context.createLinearGradient(
                column * pitch,
                0,
                (column + 1) * pitch,
                0
              )
            : context.createLinearGradient(
                0,
                row * pitch,
                0,
                (row + 1) * pitch
              );
          gradient.addColorStop(
            0,
            `rgb(${tone * 0.55}, ${tone * 0.55}, ${tone * 0.55})`
          );
          gradient.addColorStop(0.5, `rgb(${tone}, ${tone}, ${tone})`);
          gradient.addColorStop(
            1,
            `rgb(${tone * 0.55}, ${tone * 0.55}, ${tone * 0.55})`
          );
          context.fillStyle = gradient;
          context.fillRect(column * pitch, row * pitch, pitch, pitch);
        });
        return canvas;
      })(softCanvas(256, 256))
    )
  );
