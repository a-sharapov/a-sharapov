import {
  ClampToEdgeWrapping,
  Data3DTexture,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
} from 'three';
import { fillPixels } from '../pixel-jobs';
import { LUT_SIZE } from './grade';

export var createLut = (grade: 'day' | 'night') =>
  fillPixels(
    Object.assign(
      new Data3DTexture(
        new Uint16Array(LUT_SIZE ** 3 * 4),
        LUT_SIZE,
        LUT_SIZE,
        LUT_SIZE
      ),
      {
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
      }
    ),
    { kind: 'lut', grade }
  );
