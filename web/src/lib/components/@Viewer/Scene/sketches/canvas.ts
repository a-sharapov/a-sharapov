export var sheet = (width: number, height: number): OffscreenCanvas =>
  ((canvas) => (canvas.getContext('2d', { willReadFrequently: true }), canvas))(
    new OffscreenCanvas(width, height)
  );

export var draw2d = (
  canvas: OffscreenCanvas
): OffscreenCanvasRenderingContext2D => canvas.getContext('2d')!;
