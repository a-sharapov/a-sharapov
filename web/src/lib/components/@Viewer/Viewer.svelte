<script lang="ts">
  import { Canvas } from '@threlte/core';
  import { untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { NoToneMapping, PCFShadowMap } from 'three';
  import { WebGPURenderer } from 'three/webgpu';
  import { DEFAULT_LOCALE, INDEX_SLUG, INQUIRY_SENT, SHOTS } from '#lib/common/constants.ts';
  import { hrefFor } from '#lib/common/routes.ts';
  import type { ContactRecord, Shot } from '#lib/common/types.ts';
  import { delay, localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import {
    afterNavigate,
    type BeforeNavigate,
    beforeNavigate,
    goto,
    onNavigate,
  } from '$app/navigation';
  import { feedback } from './Scene/feedback';
  import { throttleIdle } from './Scene/idle-fps';
  import { detectTier, QUALITY } from './Scene/quality';
  import Scene from './Scene/Scene.svelte';
  import { THROW } from './Scene/staging';
  import { type Phase, rig, viewer } from './Scene/state.svelte';
  import './Viewer.css';

  interface IViewer {
    t: Dictionary;
    shot: Shot;
    notFound: boolean;
    contacts: ContactRecord[];
  }

  let { t: dictionary, shot: pageShot, notFound, contacts }: IViewer = $props();

  let shot = $state(untrack(() => pageShot));

  const t = $derived(localize(dictionary));
  const face = $derived({ tagline: t('profile.tagline') });
  const back = $derived({
    name: t('profile.name'),
    role: t('profile.role'),
    contacts,
  });

  const quality = QUALITY[detectTier()];
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)').current;
  const _LEAVE_MS = 260;
  const _TAGLINE_MS = 400;

  let epoch = $state(0);
  let pending = $state<Shot | null>(null);
  let swapping = $state(false);
  let launched = $state(false);
  let leftAt = 0;

  const _source = (navigation: BeforeNavigate): HTMLElement | null =>
    ((target) => (target instanceof Element ? target.closest<HTMLElement>('[data-shot]') : null))(
      (navigation as { event?: Event }).event?.target
    );

  const _predict = (navigation: BeforeNavigate): Shot | null =>
    ((value) => (SHOTS.includes(value as Shot) ? (value as Shot) : null))(
      (
        _source(navigation) ??
        document.querySelector<HTMLElement>(`a[data-shot][href="${navigation.to?.url.pathname}"]`)
      )?.dataset.shot
    );

  const setPhase = (phase: Phase) => void (viewer.phase = phase);

  setPhase('boot');

  const _recover = () => void delete document.documentElement.dataset.scene;

  const onLoaded = () =>
    void (setPhase('loaded'), _recover(), delay(_TAGLINE_MS).then(() => (launched = true)));

  const _screen = (current: Shot, missing: boolean) =>
    void (current === 'tablet' && (feedback.recursive = missing), (feedback.live = missing));

  const onSent = () =>
    void (
      !reducedMotion &&
      viewer.phase === 'settled' &&
      delay(THROW.delay * 1000)
        .then(() => ((rig.thrown = 0), (document.documentElement.dataset.thrown = '')))
        .then(() => delay(THROW.seconds * THROW.away * 1000))
        .then(() => goto(hrefFor({ locale: DEFAULT_LOCALE, slug: INDEX_SLUG })))
    );

  beforeNavigate(
    (navigation) =>
      void (
        !navigation.willUnload &&
        ['moving', 'settled'].includes(viewer.phase) &&
        (setPhase('leaving'),
        (feedback.live = false),
        (swapping = true),
        (pending = _predict(navigation)),
        (leftAt = performance.now()))
      )
  );

  onNavigate(() =>
    swapping
      ? delay(Math.max(0, _LEAVE_MS - (performance.now() - leftAt))).then(() => undefined)
      : undefined
  );

  afterNavigate(
    ({ type }) =>
      void (
        type !== 'enter' &&
        ((swapping = false),
        (pending = null),
        (shot = pageShot),
        _screen(shot, notFound),
        delete document.documentElement.dataset.thrown,
        (epoch += 1))
      )
  );

  $effect(
    () =>
      void _screen(
        untrack(() => shot),
        untrack(() => notFound)
      )
  );

  $effect(() => void document.documentElement.toggleAttribute('data-glitch', viewer.glitch));

  $effect(() => {
    window.addEventListener(INQUIRY_SENT, onSent);
    return () => window.removeEventListener(INQUIRY_SENT, onSent);
  });
</script>

<div class="viewer" data-phase={viewer.phase} aria-hidden="true">
  <Canvas
    dpr={quality.dpr}
    renderMode="always"
    toneMapping={NoToneMapping}
    shadows={PCFShadowMap}
    createRenderer={(canvas) => throttleIdle(new WebGPURenderer({ canvas, antialias: false, depth: false }), () => rig.still)}
  >
    <Scene
      shot={pending ?? shot}
      ready={!swapping}
      {epoch}
      {face}
      {back}
      {quality}
      {reducedMotion}
      {launched}
      onloaded={onLoaded}
      onmoving={() => setPhase('moving')}
      onsettled={() => setPhase('settled')}
    />
  </Canvas>
</div>
