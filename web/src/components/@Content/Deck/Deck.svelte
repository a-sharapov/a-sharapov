<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type Dictionary, provideTranslation, useTranslation } from '$lib/i18n/context';
  import Prev from '/i/arrow-left.svg?raw';
  import Next from '/i/arrow-right.svg?raw';
  import './Deck.css';

  interface IDeck {
    t: Dictionary;
    children?: Snippet;
  }

  let { t: dictionary, children }: IDeck = $props();

  provideTranslation(() => dictionary);
  const getT = useTranslation();
  const t = $derived(getT());

  let track = $state<HTMLElement>();
  let count = $state(0);
  let current = $state(0);

  const _slides = (node: HTMLElement) => [...node.querySelectorAll<HTMLElement>('.slide')];

  const _pad = (n: number) => String(n).padStart(2, '0');

  const sync = () =>
    void (track && (current = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));

  const go = (index: number) =>
    void track?.scrollTo({
      left: Math.max(0, Math.min(count - 1, index)) * track.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });

  const _KEYS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    PageUp: -1,
    PageDown: 1,
  };

  const onKey = (event: KeyboardEvent) =>
    void (
      _KEYS[event.key] &&
      !(event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) &&
      !(event.target as HTMLElement | null)?.closest?.(
        'input, textarea, select, [contenteditable]'
      ) &&
      (event.preventDefault(), go(current + _KEYS[event.key]!))
    );

  $effect(
    () =>
      void (
        track &&
        ((slides) => (
          (count = slides.length),
          slides.forEach(
            (slide, i) =>
              void (slide.setAttribute('role', 'group'),
              slide.setAttribute('aria-roledescription', t('portfolio.slide')),
              slide.setAttribute('aria-label', `${i + 1} ${t('portfolio.of')} ${slides.length}`),
              ((shot, title) =>
                void (shot && !shot.dataset.url && title && (shot.dataset.url = title)))(
                slide.querySelector<HTMLElement>('.shot'),
                slide.querySelector('h1, h2')?.textContent?.trim()
              ))
          )
        ))(_slides(track))
      )
  );

  const status = $derived(
    track && count
      ? `${t('portfolio.slide')} ${current + 1} ${t('portfolio.of')} ${count}: ${
          _slides(track)[current]?.querySelector('h1, h2')?.textContent?.trim() ?? ''
        }`
      : ''
  );

  let ready = $state(false);
  $effect(() =>
    track
      ? ((node, observer) => (
          _slides(node).forEach((slide) => void observer.observe(slide)),
          (ready = true),
          () => observer.disconnect()
        ))(
          track,
          new IntersectionObserver(
            (entries) =>
              entries.forEach(
                (entry) =>
                  void (entry.target as HTMLElement).toggleAttribute(
                    'data-active',
                    entry.isIntersecting
                  )
              ),
            { root: track, threshold: 0.55 }
          )
        )
      : undefined
  );
</script>

<svelte:window onkeydown={onKey} />

<div
  class="deck"
  data-ready={ready || undefined}
  role="region"
  aria-roledescription={t('portfolio.deck')}
  aria-label={t('portfolio.label')}
>
  <div class="track" bind:this={track} onscroll={sync}>{@render children?.()}</div>
  <p class="sr-only" aria-live="polite">{status}</p>
  <div class="controls">
    <span class="counter" aria-hidden="true">{_pad(current + 1)} / {_pad(count)}</span>
    <div class="dots">
      {#each { length: count } as _, i (i)}
        <button
          type="button"
          class="dot"
          aria-label="{t('portfolio.slide')} {i + 1}"
          aria-current={i === current || undefined}
          onclick={() => go(i)}
        ></button>
      {/each}
    </div>
    <div class="arrows">
      <button
        type="button"
        class="arrow"
        aria-label={t('portfolio.prev')}
        aria-disabled={current === 0}
        onclick={() => go(current - 1)}
      >
        <span aria-hidden="true">{@html Prev}</span>
      </button>
      <button
        type="button"
        class="arrow"
        aria-label={t('portfolio.next')}
        aria-disabled={current >= count - 1}
        onclick={() => go(current + 1)}
      >
        <span aria-hidden="true">{@html Next}</span>
      </button>
    </div>
  </div>
</div>
