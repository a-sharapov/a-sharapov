export type Graphics =
  | 'discrete'
  | 'modern'
  | 'integrated'
  | 'software'
  | 'unknown';

export interface Device {
  renderer: string | null;
  caveat: boolean;
  cores: number;
  memory: number;
}

var _LOW = 4;

var _KINDS: { 0: RegExp; 1: Graphics }[] = [
  { 0: /swiftshader|llvmpipe|softpipe|lavapipe|basic render/i, 1: 'software' },
  { 0: /nvidia|geforce|quadro|\brtx\b|\bgtx\b/i, 1: 'discrete' },
  { 0: /\barc\S*\s+[ab]\d{3}\b/i, 1: 'discrete' },
  {
    0: /\barc\b|apple\s*(m\d|gpu)|adreno\S*\s*x\d|radeon\S*\s*([678][6-9]0m|80\d0s)\b/i,
    1: 'modern',
  },
  {
    0: /intel|radeon\S*[^,()]*\bgraphics\b|radeon\S*\s*\d{3}m\b|\bvega\s*\d|mali|adreno|powervr|apple\s*a\d/i,
    1: 'integrated',
  },
  { 0: /\bamd\b|radeon/i, 1: 'discrete' },
];

export var graphicsOf = (renderer: string | null, caveat = false): Graphics =>
  renderer === null || caveat
    ? 'software'
    : (_KINDS.find(({ 0: pattern }) => pattern.test(renderer))?.[1] ??
      'unknown');

export var weakDevice = ({
  renderer,
  caveat,
  cores,
  memory,
}: Device): boolean =>
  ((graphics) =>
    graphics === 'software' ||
    graphics === 'integrated' ||
    (graphics !== 'discrete' && (cores <= _LOW || memory <= _LOW)))(
    graphicsOf(renderer, caveat)
  );

var _context = (strict: boolean): WebGLRenderingContext | null =>
  ((canvas: HTMLCanvasElement, options: WebGLContextAttributes) =>
    canvas.getContext('webgl2', options) ??
    canvas.getContext('webgl', options))(document.createElement('canvas'), {
    failIfMajorPerformanceCaveat: strict,
    powerPreference: 'high-performance',
  });

var _rendererOf = (gl: WebGLRenderingContext): string =>
  ((info) =>
    String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))(
    gl.getExtension('WEBGL_debug_renderer_info')
  );

var _read = (gl: WebGLRenderingContext | null): string | null =>
  gl &&
  ((renderer) => (
    gl.getExtension('WEBGL_lose_context')?.loseContext(), renderer
  ))(_rendererOf(gl));

var _probe = (): Pick<Device, 'renderer' | 'caveat'> =>
  ((strict) =>
    strict === null
      ? { renderer: _read(_context(false)), caveat: true }
      : { renderer: strict, caveat: false })(_read(_context(true)));

var _safeProbe = (): Pick<Device, 'renderer' | 'caveat'> => {
  try {
    return _probe();
  } catch {
    return { renderer: null, caveat: true };
  }
};

export var probeDevice = (): Device =>
  ((navigation) => ({
    ..._safeProbe(),
    cores: navigation.hardwareConcurrency || Number.POSITIVE_INFINITY,
    memory: navigation.deviceMemory ?? Number.POSITIVE_INFINITY,
  }))(navigator as Navigator & { deviceMemory?: number });
