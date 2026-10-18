import {
  Fn,
  float,
  If,
  interleavedGradientNoise,
  Loop,
  max,
  min,
  screenCoordinate,
  screenSize,
  screenUV,
  smoothstep,
  vec2,
  vec4,
} from 'three/tsl';
import type { Node, TextureNode } from 'three/webgpu';

type F = Node<'float'>;
type V2 = Node<'vec2'>;
type V4 = Node<'vec4'>;

export var MOTION = { exposure: 1 / 120, radius: 14, taps: 8, still: 0.5 };

export var ABERRATION = { from: 0.5, pixels: 0.6 };

export var DIAGONALS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

export var shutterFor = (delta: number) =>
  MOTION.exposure / Math.min(1 / 20, Math.max(1 / 240, delta));

export type Lens = {
  center: V4;
  source: TextureNode;
  velocity: TextureNode;
  shutter: F;
  pixelRatio: F;
  aberration: F;
  at?: V2;
  split?: V2;
};

var _streak = (velocity: TextureNode, at: V2, shutter: F, limit: F): V2 =>
  ((streak: V2) => streak.mul(min(1, limit.div(max(streak.length(), 1e-4)))))(
    (velocity.sample(at) as unknown as V4).xy
      .mul(vec2(0.5, -0.5))
      .mul(screenSize)
      .mul(shutter)
  );

var _aberrated = (lens: Lens, at: V2): V4 =>
  ((offset: V2) =>
    ((shift: V2) =>
      vec4(
        (
          lens.source.sample(
            at.add(shift).add(lens.split ?? vec2(0))
          ) as unknown as V4
        ).r,
        lens.center.g,
        (
          lens.source.sample(
            at.sub(shift).sub(lens.split ?? vec2(0))
          ) as unknown as V4
        ).b,
        lens.center.a
      ))(
      offset
        .div(max(offset.length(), 1e-3))
        .mul(
          smoothstep(
            ABERRATION.from,
            1,
            offset.length().div(screenSize.mul(0.5).length())
          )
            .mul(lens.aberration)
            .mul(lens.pixelRatio)
        )
        .div(screenSize)
    ))(at.sub(0.5).mul(screenSize));

export var lensColor = (lens: Lens): V4 =>
  Fn(() => {
    const at = lens.at ?? screenUV;
    const limit = float(MOTION.radius * 2).mul(lens.pixelRatio);
    const own = _streak(lens.velocity, at, lens.shutter, limit).toVar();
    const reach = vec2(limit.mul(0.5)).div(screenSize);
    const dominant = own.toVar();
    DIAGONALS.forEach(({ 0: x, 1: y }) => {
      const other = _streak(
        lens.velocity,
        at.add(reach.mul(vec2(x, y))),
        lens.shutter,
        limit
      ).toVar();
      If(other.dot(other).greaterThan(dominant.dot(dominant)), () => {
        dominant.assign(other);
      });
    });
    const sharp = _aberrated(lens, at).toVar();
    const result = sharp.toVar();
    const length = dominant.length().toVar();
    If(length.greaterThan(MOTION.still * 2), () => {
      const direction = dominant.div(length).toVar();
      const ownRadius = max(own.length().mul(0.5), 0.5).toVar();
      const jitter = interleavedGradientNoise(screenCoordinate.xy).sub(0.5);
      const sum = sharp.mul(2).toVar();
      const weight = float(2).toVar();
      Loop(MOTION.taps, ({ i }) => {
        const offset = float(i)
          .add(0.5)
          .add(jitter)
          .div(MOTION.taps)
          .sub(0.5)
          .mul(length)
          .toVar();
        const tap = at.add(direction.mul(offset).div(screenSize)).toVar();
        const radius = max(
          _streak(lens.velocity, tap, lens.shutter, limit).length().mul(0.5),
          0.5
        );
        const distance = offset.abs();
        const share = distance
          .div(radius)
          .oneMinus()
          .saturate()
          .add(distance.div(ownRadius).oneMinus().saturate());
        sum.addAssign((lens.source.sample(tap) as unknown as V4).mul(share));
        weight.addAssign(share);
      });
      result.assign(sum.div(weight));
    });
    return result;
  })() as V4;
