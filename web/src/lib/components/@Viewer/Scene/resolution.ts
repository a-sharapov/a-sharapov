var _WINDOW = 90;

var _SLOW = 1 / 48;

var _GPU_BOUND = 0.6;

export var DPR_STEP = 0.25;
var _MIN_DPR = 1;

export type FrameSample = { interval: number; cpu: number };

var _median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[values.length >> 1] ?? 0;

export var nextDpr = (dpr: number, samples: FrameSample[]) =>
  ((interval, cpu) =>
    samples.length >= _WINDOW && interval > _SLOW && cpu < interval * _GPU_BOUND
      ? Math.max(_MIN_DPR, dpr - DPR_STEP)
      : dpr)(
    _median(samples.map(({ interval }) => interval)),
    _median(samples.map(({ cpu }) => cpu))
  );

export var windowFull = (samples: FrameSample[]) => samples.length >= _WINDOW;
