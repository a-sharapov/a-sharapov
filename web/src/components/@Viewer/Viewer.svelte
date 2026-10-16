<script lang="ts">
  import { navigate, type TransitionBeforePreparationEvent } from 'astro:transitions/client';
  import { Canvas } from '@threlte/core';
  import { MediaQuery } from 'svelte/reactivity';
  import { NoToneMapping, PCFShadowMap } from 'three';
  import { WebGPURenderer } from 'three/webgpu';
  import {
    DEFAULT_LOCALE,
    INDEX_SLUG,
    INQUIRY_SENT,
    NOT_FOUND_TEMPLATE,
    SHOTS,
  } from '$lib/common/constants';
  import { hrefFor } from '$lib/common/routes';
  import type { ContactRecord, Shot } from '$lib/common/types';
  import { delay, localize } from '$lib/common/utils';
  import type { Dictionary } from '$lib/i18n/context';
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
    contacts: ContactRecord[];
  }

  let { t: dictionary, shot: initialShot, contacts }: IViewer = $props();

  let shot = $state(initialShot);

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

  const _predict = ({ sourceElement, to }: TransitionBeforePreparationEvent): Shot | null =>
    ((value) => (SHOTS.includes(value as Shot) ? (value as Shot) : null))(
      (
        sourceElement?.closest<HTMLElement>('[data-shot]') ??
        document.querySelector<HTMLElement>(`a[data-shot][href="${to.pathname}"]`)
      )?.dataset.shot
    );

  const setPhase = (phase: Phase) => void (viewer.phase = phase);

  setPhase('boot');

  const _recover = () =>
    void (((window as { __asSceneFailed?: boolean }).__asSceneFailed = false),
    delete document.documentElement.dataset.scene);

  const onLoaded = () =>
    void (setPhase('loaded'), _recover(), delay(_TAGLINE_MS).then(() => (launched = true)));

  const _wrapLoader = (event: Event & { loader: () => Promise<void> }) => {
    const load = event.loader;
    event.loader = () => Promise.all([load(), delay(_LEAVE_MS)]).then(() => undefined);
  };

  const onBeforePreparation = (event: Event) =>
    ((navigation) =>
      void (
        ['moving', 'settled'].includes(viewer.phase) &&
        (setPhase('leaving'),
        (feedback.live = false),
        (swapping = true),
        (pending = _predict(navigation)),
        _wrapLoader(navigation))
      ))(event as TransitionBeforePreparationEvent);

  const _pageShot = (): Shot =>
    ((value) => (SHOTS.includes(value as Shot) ? (value as Shot) : shot))(
      document.documentElement.dataset.shot
    );

  const _screen = (current: Shot) =>
    ((notFound) =>
      void (current === 'tablet' && (feedback.recursive = notFound), (feedback.live = notFound)))(
      document.documentElement.dataset.template === NOT_FOUND_TEMPLATE
    );

  const onAfterSwap = () =>
    void ((swapping = false), (pending = null), (shot = _pageShot()), _screen(shot), (epoch += 1));

  const onSent = () =>
    void (
      !reducedMotion &&
      viewer.phase === 'settled' &&
      delay(THROW.delay * 1000)
        .then(() => ((rig.thrown = 0), (document.documentElement.dataset.thrown = '')))
        .then(() => delay(THROW.seconds * THROW.away * 1000))
        .then(() => navigate(hrefFor({ locale: DEFAULT_LOCALE, slug: INDEX_SLUG })))
    );

  $effect(() => void _screen(initialShot));

  $effect(() => void document.documentElement.toggleAttribute('data-glitch', viewer.glitch));

  $effect(() => {
    window.addEventListener(INQUIRY_SENT, onSent);
    return () => window.removeEventListener(INQUIRY_SENT, onSent);
  });

  $effect(() => {
    document.addEventListener('astro:before-preparation', onBeforePreparation);
    document.addEventListener('astro:after-swap', onAfterSwap);
    return () => {
      document.removeEventListener('astro:before-preparation', onBeforePreparation);
      document.removeEventListener('astro:after-swap', onAfterSwap);
    };
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
