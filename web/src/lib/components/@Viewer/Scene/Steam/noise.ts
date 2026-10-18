import {
  Data3DTexture,
  LinearFilter,
  RedFormat,
  RepeatWrapping,
  UnsignedByteType,
} from 'three';
import { fillPixels } from '../pixel-jobs';
import { STEAM_NOISE_SIZE } from './noise-pixels';

export { NOISE_PERIOD } from './noise-pixels';

export var createNoiseTexture = () =>
  fillPixels(
    Object.assign(
      new Data3DTexture(
        new Uint8Array(STEAM_NOISE_SIZE ** 3),
        STEAM_NOISE_SIZE,
        STEAM_NOISE_SIZE,
        STEAM_NOISE_SIZE
      ),
      {
        format: RedFormat,
        type: UnsignedByteType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        wrapR: RepeatWrapping,
        unpackAlignment: 1,
        needsUpdate: true,
      }
    ),
    { kind: 'steam' }
  );
