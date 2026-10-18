import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RenderTarget,
  UnsignedByteType,
} from 'three';
import {
  min,
  select,
  sqrt,
  sRGBTransferEOTF,
  texture,
  uniform,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

export var feedback = {
  target: new RenderTarget(1, 1, {
    type: UnsignedByteType,
    generateMipmaps: true,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  }),
  aspect: uniform(1.6),
  gain: uniform(1),
  recursive: false,
  live: false,
};

export var FEEDBACK_GAIN = 0.98;

var _untonemap = (display: Node<'vec3'>): Node<'vec3'> =>
  ((low) =>
    display.add(
      select(
        low.greaterThanEqual(0.04),
        low.add(0.04),
        sqrt(low.max(0).div(6.25))
      ).sub(low)
    ))(min(display.r, min(display.g, display.b)));

export var framed = (uv: Node<'vec2'>): Node<'vec3'> =>
  _untonemap(
    sRGBTransferEOTF(
      texture(feedback.target.texture, uv).rgb
    ) as unknown as Node<'vec3'>
  ).mul(feedback.gain);
