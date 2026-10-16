import { type DepthTexture, NearestFilter } from 'three';
import {
  clamp,
  Fn,
  float,
  If,
  int,
  interleavedGradientNoise,
  Loop,
  max,
  reference,
  screenCoordinate,
  step,
  texture,
  vec2,
  vogelDiskSample,
} from 'three/tsl';
import type { LightShadow, Node } from 'three/webgpu';

var _SAMPLES = 32;

var _SEARCH = 0.16;

type PcssOptions = {
  lightSize: number;
  perspective?: boolean;
  samples?: number;
  gobo?: (uv: Node<'vec2'>) => Node<'float'>;
  active?: Node<'float'>;
};

type FilterInput = {
  depthTexture: DepthTexture;
  shadowCoord: Node<'vec3'>;
  shadow: LightShadow;
};

export var pcssFilter = ({
  lightSize,
  perspective = false,
  samples: count = _SAMPLES,
  gobo,
  active,
}: PcssOptions) =>
  Fn(({ depthTexture, shadowCoord, shadow }: FilterInput) => {
    depthTexture.compareFunction = null;
    depthTexture.minFilter = NearestFilter;
    depthTexture.magFilter = NearestFilter;

    const texel = vec2(1).div(reference('mapSize', 'vec2', shadow));
    const near = reference('near', 'float', shadow.camera);
    const far = reference('far', 'float', shadow.camera);
    const linear = (depth: Node<'float'>): Node<'float'> =>
      perspective
        ? near.mul(far).div(far.sub(depth.mul(far.sub(near))))
        : depth;
    const depthAt = (uv: Node<'vec2'>): Node<'float'> =>
      texture(depthTexture, uv).x;
    const samples = int(count);
    const phi = interleavedGradientNoise(screenCoordinate.xy).mul(Math.PI * 2);
    const receiver = shadowCoord.z;

    const lit = float(1).toVar();
    const shade = () => {
      const blockerSum = float(0).toVar();
      const blockers = float(0).toVar();
      Loop(count, ({ i }) => {
        const depth = depthAt(
          shadowCoord.xy.add(
            vogelDiskSample(i, samples, phi)
              .mul(texel)
              .mul(lightSize * _SEARCH)
          )
        );
        const hit = step(depth, receiver);
        blockerSum.addAssign(depth.mul(hit));
        blockers.addAssign(hit);
      });

      If(blockers.greaterThan(0), () => {
        const blocker = linear(blockerSum.div(blockers));
        const penumbra = clamp(
          linear(receiver).sub(blocker).div(max(blocker, 1e-3)),
          0,
          1
        )
          .mul(lightSize)
          .add(1);
        const sum = float(0).toVar();
        Loop(count, ({ i }) => {
          sum.addAssign(
            step(
              receiver,
              depthAt(
                shadowCoord.xy.add(
                  vogelDiskSample(i, samples, phi.add(1.7))
                    .mul(texel)
                    .mul(penumbra)
                )
              )
            )
          );
        });
        lit.assign(sum.div(count));
      });
    };
    void (active ? If(active.greaterThan(0), shade) : shade());
    return gobo ? lit.mul(gobo(shadowCoord.xy)) : lit;
  });
