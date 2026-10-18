import { Color, SRGBColorSpace } from 'three';
import {
  abs,
  clamp,
  float,
  fwidth,
  length,
  max,
  min,
  mix,
  round,
  sin,
  smoothstep,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

export var DOT_GRID = {
  page: [148, 210],
  origin: [4, 5],
  step: 5,
  last: [27, 40],
  radius: 0.28,
  ink: [120, 112, 100],
  alpha: 0.42,
} as const;

export var FORE_EDGE = {
  leaves: [0.2, 1.35, 2.55, 3.85],
  width: 0.45,
  dark: 0.42,
  band: [3.9, 4.9],
  tint: 0.09,
  wave: 0.08,
} as const;

var _shade = (paper: string) => {
  const base = new Color(paper);
  const srgb = base.getRGB({ r: 0, g: 0, b: 0 }, SRGBColorSpace);
  const over = new Color().setRGB(
    ...((['r', 'g', 'b'] as const).map(
      (channel, i) =>
        srgb[channel] * (1 - DOT_GRID.alpha) +
        (DOT_GRID.ink[i]! / 255) * DOT_GRID.alpha
    ) as [number, number, number]),
    SRGBColorSpace
  );
  return vec3(over.r / base.r, over.g / base.g, over.b / base.b);
};

var _dots = (at: Node<'vec2'>, edge: Node<'float'>, paper: string) => {
  const cell = at.sub(vec2(...DOT_GRID.origin)).div(DOT_GRID.step);
  const nearest = clamp(round(cell), vec2(0, 0), vec2(...DOT_GRID.last));
  const distance = length(cell.sub(nearest)).mul(DOT_GRID.step);
  const pixel = max(fwidth(at.x), fwidth(at.y)).max(1e-4);
  const coverage = smoothstep(
    float(DOT_GRID.radius).sub(pixel.mul(0.5)),
    float(DOT_GRID.radius).add(pixel.mul(0.5)),
    distance
  )
    .oneMinus()
    .mul(clamp(float(DOT_GRID.radius).div(pixel).sub(0.25), 0, 1))
    .mul(smoothstep(FORE_EDGE.band[1], FORE_EDGE.band[1] + 0.6, edge));
  return mix(vec3(1), _shade(paper), coverage);
};

var _foreEdge = (edge: Node<'float'>, along: Node<'float'>) => {
  const pixel = fwidth(edge).max(1e-4);
  const footprint = max(pixel, FORE_EDGE.width);
  const peak = min(float(1), float(FORE_EDGE.width).div(pixel));
  const leaves = FORE_EDGE.leaves.reduce<Node<'float'>>(
    (sum, center, i) =>
      sum.add(
        clamp(
          abs(
            edge.sub(
              sin(along.mul(0.05).add(i * 1.7))
                .mul(FORE_EDGE.wave)
                .add(center)
            )
          )
            .div(footprint)
            .oneMinus(),
          0,
          1
        )
          .mul(peak)
          .mul(FORE_EDGE.dark * (1 - i / 6))
      ),
    float(0)
  );
  const shadow = smoothstep(FORE_EDGE.band[0], FORE_EDGE.band[1], edge)
    .oneMinus()
    .mul(FORE_EDGE.tint);
  return clamp(leaves.add(shadow), 0, 0.6).oneMinus();
};

export var pageSurface = (
  base: Node<'vec4'>,
  paper: string,
  side: 'left' | 'right'
) => {
  const at = uv().mul(vec2(...DOT_GRID.page));
  const edge = side === 'left' ? at.x : float(DOT_GRID.page[0]).sub(at.x);
  return vec4(
    base.rgb.mul(_dots(at, edge, paper)).mul(_foreEdge(edge, at.y)),
    base.a
  );
};
