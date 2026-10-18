import { goboPixels } from './gobo-pixels';
import { gradeDay, gradeNight, LUT_SIZE, lutData } from './lens/grade';
import { coatingPixels, grainPixels } from './pixels';
import { steamPixels } from './Steam/noise-pixels';

export type PixelJob =
  | { kind: 'grain'; size: number; period: number; seed: number }
  | { kind: 'coating' }
  | { kind: 'gobo'; pattern: 'frame' | 'leaves' }
  | { kind: 'steam' }
  | { kind: 'lut'; grade: 'day' | 'night' };

export type Pixels = Uint8Array | Uint16Array;

var _GRADES = { day: gradeDay, night: gradeNight };

var _RECIPES: {
  [K in PixelJob['kind']]: (job: Extract<PixelJob, { kind: K }>) => Pixels;
} = {
  grain: ({ size, period, seed }) => grainPixels(size, period, seed),
  coating: () => coatingPixels(),
  gobo: ({ pattern }) => goboPixels(pattern),
  steam: () => steamPixels(),
  lut: ({ grade }) => lutData(_GRADES[grade], LUT_SIZE),
};

export var computePixels = (job: PixelJob): Pixels =>
  (_RECIPES[job.kind] as (job: PixelJob) => Pixels)(job);

export var pixelKey = (job: PixelJob): string => JSON.stringify(job);
