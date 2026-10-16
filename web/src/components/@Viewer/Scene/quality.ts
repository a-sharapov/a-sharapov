import { isClient } from '$lib/common/utils';

export type Tier = 'high' | 'low';

export type Quality = {
  tier: Tier;
  dpr: [min: number, max: number];
  aoHalfResolution: boolean;
  shadowMap: number;
  reflection: number;
};

export var QUALITY: Record<Tier, Quality> = {
  high: {
    tier: 'high',
    dpr: [1, 1.75],
    aoHalfResolution: false,
    shadowMap: 2048,
    reflection: 0.5,
  },
  low: {
    tier: 'low',
    dpr: [1, 1.25],
    aoHalfResolution: true,
    shadowMap: 1024,
    reflection: 0.35,
  },
};

export var detectTier = (): Tier =>
  isClient &&
  (window.matchMedia('(pointer: coarse)').matches ||
    (navigator.hardwareConcurrency ?? 8) <= 4)
    ? 'low'
    : 'high';
