#!/usr/bin/env bun

import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  type Browser,
  type CDPSession,
  chromium,
  type Page,
} from 'playwright-core';

type Theme = 'light' | 'dark';
type Variant = 'uhd' | 'hd';
type Spot = 'intro' | 'resume' | 'sketchbook' | 'portrait' | 'tablet';
type Rect = [left: number, top: number, width: number, height: number];
type Clip = {
  seconds: number;
  reveal?: number;
  thrown?: number;
  away?: number;
};
type Probe = {
  phase: string;
  still: boolean;
  thrown: boolean;
  path: string;
  toss: number;
};
type Session = {
  from: Spot;
  to?: Spot;
  loop?: boolean;
  card?: boolean;
  toss?: boolean;
};
type Manifest = {
  frame: { width: number; height: number };
  video: Record<Variant, { width: number; height: number }> & { fps: number };
  faces: Partial<Record<Spot, Rect>>;
  card: { spot?: Rect; links?: (Rect | null)[] };
  loops: Record<Theme, Record<string, number>>;
  clips: Record<Theme, Record<string, Clip>>;
  versions: Record<string, string>;
};
type Take = {
  page: Page;
  cdp: CDPSession;
  theme: Theme;
  manifest: Manifest;
  encodes: Promise<unknown>[];
};

const FRAME = { width: 1600, height: 850, scale: 2.4 } as const;
const STEP_MS = 32;
const FPS = 1000 / STEP_MS;
const LOOP = { seconds: 6, blend: 1 };
const STILL_STREAK = 12;
const MAX_FRAMES = Math.round(12 * FPS);
const GUST_CLEAR_MS = 12500;
const FRAME_DEADLINE_MS = 60000;
const VARIANTS: { name: Variant; scale: number; crf: number; tiles: number }[] =
  [
    { name: 'uhd', scale: 1, crf: 26, tiles: 3 },
    { name: 'hd', scale: 2048 / 3840, crf: 20, tiles: 2 },
  ];
const SPOTS: Spot[] = ['intro', 'resume', 'sketchbook', 'portrait', 'tablet'];
const TARGETS = SPOTS.filter((spot) => spot !== 'tablet');
const PAGES: Record<Spot, string> = {
  intro: '/',
  resume: '/ru/cv',
  sketchbook: '/ru/services',
  portrait: '/ru/contacts',
  tablet: '/ru/404',
};
const HIDE_CHROME =
  'header, main, footer, .scene-loader { visibility: hidden !important; }';
const ROOT = resolve(import.meta.dir, '../..');
const OUT = `${ROOT}/web/static/video`;
const MANIFEST = `${ROOT}/web/src/lib/components/@Viewer/Video/clips.json`;
const CHROME_FLAGS = [
  '--enable-unsafe-webgpu',
  '--enable-features=Vulkan',
  '--ignore-gpu-blocklist',
  '--enable-gpu',
  '--use-angle=vulkan',
];

const { values: cli } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    origin: { type: 'string', default: 'http://127.0.0.1:5701' },
    chrome: {
      type: 'string',
      default: Bun.env.CHROME ?? '/usr/bin/google-chrome',
    },
    theme: { type: 'string', default: 'light,dark' },
    only: { type: 'string', default: '' },
    frames: {
      type: 'string',
      default: `${Bun.env.XDG_CACHE_HOME ?? `${Bun.env.HOME}/.cache`}/a-sharapov-video`,
    },
    keep: { type: 'boolean', default: false },
  },
});

const ONLY = cli.only.split(',').filter(Boolean);

const SESSIONS: Session[] = [
  ...SPOTS.flatMap((from) =>
    TARGETS.filter((to) => to !== from).map((to, index) => ({
      from,
      to,
      loop: index === 0,
    }))
  ),
  { from: 'intro', card: true },
  { from: 'portrait', toss: true },
];

const _clipsOf = (session: Session): string[] => [
  ...(session.loop ? [session.from] : []),
  ...(session.to ? [`${session.from}-${session.to}`] : []),
  ...(session.card ? ['card-out', 'card', 'card-in'] : []),
  ...(session.toss ? ['toss'] : []),
];

const _wanted = (session: Session) =>
  ONLY.length === 0 || _clipsOf(session).some((name) => ONLY.includes(name));

const _blank = (): Manifest => ({
  frame: { width: FRAME.width, height: FRAME.height },
  video: {
    ...(Object.fromEntries(
      VARIANTS.map((variant) => [
        variant.name,
        {
          width: Math.round(FRAME.width * FRAME.scale * variant.scale),
          height: Math.round(FRAME.height * FRAME.scale * variant.scale),
        },
      ])
    ) as Record<Variant, { width: number; height: number }>),
    fps: FPS,
  },
  faces: {},
  card: {},
  loops: { light: {}, dark: {} },
  clips: { light: {}, dark: {} },
  versions: {},
});

const _determinism = ({ theme, scale }: { theme: Theme; scale: number }) => {
  localStorage.setItem('AS_theme', `${theme}@${Date.now() + 864e5}`);
  void import('/src/lib/components/@Viewer/Scene/quality.ts').then(
    (module: { QUALITY: Record<string, { dpr: [number, number] }> }) =>
      void Object.values(module.QUALITY).forEach(
        (tier) => void (tier.dpr = [scale, scale])
      )
  );
  void import('/src/lib/components/@Viewer/Scene/lens/film.ts').then(
    (module: { GRAIN: { gain: number } }) => void (module.GRAIN.gain = 0)
  );
  const state = { seed: 0x2545f491, jitter: 0, lights: 0 };
  const jitter = [0.8, 0.55, 0.5, 0.65];
  const prng = () => {
    state.seed = (state.seed + 0x6d2b79f5) | 0;
    const a = Math.imul(state.seed ^ (state.seed >>> 15), 1 | state.seed);
    const b = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
    return ((b ^ (b >>> 14)) >>> 0) / 4294967296;
  };
  Math.random = () =>
    ((stack) =>
      stack.includes('rollJitter')
        ? (jitter[state.jitter++ % jitter.length] ?? 0.5)
        : stack.includes('Lights.svelte')
          ? state.lights++ === 0
            ? 0
            : 0.9999
          : prng())(new Error().stack ?? '');
};

const _probe = (page: Page): Promise<Probe> =>
  page
    .evaluate(() =>
      ((rig) => ({
        phase:
          document.querySelector('.viewer')?.getAttribute('data-phase') ?? '',
        still: rig?.still === true,
        thrown: document.documentElement.hasAttribute('data-thrown'),
        path: location.pathname,
        toss: rig?.thrown ?? -1,
        overlay: document.querySelector('vite-error-overlay') !== null,
      }))(
        (window as { __asDebug?: { rig?: { still: boolean; thrown: number } } })
          .__asDebug?.rig
      )
    )
    .then(({ overlay, ...probe }) =>
      overlay ? Promise.reject(new Error('ошибка Vite на странице')) : probe
    );

const _deadline = <T>(work: Promise<T>, what: string) =>
  Promise.race([
    work,
    Bun.sleep(FRAME_DEADLINE_MS).then(() =>
      Promise.reject(new Error(`${what}: нет ответа ${FRAME_DEADLINE_MS} мс`))
    ),
  ]);

const _name = (index: number) => `f${String(index).padStart(4, '0')}.png`;

const _shoot = (take: Take, dir: string, index: number) =>
  take.cdp
    .send('Page.captureScreenshot', {
      format: 'png',
      optimizeForSpeed: true,
      clip: {
        x: 0,
        y: 0,
        width: FRAME.width,
        height: FRAME.height,
        scale: FRAME.scale,
      },
    })
    .then(({ data }) =>
      Bun.write(`${dir}/${_name(index)}`, Buffer.from(data, 'base64'))
    );

const _frames = (
  take: Take,
  dir: string,
  done: (history: Probe[]) => boolean,
  history: Probe[]
): Promise<Probe[]> =>
  history.length > MAX_FRAMES
    ? Promise.reject(
        new Error(`${dir}: не успокоилось за ${MAX_FRAMES} кадров`)
      )
    : _deadline(
        take.page.clock
          .runFor(STEP_MS)
          .then(() => _shoot(take, dir, history.length))
          .then(() => _probe(take.page)),
        `${dir}/${_name(history.length)}`
      ).then((probe) =>
        ((next) => (done(next) ? next : _frames(take, dir, done, next)))([
          ...history,
          probe,
        ])
      );

const _record = (
  take: Take,
  name: string,
  trigger: () => Promise<unknown>,
  done: (history: Probe[]) => boolean
) =>
  ((dir) =>
    Bun.$`rm -rf ${dir} && mkdir -p ${dir}`
      .then(() => _shoot(take, dir, 0))
      .then(() => _probe(take.page))
      .then((first) => trigger().then(() => _frames(take, dir, done, [first])))
      .then((history) => ({ dir, history })))(
    `${cli.frames}/${take.theme}/${name}`
  );

const _streak = (history: Probe[], ok: (probe: Probe) => boolean) =>
  history.length > STILL_STREAK && history.slice(-STILL_STREAK).every(ok);

const _settledStill = (probe: Probe) =>
  probe.phase === 'settled' && probe.still && probe.toss < 0;

const _arrived = (history: Probe[]) =>
  history.some((probe) => probe.phase !== 'settled') &&
  _streak(history, _settledStill);

const _rested = (history: Probe[]) =>
  history.some((probe) => !probe.still) && _streak(history, _settledStill);

const _cut = (history: Probe[]) => history.length - STILL_STREAK + 2;

const _first = (
  history: Probe[],
  test: (probe: Probe, index: number) => boolean
) =>
  ((index) => (index < 0 ? undefined : Number((index / FPS).toFixed(3))))(
    history.findIndex(test)
  );

const _encodeArgs = (variant: (typeof VARIANTS)[number]) => [
  '-c:v',
  'libvpx-vp9',
  '-crf',
  String(variant.crf),
  '-b:v',
  '0',
  '-row-mt',
  '1',
  '-threads',
  '8',
  '-tile-columns',
  String(variant.tiles),
  '-deadline',
  'good',
  '-cpu-used',
  '3',
  '-g',
  '64',
  '-an',
];

const _COLOR =
  'setparams=color_primaries=bt709:color_trc=iec61966-2-1:colorspace=bt709:range=tv';

const _fileOf = (variant: Variant, theme: Theme, name: string) =>
  `${OUT}/${variant}/${theme}/${name}.webm`;

const _split = (source: string) =>
  `${source}split=${VARIANTS.length}${VARIANTS.map((variant) => `[raw_${variant.name}]`).join('')};${VARIANTS.map(
    (variant) =>
      `[raw_${variant.name}]scale=${Math.round(FRAME.width * FRAME.scale * variant.scale)}:${Math.round(FRAME.height * FRAME.scale * variant.scale)}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,${_COLOR}[${variant.name}]`
  ).join(';')}`;

const _outputs = (theme: Theme, name: string) =>
  VARIANTS.flatMap((variant) => [
    '-map',
    `[${variant.name}]`,
    ..._encodeArgs(variant),
    _fileOf(variant.name, theme, name),
  ]);

const _ffmpeg = (dir: string, theme: Theme, name: string, graph: string) =>
  Bun.$`mkdir -p ${VARIANTS.map((variant) => `${OUT}/${variant.name}/${theme}`)} && ffmpeg -loglevel error -y -framerate ${FPS} -start_number 0 -i ${dir}/f%04d.png -filter_complex ${graph} ${_outputs(theme, name)}`;

const _encode = (take: Take, dir: string, name: string, frames: number) =>
  _ffmpeg(
    dir,
    take.theme,
    name,
    _split(`[0:v]trim=end_frame=${frames},setpts=PTS-STARTPTS,`)
  ).then(() => console.log(`  ${take.theme}/${name}.webm`));

const _encodeLoop = (take: Take, dir: string, name: string) =>
  ((head, total) =>
    _ffmpeg(
      dir,
      take.theme,
      name,
      _split(
        `[0:v]split[a][b];[a]trim=start_frame=${head}:end_frame=${total},setpts=PTS-STARTPTS[tail];[b]trim=end_frame=${head},setpts=PTS-STARTPTS[head];[tail][head]xfade=transition=fade:duration=${LOOP.blend}:offset=0,`
      )
    ).then(() => console.log(`  ${take.theme}/${name}.webm (петля)`)))(
    Math.round(LOOP.seconds * FPS),
    Math.round((LOOP.seconds + LOOP.blend) * FPS)
  );

const _encoder = { chain: Promise.resolve() as Promise<unknown> };

const _keep = (take: Take, dir: string, job: () => Promise<unknown>) =>
  void take.encodes.push(
    (_encoder.chain = _encoder.chain
      .then(job)
      .then(() => (cli.keep ? undefined : Bun.$`rm -rf ${dir}`))
      .catch(
        (error: Error) =>
          void ((process.exitCode = 1),
          console.error(`  сбой кодирования ${dir}: ${error.message}`))
      ))
  );

const _loop = (take: Take, name: string) =>
  _record(
    take,
    name,
    () => Promise.resolve(),
    (history) => history.length >= Math.round((LOOP.seconds + LOOP.blend) * FPS)
  ).then(({ dir }) => {
    take.manifest.loops[take.theme][name] = LOOP.seconds;
    _keep(take, dir, () => _encodeLoop(take, dir, name));
  });

const _clip = (
  take: Take,
  name: string,
  trigger: () => Promise<unknown>,
  done: (history: Probe[]) => boolean,
  marks: (history: Probe[]) => Omit<Clip, 'seconds'> = () => ({})
) =>
  _record(take, name, trigger, done).then(({ dir, history }) =>
    ((frames) => {
      take.manifest.clips[take.theme][name] = {
        seconds: Number((frames / FPS).toFixed(3)),
        ...marks(history),
      };
      _keep(take, dir, () => _encode(take, dir, name, frames));
    })(_cut(history))
  );

const _revealed = (history: Probe[]) => ({
  reveal: _first(
    history,
    (probe, index) =>
      index > 0 &&
      probe.phase === 'settled' &&
      history.slice(0, index).some((before) => before.phase !== 'settled')
  ),
});

const _face = (take: Take, spot: Spot) =>
  spot === 'intro'
    ? Promise.resolve()
    : take.page
        .evaluate(() =>
          ((sheet) =>
            sheet
              ? [
                  sheet.offsetLeft,
                  sheet.offsetTop,
                  sheet.offsetWidth,
                  sheet.offsetHeight,
                ]
              : null)(document.querySelector<HTMLElement>('main .sheet'))
        )
        .then(
          (rect) => void (rect && (take.manifest.faces[spot] = rect as Rect))
        );

const _travel = (take: Take, from: Spot, to: Spot) =>
  _clip(
    take,
    `${from}-${to}`,
    () =>
      take.page.evaluate(
        (href) =>
          document
            .querySelector<HTMLAnchorElement>(`header a[href="${href}"]`)
            ?.click(),
        PAGES[to]
      ),
    _arrived,
    _revealed
  );

const _projected = (take: Take, name: string) =>
  take.page.evaluate(
    ({ name, width, height }) => {
      type Vec = {
        clone: () => Vec;
        set: (x: number, y: number, z: number) => Vec;
        applyMatrix4: (m: unknown) => Vec;
        project: (camera: unknown) => Vec;
        x: number;
        y: number;
        z: number;
      };
      type Mesh = {
        isMesh?: boolean;
        geometry: {
          computeBoundingBox: () => void;
          boundingBox: { min: Vec; max: Vec };
        };
        matrixWorld: unknown;
        updateWorldMatrix: (parents: boolean, children: boolean) => void;
        traverse: (visit: (node: Mesh) => void) => void;
      };
      const debug = (
        window as unknown as {
          __asDebug: {
            scene: { getObjectByName: (name: string) => Mesh | undefined };
            camera: { current: unknown };
          };
        }
      ).__asDebug;
      const root = debug.scene.getObjectByName(name);
      const meshes: Mesh[] = [];
      root?.traverse((node) => void (node.isMesh && meshes.push(node)));
      const points = meshes.flatMap((mesh) => {
        mesh.updateWorldMatrix(true, false);
        mesh.geometry.computeBoundingBox();
        const { min, max } = mesh.geometry.boundingBox;
        return Array.from({ length: 8 }, (_, i) =>
          min
            .clone()
            .set(
              i & 1 ? max.x : min.x,
              i & 2 ? max.y : min.y,
              i & 4 ? max.z : min.z
            )
            .applyMatrix4(mesh.matrixWorld)
            .project(debug.camera.current)
        );
      });
      const xs = points.map((p) => ((p.x + 1) / 2) * width);
      const ys = points.map((p) => ((1 - p.y) / 2) * height);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      return [left, top, Math.max(...xs) - left, Math.max(...ys) - top];
    },
    { name, width: FRAME.width, height: FRAME.height }
  ) as Promise<Rect>;

const _pointer = (take: Take, type: string, x: number, y: number) =>
  take.page.evaluate(
    ({ type, x, y }) =>
      document.querySelector('.viewer canvas')?.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
          buttons: type === 'pointerdown' ? 1 : 0,
        })
      ),
    { type, x, y }
  );

const _tap = (take: Take, x: number, y: number) =>
  _pointer(take, 'pointerdown', x, y)
    .then(() => _pointer(take, 'pointerup', x, y))
    .then(() =>
      take.page.evaluate(
        ({ x, y }) =>
          document.querySelector('.viewer canvas')?.dispatchEvent(
            new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
            })
          ),
        { x, y }
      )
    );

const _scanLinks = (take: Take, rect: Rect) =>
  take.page.evaluate(
    ({ rect, width, height }) => {
      const canvas = document.querySelector(
        '.viewer canvas'
      ) as HTMLCanvasElement;
      const frame = window.requestAnimationFrame;
      const queue = { due: [] as FrameRequestCallback[] };
      window.requestAnimationFrame = (callback) =>
        1e9 + queue.due.push(callback);
      const flush = () =>
        ((due) => (
          (queue.due = []),
          due.forEach((callback) => void callback(performance.now()))
        ))(queue.due);
      const move = (x: number, y: number) => (
        canvas.dispatchEvent(
          new PointerEvent('pointermove', {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          })
        ),
        flush()
      );
      const { 0: left, 1: top, 2: w, 3: h } = rect;
      const rows = Array.from(
        { length: Math.ceil(h / 2) },
        (_, r) => top + r * 2
      )
        .map((y) => ({
          y,
          hits: Array.from(
            { length: Math.ceil(w / 3) },
            (_, c) => left + c * 3
          ).filter(
            (x) => (move(x, y), document.body.style.cursor === 'pointer')
          ),
        }))
        .filter((row) => row.hits.length > 0);
      move(width / 2, height / 2);
      canvas.dispatchEvent(
        new PointerEvent('pointerleave', { bubbles: true, pointerId: 1 })
      );
      window.requestAnimationFrame = frame;
      queue.due.forEach((callback) => void frame(callback));
      const count = document.querySelectorAll('.paper-card .back li').length;
      const first = rows.at(0)?.y ?? 0;
      const step = ((rows.at(-1)?.y ?? 0) + 2 - first) / Math.max(1, count);
      return Array.from({ length: count }, (_, index) =>
        ((xs) =>
          xs.length === 0
            ? null
            : [
                Math.min(...xs),
                first + index * step,
                Math.max(...xs) - Math.min(...xs) + 3,
                step,
              ])(
          rows
            .filter(
              (row) =>
                row.y >= first + index * step &&
                row.y < first + (index + 1) * step
            )
            .flatMap((row) => row.hits)
        )
      );
    },
    { rect, width: FRAME.width, height: FRAME.height }
  ) as Promise<(Rect | null)[]>;

const _card = (take: Take) =>
  _projected(take, 'cardSpot')
    .then((spot) => {
      take.manifest.card.spot = spot;
      return _clip(
        take,
        'card-out',
        () => _tap(take, spot[0] + spot[2] / 2, spot[1] + spot[3] / 2),
        _rested
      );
    })
    .then(() => _projected(take, 'card'))
    .then((rect) => _scanLinks(take, rect))
    .then((links) => void (take.manifest.card.links = links))
    .then(() => _loop(take, 'card'))
    .then(() =>
      _clip(
        take,
        'card-in',
        () =>
          take.page.evaluate(() =>
            window.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Escape' })
            )
          ),
        _rested
      )
    );

const _toss = (take: Take) =>
  _clip(
    take,
    'toss',
    () =>
      take.page.evaluate(() =>
        window.dispatchEvent(new CustomEvent('inquiry:sent'))
      ),
    (history) =>
      history.some((probe) => probe.path === '/') &&
      _streak(history, (probe) => probe.path === '/' && _settledStill(probe)),
    (history) => ({
      ..._revealed(history),
      thrown: _first(history, (probe) => probe.thrown),
      away: _first(history, (probe) => probe.path === '/'),
    })
  );

const _settle = (page: Page) =>
  page
    .waitForFunction(
      () => 'scene' in ((window as { __asDebug?: object }).__asDebug ?? {}),
      null,
      {
        timeout: 180000,
        polling: 50,
      }
    )
    .then(() => page.evaluate(() => performance.now()))
    .then((mount) =>
      page.waitForFunction(
        (at) =>
          performance.now() > at &&
          document.querySelector('.viewer')?.getAttribute('data-phase') ===
            'settled' &&
          (window as { __asDebug?: { rig?: { still: boolean } } }).__asDebug
            ?.rig?.still === true,
        mount + GUST_CLEAR_MS,
        { timeout: 180000, polling: 100 }
      )
    )
    .then(() =>
      page.evaluate(async () => {
        const motion = await import(
          '/src/lib/components/@Viewer/Scene/lens/motion.ts'
        );
        motion.MOTION.exposure = 1 / 62.5;
      })
    )
    .then(() => page.addStyleTag({ content: HIDE_CHROME }))
    .then(() => page.evaluate(() => Date.now()))
    .then((now) => page.clock.pauseAt(now + 50))
    .then(() => page.clock.runFor(STEP_MS * 4));

const _steps = (take: Take, session: Session) =>
  [
    () => _face(take, session.from),
    ...(session.loop ? [() => _loop(take, session.from)] : []),
    ...(session.to
      ? [
          (
            (to: Spot) => () =>
              _travel(take, session.from, to)
          )(session.to),
        ]
      : []),
    ...(session.card ? [() => _card(take)] : []),
    ...(session.toss ? [() => _toss(take)] : []),
  ].reduce<Promise<unknown>>(
    (chain, step) => chain.then(step),
    Promise.resolve()
  );

const _take = (
  browser: Browser,
  theme: Theme,
  session: Session,
  manifest: Manifest,
  encodes: Promise<unknown>[]
) =>
  browser
    .newContext({
      viewport: { width: FRAME.width, height: FRAME.height },
      deviceScaleFactor: FRAME.scale,
    })
    .then((context) =>
      context
        .addInitScript(_determinism, { theme, scale: FRAME.scale })
        .then(() => context.newPage())
        .then((page) =>
          page.clock
            .install()
            .then(() => page.goto(`${cli.origin}${PAGES[session.from]}`))
            .then(() => _settle(page))
            .then(() => _probe(page))
            .then(() => context.newCDPSession(page))
            .then((cdp) =>
              _steps({ page, cdp, theme, manifest, encodes }, session)
            )
        )
        .finally(() => context.close())
    );

const _sessions = (
  browser: Browser,
  theme: Theme,
  manifest: Manifest,
  encodes: Promise<unknown>[]
) =>
  SESSIONS.filter(_wanted).reduce<Promise<unknown>>(
    (chain, session, index, all) =>
      chain.then(() => {
        console.log(
          `${theme} ${index + 1}/${all.length}: ${_clipsOf(session).join(', ')}`
        );
        return _take(browser, theme, session, manifest, encodes).catch(
          (error: Error) =>
            void ((process.exitCode = 1),
            console.error(`  сбой: ${error.message}`))
        );
      }),
    Promise.resolve()
  );

const _pick = <T extends object>(value: T, keys: (keyof T)[]) =>
  Object.fromEntries(keys.map((key) => [key, value[key]])) as Partial<T>;

const _readManifest = (): Promise<Manifest> =>
  Bun.file(MANIFEST)
    .exists()
    .then((exists) => (exists ? Bun.file(MANIFEST).json() : _blank()))
    .then((stored: Manifest) => ({
      ..._blank(),
      ...stored,
      ..._pick(_blank(), ['frame', 'video']),
    }));

const _json = (manifest: Manifest) => `${JSON.stringify(manifest, null, 2)}\n`;

const _hash = (file: string) =>
  Bun.file(file)
    .arrayBuffer()
    .then((data) =>
      new Bun.CryptoHasher('sha256').update(data).digest('hex').slice(0, 10)
    );

const _versions = (manifest: Manifest) =>
  Promise.all(
    VARIANTS.flatMap(({ name: variant }) =>
      (['light', 'dark'] as Theme[]).flatMap((theme) =>
        [
          ...Object.keys(manifest.loops[theme]),
          ...Object.keys(manifest.clips[theme]),
        ].map((name) =>
          _hash(_fileOf(variant, theme, name)).then(
            (hash) => [`${variant}/${theme}/${name}`, hash] as const,
            () => null
          )
        )
      )
    )
  ).then(
    (pairs) =>
      void (manifest.versions = Object.fromEntries(
        pairs.filter((pair) => pair !== null).toSorted()
      ))
  );

const themes = cli.theme
  .split(',')
  .filter((theme): theme is Theme => theme === 'light' || theme === 'dark');

const manifest = await _readManifest();
await Bun.file(MANIFEST)
  .exists()
  .then((exists) =>
    exists ? undefined : Bun.write(MANIFEST, _json(manifest))
  );
const encodes: Promise<unknown>[] = [];
const planned = SESSIONS.filter(_wanted).length > 0;
const browser = planned
  ? await chromium.launch({
      executablePath: cli.chrome,
      headless: true,
      args: CHROME_FLAGS,
    })
  : null;

await themes
  .reduce<Promise<unknown>>(
    (chain, theme) =>
      chain.then(() =>
        browser ? _sessions(browser, theme, manifest, encodes) : undefined
      ),
    Promise.resolve()
  )
  .finally(() => browser?.close());
await Promise.all(encodes);
await _versions(manifest);
await Bun.write(MANIFEST, _json(manifest));
console.log(`манифест: ${MANIFEST}`);
