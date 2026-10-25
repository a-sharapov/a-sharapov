<script lang="ts">
  import { untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { DEFAULT_LOCALE, INDEX_SLUG, INQUIRY_SENT, SHOTS } from '#lib/common/constants.ts';
  import { hrefFor } from '#lib/common/routes.ts';
  import { shell } from '#lib/common/shell.svelte.ts';
  import type { ContactRecord, Shot, Theme } from '#lib/common/types.ts';
  import { delay, localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import {
    afterNavigate,
    type BeforeNavigate,
    beforeNavigate,
    goto,
    onNavigate,
  } from '$app/navigation';
  import type { Phase } from '../Scene/state.svelte';
  import {
    type Clip,
    cardLinks,
    clipUrl,
    type Display,
    FACED,
    fitVideo,
    GRAIN_TILE,
    grainPixels,
    insetOf,
    type Leg,
    legOf,
    percentOf,
    type Rect,
    routeOf,
    type Spot,
    spotOf,
    type Variant,
    VIDEO,
    variantFor,
  } from './video';
  import './Video.css';

  interface IVideoViewer {
    t: Dictionary;
    shot: Shot;
    notFound: boolean;
    contacts: ContactRecord[];
  }

  type Step = { leg: Leg } | { jump: Spot };
  type Showing = { leg: Leg | null; spot: Spot; clip: Clip | null };
  type Load = { loop: boolean; fade: number; at?: () => number; rate?: number };

  let { t: dictionary, shot: pageShot, contacts }: IVideoViewer = $props();

  const _LEAVE_MS = 260;
  const _TAGLINE_MS = 400;
  const _REVEAL_MS = 300;
  const _STILL_MS = 350;
  const _SEAM_MS = 240;
  const _JUMP_MS = 600;
  const _THEME_MS = 500;
  const _HURRY = 4;
  const _SPOTS: Spot[] = ['intro', 'resume', 'sketchbook', 'portrait', 'tablet', 'card'];
  const _STALE = new Error('stale');

  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)').current;
  const t = $derived(localize(dictionary));
  const links = $derived(cardLinks(contacts));

  let phase = $state<Phase>('boot');
  let here = $state<Spot | null>(null);
  let front = $state(0);
  let shown = $state([false, false]);
  let fade = $state(_SEAM_MS);
  let videos = $state<HTMLVideoElement[]>([]);
  let host = $state<HTMLElement>();
  let probe = $state<HTMLElement>();
  let viewport = $state({ width: 0, height: 0 });
  let guard = $state<Rect>([0, 0, 0, 0]);
  let grain = $state({ url: '', size: GRAIN_TILE });

  let display = $state<Display>();

  const fit = $derived(fitVideo(viewport, guard, VIDEO, display));

  const engine = {
    showing: null as Showing | null,
    playing: null as HTMLVideoElement | null,
    live: false,
    queue: [] as Step[],
    target: 'intro' as Spot,
    seq: 0,
    ready: true,
    swapping: false,
    leftAt: 0,
    holdUntil: 0,
    hurry: false,
    theme: shell.theme as Theme,
    variant: 'hd' as Variant,
    tossed: { thrown: false, away: false },
  };

  const sources = new Map<string, Promise<string>>();

  const _theme = (): Theme => shell.theme;
  const _url = (name: string) => clipUrl(engine.variant, _theme(), name);
  const _available = () => VIDEO.clips[_theme()];

  const _source = (url: string): Promise<string> =>
    sources.get(url) ??
    ((pending) => (sources.set(url, pending), pending))(
      fetch(url)
        .then((response) =>
          response.ok ? response.blob() : Promise.reject(new Error(`${url}: ${response.status}`))
        )
        .then((blob) => URL.createObjectURL(blob))
        .catch((error: unknown) => (sources.delete(url), Promise.reject(error)))
    );

  const _warm = (name: string) =>
    _source(_url(name)).then(
      () => undefined,
      () => undefined
    );

  const _once = (el: HTMLVideoElement, event: string) =>
    new Promise<void>((resolve, reject) => {
      const done = () => (el.removeEventListener('error', fail), resolve());
      const fail = () => (el.removeEventListener(event, done), reject(el.error));
      el.addEventListener(event, done, { once: true });
      el.addEventListener('error', fail, { once: true });
    });

  const _painted = (el: HTMLVideoElement) =>
    new Promise<void>((resolve) =>
      'requestVideoFrameCallback' in el
        ? el.requestVideoFrameCallback(() => resolve())
        : requestAnimationFrame(() => resolve())
    );

  const _seek = (el: HTMLVideoElement, at: number) =>
    at > 0 ? ((el.currentTime = at), _once(el, 'seeked')) : void (el.currentTime = 0);

  const _load = (el: HTMLVideoElement, url: string, load: Load) =>
    (el.src === url && el.readyState >= 2
      ? Promise.resolve()
      : ((el.src = url), _once(el, 'loadeddata'))
    )
      .then(() => _seek(el, load.at?.() ?? 0))
      .then(() => {
        el.loop = load.loop;
        el.playbackRate = load.rate ?? 1;
        return el.play();
      })
      .then(() => _painted(el));

  const _hurried = () => engine.hurry && engine.queue.length > 0;

  const _swap = (slot: number, ms: number) =>
    ((el) => {
      fade = ms;
      front = slot;
      shown[slot] = true;
      engine.playing = el;
      engine.live = true;
      void (el && engine.showing?.leg && _hurried() && (el.playbackRate = _HURRY));
      void delay(ms + 50).then(
        () => void (front === slot && ((shown[1 - slot] = false), videos[1 - slot]?.pause()))
      );
    })(videos[slot] ?? null);

  const _present = (name: string, load: Load) =>
    ((token, slot) =>
      _source(_url(name))
        .then((url) =>
          token === engine.seq
            ? _load(videos[slot] as HTMLVideoElement, url, load)
            : Promise.reject(_STALE)
        )
        .then(() => (token === engine.seq ? _swap(slot, load.fade) : Promise.reject(_STALE))))(
      ++engine.seq,
      1 - front
    );

  const _reached = (showing: Showing, playing: HTMLVideoElement) =>
    showing.leg
      ? showing.leg.to === engine.target &&
        playing.currentTime >= (showing.clip?.reveal ?? showing.clip?.seconds ?? 0)
      : showing.spot === engine.target;

  const _maybeSettle = () =>
    void (
      phase === 'moving' &&
      engine.ready &&
      engine.live &&
      engine.queue.length === 0 &&
      performance.now() >= engine.holdUntil &&
      engine.showing &&
      engine.playing &&
      _reached(engine.showing, engine.playing) &&
      ((phase = 'settled'), _prefetch())
    );

  const _loop = (spot: Spot, ms: number) => {
    engine.showing = { leg: null, spot, clip: null };
    engine.live = false;
    return _present(spot, { loop: true, fade: ms }).then(
      () =>
        void ((here = spot),
        reducedMotion && engine.playing?.pause(),
        phase === 'boot' && _loaded()),
      (error: unknown) => void (error === _STALE || console.error('VideoViewer:', error))
    );
  };

  const _play = (leg: Leg) => {
    engine.showing = {
      leg,
      spot: leg.to,
      clip: _available()[leg.name] ?? null,
    };
    engine.live = false;
    here = null;
    void _warm(leg.to);
    void _present(leg.name, { loop: false, fade: _SEAM_MS }).catch(
      (error: unknown) => void (error === _STALE || _advance())
    );
  };

  const _advance = (): void =>
    ((step) =>
      step === undefined
        ? void (engine.showing?.leg && _loop(engine.showing.leg.to, _SEAM_MS))
        : 'jump' in step
          ? void ((engine.holdUntil = performance.now() + _JUMP_MS), _loop(step.jump, _JUMP_MS))
          : ((engine.hurry = engine.hurry && engine.queue.length > 0), _play(step.leg)))(
      engine.queue.shift()
    );

  const _origin = (): Spot | null => engine.showing?.leg?.to ?? engine.showing?.spot ?? null;

  const _steps = (from: Spot, next: Spot): Step[] =>
    ((route) =>
      route === null
        ? from === next
          ? []
          : [{ jump: next }]
        : route.map((name) => ({ leg: legOf(name) })))(
      reducedMotion ? null : routeOf(_available(), from, next)
    );

  const _go = (next: Spot) =>
    ((from) =>
      void (
        from !== null &&
        ((engine.target = next),
        (engine.queue = _steps(from, next)),
        engine.showing?.leg
          ? engine.queue.length > 0 &&
            ((engine.hurry = true),
            engine.live && engine.playing && (engine.playing.playbackRate = _HURRY))
          : _advance())
      ))(_origin());

  const _prefetch = () =>
    ((from) =>
      from &&
      _SPOTS
        .flatMap((to) => routeOf(_available(), from, to) ?? [])
        .reduce<Promise<unknown>>(
          (chain, name) => chain.then(() => _warm(name)),
          Promise.resolve()
        ))(here);

  const _home = () => goto(hrefFor({ locale: DEFAULT_LOCALE, slug: INDEX_SLUG }));

  const _toss = (clip: Clip, at: number) =>
    void (clip.thrown !== undefined &&
      !engine.tossed.thrown &&
      at >= clip.thrown &&
      ((engine.tossed.thrown = true), (document.documentElement.dataset.thrown = '')),
    clip.away !== undefined &&
      !engine.tossed.away &&
      at >= clip.away &&
      ((engine.tossed.away = true), _home()));

  const _tick = () =>
    void (engine.live &&
      engine.showing?.leg?.name === 'toss' &&
      engine.showing.clip &&
      engine.playing &&
      _toss(engine.showing.clip, engine.playing.currentTime),
    _maybeSettle());

  const _ended = (event: Event) =>
    void (event.target === engine.playing && engine.live && engine.showing?.leg && _advance());

  const _trigger = (navigation: BeforeNavigate): HTMLElement | null =>
    ((target) => (target instanceof Element ? target.closest<HTMLElement>('[data-shot]') : null))(
      (navigation as { event?: Event }).event?.target
    );

  const _predict = (navigation: BeforeNavigate): Spot | null =>
    ((value) => (SHOTS.includes(value as Shot) ? spotOf(value as Shot) : null))(
      (
        _trigger(navigation) ??
        document.querySelector<HTMLElement>(`a[data-shot][href="${navigation.to?.url.pathname}"]`)
      )?.dataset.shot
    );

  const _loaded = () =>
    void ((phase = 'loaded'),
    (document.documentElement.dataset.scene = 'video'),
    delay(_TAGLINE_MS).then(
      () => void ((engine.holdUntil = performance.now() + _REVEAL_MS), (phase = 'moving'))
    ));

  const _measure = () =>
    void (
      host &&
      probe &&
      ((box, frame) =>
        void ((viewport = { width: frame.width, height: frame.height }),
        (guard = [box.left, box.top, box.width, box.height]),
        display && (display = { ...display, pixelRatio: devicePixelRatio })))(
        probe.getBoundingClientRect(),
        host.getBoundingClientRect()
      )
    );

  const _crossfade = (showing: Showing, playing: HTMLVideoElement) =>
    _present(showing.leg?.name ?? showing.spot, {
      loop: !showing.leg,
      fade: _THEME_MS,
      rate: playing.playbackRate,
      at: () => playing.currentTime,
    }).catch(() => undefined);

  const _retheme = (theme: Theme) =>
    void (
      theme !== engine.theme &&
      ((engine.theme = theme),
      ((showing, playing) =>
        showing &&
        (engine.live && playing
          ? _crossfade(showing, playing)
          : showing.leg
            ? _play(showing.leg)
            : _loop(showing.spot, _THEME_MS)))(engine.showing, engine.playing))
    );

  const close = () => void (here === 'card' && _go('intro'));
  const open = () => void (here === 'intro' && phase === 'settled' && _go('card'));

  const onSent = () =>
    void (
      !reducedMotion &&
      phase === 'settled' &&
      _origin() === 'portrait' &&
      engine.queue.length === 0 &&
      'toss' in _available() &&
      ((engine.target = 'intro'),
      (engine.queue = [{ leg: legOf('toss') }]),
      (engine.tossed = { thrown: false, away: false }),
      engine.showing?.leg || _advance())
    );

  const onKey = (event: KeyboardEvent) => void (event.key === 'Escape' && close());

  beforeNavigate(
    (navigation) =>
      void (
        !navigation.willUnload &&
        ['moving', 'settled'].includes(phase) &&
        ((phase = 'leaving'),
        (engine.ready = false),
        (engine.swapping = true),
        (engine.leftAt = performance.now()),
        ((next) => next && _go(next))(_predict(navigation)))
      )
  );

  onNavigate(() =>
    engine.swapping
      ? delay(Math.max(0, _LEAVE_MS - (performance.now() - engine.leftAt))).then(() => undefined)
      : undefined
  );

  afterNavigate(
    ({ type }) =>
      void (
        type !== 'enter' &&
        ((engine.swapping = false),
        (engine.ready = true),
        delete document.documentElement.dataset.thrown,
        (engine.holdUntil = performance.now() + _STILL_MS),
        (phase = 'moving'),
        _go(spotOf(pageShot) ?? 'intro'))
      )
  );

  const _grain = () =>
    ((canvas) => {
      canvas.width = GRAIN_TILE;
      canvas.height = GRAIN_TILE;
      canvas
        .getContext('2d')
        ?.putImageData(new ImageData(grainPixels(GRAIN_TILE), GRAIN_TILE), 0, 0);
      return {
        url: canvas.toDataURL('image/png'),
        size: GRAIN_TILE / devicePixelRatio,
      };
    })(document.createElement('canvas'));

  const _mount = () => {
    const start = spotOf(pageShot) ?? 'intro';
    const frame = { id: 0 };
    const step = () => void (_tick(), (frame.id = requestAnimationFrame(step)));
    engine.target = start;
    grain = _grain();
    _measure();
    display = {
      variant: variantFor(fit.frame[2], devicePixelRatio),
      pixelRatio: devicePixelRatio,
    };
    engine.variant = display.variant;
    void _loop(start, 0);
    frame.id = requestAnimationFrame(step);
    window.addEventListener('resize', _measure);
    window.addEventListener('keydown', onKey);
    window.addEventListener(INQUIRY_SENT, onSent);
    return () => {
      cancelAnimationFrame(frame.id);
      window.removeEventListener('resize', _measure);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(INQUIRY_SENT, onSent);
      engine.seq += 1;
      void Promise.allSettled(sources.values()).then((results) =>
        results.forEach(
          (result) => void (result.status === 'fulfilled' && URL.revokeObjectURL(result.value))
        )
      );
    };
  };

  $effect(() => untrack(_mount));

  $effect(() => {
    const theme = shell.theme;
    untrack(() => _retheme(theme));
  });

  $effect(() => {
    const root = document.documentElement;
    FACED.forEach(
      (spot) =>
        void ((rect) =>
          rect
            ? root.style.setProperty(`--video-face-${spot}`, insetOf(rect, viewport))
            : root.style.removeProperty(`--video-face-${spot}`))(fit.sheets[spot])
    );
    return () => FACED.forEach((spot) => void root.style.removeProperty(`--video-face-${spot}`));
  });
</script>

<div class="viewer" data-mode="video" data-phase={phase} aria-hidden="true" bind:this={host}>
  <div class="guard" bind:this={probe}></div>
  <div
    class="frame"
    style:left="{fit.frame[0]}px"
    style:top="{fit.frame[1]}px"
    style:width="{fit.frame[2]}px"
    style:height="{fit.frame[3]}px"
    style:--fade="{fade}ms"
  >
    {#each [0, 1] as slot (slot)}
      <video
        bind:this={videos[slot]}
        data-top={front === slot ? '' : undefined}
        data-shown={shown[slot] ? '' : undefined}
        muted
        playsinline
        disablepictureinpicture
        preload="auto"
        onended={_ended}
      ></video>
    {/each}
    {#if here === 'intro' && phase === 'settled' && VIDEO.card.spot}
      <button
        type="button"
        class="spot"
        tabindex="-1"
        aria-label={t('a11y.flipCard')}
        style={percentOf(VIDEO.card.spot)}
        onclick={open}
      ></button>
    {/if}
    {#if here === 'card'}
      <button
        type="button"
        class="dismiss"
        tabindex="-1"
        aria-label={t('a11y.flipCard')}
        onclick={close}
      ></button>
      {#each links as { href, label, rect } (href)}
        <a
          class="link"
          {href}
          aria-label={label}
          tabindex="-1"
          target={/^https?:/.test(href) ? '_blank' : undefined}
          rel="noopener noreferrer"
          style={percentOf(rect)}
        ></a>
      {/each}
    {/if}
  </div>
  <div
    class="grain"
    style:background-image={grain.url ? `url(${grain.url})` : undefined}
    style:background-size="{grain.size}px"
  ></div>
</div>
