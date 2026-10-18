import {
  clamp,
  float,
  floor,
  fract,
  hash,
  max,
  mix,
  screenCoordinate,
  screenSize,
  screenUV,
  select,
  step,
  vec2,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

type F = Node<'float'>;
type V2 = Node<'vec2'>;
type V3 = Node<'vec3'>;

var _LEVELS = 9;

export var glitchWarp = (glitch: F, pixel: F, seed: F): { at: V2; split: V2 } =>
  ((cell: F) =>
    ((at: V2) =>
      ((band: F) =>
        ((pick: F, tile: V2) =>
          ((slice: F, jump: V2) => ({
            at: clamp(at.add(vec2(slice, 0)).add(jump), 0, 1) as V2,
            split: vec2(
              glitch.mul(0.004).add(pick.mul(glitch).mul(0.008)),
              0
            ) as V2,
          }))(
            step(glitch.mul(-0.4).add(1), pick)
              .mul(hash(band.add(seed.mul(7)).add(3)).sub(0.5))
              .mul(glitch)
              .mul(0.12) as F,
            vec2(
              hash(tile.x.add(seed.mul(3)).add(5))
                .sub(0.5)
                .mul(0.3),
              hash(tile.y.add(seed.mul(9)).add(2))
                .sub(0.5)
                .mul(0.06)
            )
              .mul(
                step(
                  glitch.mul(-0.12).add(1),
                  hash(tile.x.add(tile.y.mul(13)).add(seed.mul(5)).add(11))
                )
              )
              .mul(glitch) as V2
          ))(
          hash(band.add(seed.mul(17))) as F,
          floor(at.mul(vec2(8, 6))) as V2
        ))(floor(at.y.mul(float(18).add(hash(seed).mul(28)))) as F))(
      select(
        pixel.greaterThan(1.5),
        floor(screenUV.mul(screenSize).div(cell))
          .add(0.5)
          .mul(cell)
          .div(screenSize),
        screenUV
      ) as V2
    ))(max(pixel, float(1)) as F);

export var glitchTone = (color: V3, glitch: F): V3 =>
  mix(
    color,
    floor(color.mul(_LEVELS).add(0.5)).div(_LEVELS),
    glitch.mul(0.6)
  ).mul(
    float(1).sub(
      glitch.mul(0.07).mul(step(0.5, fract(screenCoordinate.y.div(3))))
    )
  ) as V3;
