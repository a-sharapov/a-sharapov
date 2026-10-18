import {
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from 'three';
import { float, mix, smoothstep, texture, uniform, vec2 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import { GOBO, GOBO_SIZE } from './gobo-pixels';
import { fillPixels } from './pixel-jobs';

export { frameAt, GOBO, leavesAt } from './gobo-pixels';

var _texture = (pattern: 'frame' | 'leaves', repeat: boolean) =>
  fillPixels(
    Object.assign(
      new DataTexture(
        new Uint8Array(GOBO_SIZE ** 2 * 4),
        GOBO_SIZE,
        GOBO_SIZE,
        RGBAFormat,
        UnsignedByteType
      ),
      {
        magFilter: LinearFilter,
        minFilter: LinearFilter,
        generateMipmaps: false,
        needsUpdate: true,
        ...(repeat ? { wrapS: RepeatWrapping, wrapT: RepeatWrapping } : {}),
      }
    ),
    { kind: 'gobo', pattern }
  );

export var createGobo = () => {
  const frame = _texture('frame', false);
  const leaves = _texture('leaves', true);
  const sway = uniform(vec2(0, 0));
  const strength = uniform(1);
  const node = (uv: Node<'vec2'>): Node<'float'> =>
    mix(float(1), _pattern(uv), strength);
  const _pattern = (uv: Node<'vec2'>): Node<'float'> =>
    texture(frame, uv).r.mul(
      mix(
        float(1),
        texture(leaves, uv.mul(GOBO.leaves.scale).add(sway)).r.oneMinus(),
        smoothstep(
          GOBO.leaves.from[1],
          GOBO.leaves.from[1] + GOBO.leaves.soft,
          uv.y
        )
          .mul(
            smoothstep(
              GOBO.leaves.from[0] - GOBO.leaves.soft,
              GOBO.leaves.from[0],
              uv.x
            ).oneMinus()
          )
          .mul(GOBO.leaves.strength)
      )
    );
  return {
    node,
    sway,
    strength,
    dispose: () => void (frame.dispose(), leaves.dispose()),
  };
};

export var gustEnvelope = (t: number, start: number, seconds: number) =>
  ((x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2))(
    (t - start) / seconds
  );

export var swayAt = (t: number, envelope: number): [number, number] => [
  envelope *
    GOBO.gust.sway *
    (Math.sin(t * 1.7) + 0.6 * Math.sin(t * 2.9 + 1.3)),
  envelope *
    GOBO.gust.sway *
    0.6 *
    (Math.sin(t * 1.3 + 0.4) + 0.5 * Math.sin(t * 3.4 + 2.1)),
];

var _shared: ReturnType<typeof createGobo> | null = null;

export var sharedGobo = () => (_shared ??= createGobo());
