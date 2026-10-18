import { onDestroy } from 'svelte';
import {
  type BufferGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three';
import { createNoiseTexture } from '../textures';

export var CERAMIC = {
  color: '#f1efeb',
  roughness: 0.62,
  clearcoat: 0.16,
  clearcoatRoughness: 0.5,
  bumpScale: 0.25,
} as const;

export var WHITE_PAINT = {
  color: '#efede9',
  roughness: 0.68,
  clearcoat: 0.1,
  clearcoatRoughness: 0.55,
  bumpScale: 0.3,
} as const;

export var PLATINUM = {
  color: '#e3e2df',
  metalness: 1,
  roughness: 0.32,
  bumpScale: 0.06,
} as const;

export var OAK = {
  color: '#dcb88e',
  roughness: 0.72,
  bumpScale: 0.35,
} as const;

var _OAK_SIZE = [60, 42] as const;
var _oak: Promise<Texture['source']> | null = null;

export var useWood = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const length = max.y - min.y;
  const girth = 2 * Math.PI * Math.max(max.x, -min.x, max.z, -min.z);
  const wood = Object.assign(new Texture(), {
    colorSpace: SRGBColorSpace,
    wrapS: RepeatWrapping,
    wrapT: RepeatWrapping,
    anisotropy: 8,
  });
  wood.center.set(0.5, 0.5);
  wood.rotation = Math.PI / 2;
  wood.repeat.set(girth / _OAK_SIZE[1], length / _OAK_SIZE[0]);
  let alive = true;
  const _handle = (source: Texture['source']) =>
    void (alive && ((wood.source = source), (wood.needsUpdate = true)));
  const _catch = (error: unknown) =>
    void console.error('useWood: фактура дуба не загрузилась', error);
  (_oak ??= new TextureLoader()
    .loadAsync('/textures/oak.jpg')
    .then((loaded) => loaded.source)).then(_handle, _catch);
  onDestroy(() => void ((alive = false), wood.dispose()));
  return wood;
};

export var PAPER = {
  color: '#f7f5f0',
  roughness: 0.92,
  bumpScale: 0.35,
} as const;

export var useGrain = (repeat = 6, seed = 11) => {
  const grain = createNoiseTexture(256, 64, seed);
  grain.repeat.set(repeat, repeat);
  onDestroy(() => grain.dispose());
  return grain;
};
