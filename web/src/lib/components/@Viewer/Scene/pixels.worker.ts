import { computePixels, type PixelJob } from './pixel-recipes';

addEventListener(
  'message',
  ({ data: { id, job } }: MessageEvent<{ id: number; job: PixelJob }>) =>
    ((pixels) => postMessage({ id, pixels }, { transfer: [pixels.buffer] }))(
      computePixels(job)
    )
);
