import type { Vector3 } from 'three';
import {
  float,
  luminance,
  max,
  mix,
  rand,
  screenUV,
  select,
  smoothstep,
  sqrt,
  step,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

type F = Node<'float'>;
type V3 = Node<'vec3'>;

export var HALATION = {
  warmth: [0.55, -0.1, -0.45] as const,
  mips: [1, 0.6, 0.25, 0, 0] as const,
};

export var halationTints = (strength: number) =>
  HALATION.mips.map((share) =>
    HALATION.warmth.map((warmth) => 1 + warmth * share * strength)
  ) as Array<[r: number, g: number, b: number]>;

export var tintBloom = (tints: Vector3[], strength: number) =>
  halationTints(strength).forEach(
    ({ 0: r, 1: g, 2: b }, i) => void tints[i]?.set(r, g, b)
  );

export var GRAIN = {
  strength: 0.24,
  gain: 0.71,
  floor: 0.42,
  shadows: [0.05, 0.35] as const,
  highlights: [0.6, 1] as const,
};

export var grainWeight = (perceived: number) =>
  ((rise, fall) =>
    GRAIN.gain * (GRAIN.floor + (1 - GRAIN.floor) * rise * (1 - fall)))(
    ((t) => t * t * (3 - 2 * t))(
      Math.min(
        1,
        Math.max(
          0,
          (perceived - GRAIN.shadows[0]) / (GRAIN.shadows[1] - GRAIN.shadows[0])
        )
      )
    ),
    ((t) => t * t * (3 - 2 * t))(
      Math.min(
        1,
        Math.max(
          0,
          (perceived - GRAIN.highlights[0]) /
            (GRAIN.highlights[1] - GRAIN.highlights[0])
        )
      )
    )
  );

export var softLight = (base: V3, blend: V3): V3 =>
  mix(
    base
      .mul(blend)
      .mul(2)
      .add(base.mul(base).mul(blend.mul(-2).add(1))),
    sqrt(base).mul(blend.mul(2).sub(1)).add(base.mul(2).mul(blend.oneMinus())),
    step(0.5, blend)
  );

var _softLightMean = (base: V3): V3 =>
  select(
    base.lessThanEqual(0.5) as unknown as Node<'bool'>,
    base.mul(base).mul(base.oneMinus().add(1)),
    base
      .mul(2.25)
      .sub(base.mul(base))
      .sub(0.5)
      .add(
        base
          .sub(0.5)
          .mul(base.sub(0.5))
          .div(sqrt(max(base, 1e-4)))
      )
  ) as unknown as V3;

var _weight = (perceived: F): F =>
  float(GRAIN.gain).mul(
    mix(
      float(GRAIN.floor),
      float(1),
      smoothstep(GRAIN.shadows[0], GRAIN.shadows[1], perceived).mul(
        smoothstep(
          GRAIN.highlights[0],
          GRAIN.highlights[1],
          perceived
        ).oneMinus()
      )
    )
  );

export var grain = (color: V3): V3 =>
  ((mean: V3) =>
    color.add(
      mean
        .sub(color)
        .add(
          softLight(color, color.mul(rand(screenUV)))
            .sub(mean)
            .mul(_weight(sqrt(max(luminance(color), 0))))
        )
        .mul(GRAIN.strength)
    ))(_softLightMean(color));
