import {
  ClampToEdgeWrapping,
  Data3DTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
} from 'three';

export type RGB = [r: number, g: number, b: number];

export var LUT_SIZE = 24;

export var DAY_GRADE = {
  lift: 0.014,
  toe: 0.32,
  shoulder: 0.01,
  knee: [0.88, 1] as const,
};

export var NIGHT_GRADE = {
  lift: 0.008,
  toe: 0.2,
  liftTint: [-0.4, 0.1, 1] as RGB,
  temperature: [0.5, 0.08, -0.5] as RGB,
  contrast: 0.35,
  darks: [0.08, 0.3] as const,
  warm: [1, 0.42, -0.62] as RGB,
  highlights: [0.62, 0.98] as const,
  warmStrength: 0.008,
};

var _clamp = (x: number) => Math.min(1, Math.max(0, x));

var _FLOOR = 0.012;

var _floor = (x: number) =>
  Math.min(1, x > _FLOOR ? x : _FLOOR * Math.exp(x / _FLOOR - 1));

var _smoothstep = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(_clamp((x - from) / (to - from)));

export var luma = ({ 0: r, 1: g, 2: b }: RGB) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

var _add = (a: RGB, b: RGB, k = 1): RGB => [
  a[0] + b[0] * k,
  a[1] + b[1] * k,
  a[2] + b[2] * k,
];

var _toe = (x: number, lift: number, toe: number) =>
  lift * (1 - _smoothstep(0, toe, x));

export var dayCurve = (x: number) =>
  x +
  _toe(x, DAY_GRADE.lift, DAY_GRADE.toe) +
  ((t) => DAY_GRADE.shoulder * 16 * t * t * (1 - t) * (1 - t))(
    _clamp((x - DAY_GRADE.knee[0]) / (DAY_GRADE.knee[1] - DAY_GRADE.knee[0]))
  );

export var gradeDay = (rgb: RGB): RGB =>
  ((level) =>
    rgb.map((channel) => _clamp(channel + dayCurve(level) - level)) as RGB)(
    luma(rgb)
  );

export var gradeNight = (rgb: RGB): RGB =>
  ((level) =>
    ((tinted) =>
      tinted.map((channel) =>
        _floor(
          channel +
            level +
            _toe(level, NIGHT_GRADE.lift, NIGHT_GRADE.toe) -
            luma(tinted)
        )
      ) as RGB)(
      _add(
        _add(
          _add(
            rgb,
            NIGHT_GRADE.temperature,
            (rgb[0] - rgb[2]) *
              NIGHT_GRADE.contrast *
              (1 -
                _smoothstep(NIGHT_GRADE.darks[0], NIGHT_GRADE.darks[1], level))
          ),
          NIGHT_GRADE.liftTint,
          _toe(level, NIGHT_GRADE.lift, NIGHT_GRADE.toe)
        ),
        NIGHT_GRADE.warm,
        NIGHT_GRADE.warmStrength *
          _smoothstep(
            NIGHT_GRADE.highlights[0],
            NIGHT_GRADE.highlights[1],
            level
          )
      )
    ))(luma(rgb));

var _texel = (index: number, size: number): RGB => [
  (index % size) / (size - 1),
  (Math.floor(index / size) % size) / (size - 1),
  Math.floor(index / (size * size)) / (size - 1),
];

var _ONE = DataUtils.toHalfFloat(1);

export var lutData = (grade: (rgb: RGB) => RGB, size = LUT_SIZE) =>
  ((data) => (
    Array.from({ length: size ** 3 }, (_, index) => index).forEach(
      (index) =>
        void ((rgb: RGB) =>
          void ((data[index * 4] = DataUtils.toHalfFloat(rgb[0])),
          (data[index * 4 + 1] = DataUtils.toHalfFloat(rgb[1])),
          (data[index * 4 + 2] = DataUtils.toHalfFloat(rgb[2])),
          (data[index * 4 + 3] = _ONE)))(grade(_texel(index, size)))
    ),
    data
  ))(new Uint16Array(size ** 3 * 4));

export var createLut = (grade: (rgb: RGB) => RGB, size = LUT_SIZE) =>
  Object.assign(new Data3DTexture(lutData(grade, size), size, size, size), {
    format: RGBAFormat,
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    wrapR: ClampToEdgeWrapping,
    generateMipmaps: false,
    unpackAlignment: 1,
    needsUpdate: true,
  });
