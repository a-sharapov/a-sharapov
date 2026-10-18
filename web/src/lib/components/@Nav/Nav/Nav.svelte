<script lang="ts">
  import { untrack } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { NavItem } from '#lib/common/types.ts';
  import Close from '#lib/i/close.svg?raw';
  import Menu from '#lib/i/menu.svg?raw';
  import { useTranslation } from '#lib/i18n/context.ts';
  import './Nav.css';

  interface INav {
    nav: NavItem[];
    slug: string;
  }

  type Bar = { x: number; width: number };

  type Mode = 'slide' | 'follow';

  let { nav, slug }: INav = $props();

  const getT = useTranslation();
  const t = $derived(getT());
  let open = $state(false);
  let root = $state<HTMLElement>();
  let list = $state<HTMLUListElement>();
  let picked = $state<string>();

  const active = $derived(picked ?? slug);

  const _SLIDE = { duration: 600, easing: quintOut };
  const _INSTANT = { duration: 0 };
  const x = new Tween(0, _SLIDE);
  const width = new Tween(0, _SLIDE);

  const _measure = (node: HTMLUListElement, current: string): Bar | undefined =>
    ((link) => (link ? { x: link.offsetLeft, width: link.offsetWidth } : undefined))(
      node.querySelector<HTMLElement>(`a[data-slug="${CSS.escape(current)}"]`)
    );

  const _how = (bar: Bar | undefined, mode: Mode) =>
    !bar || !width.current || matchMedia('(prefers-reduced-motion: reduce)').matches
      ? _INSTANT
      : mode === 'slide'
        ? _SLIDE
        : x.current === x.target && width.current === width.target
          ? _INSTANT
          : x.target === bar.x && width.target === bar.width
            ? null
            : _SLIDE;

  const _place = (bar: Bar | undefined, mode: Mode) =>
    untrack(
      () =>
        void ((options, target) =>
          options && (x.set(target.x, options), width.set(target.width, options)))(
          _how(bar, mode),
          bar ?? { x: x.current, width: 0 }
        )
    );

  $effect(() => void (slug && ((picked = undefined), (open = false))));

  $effect(() => void (list && _place(_measure(list, active), 'slide')));

  $effect(() =>
    list
      ? ((node, observer) => (observer.observe(node), () => observer.disconnect()))(
          list,
          new ResizeObserver(() => void (list && _place(_measure(list, active), 'follow')))
        )
      : undefined
  );

  const toggle = () => void (open = !open);

  const onKey = (event: KeyboardEvent) => void (open && event.key === 'Escape' && (open = false));
  const onPointer = (event: PointerEvent) =>
    void (open && !root?.contains(event.target as Node) && (open = false));

  const pick = (event: MouseEvent, target: string) =>
    void ((open = false),
    !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) &&
      (picked = target));
</script>

<svelte:window onkeydown={onKey} onpointerdown={onPointer} />

<nav class="nav" bind:this={root} data-open={open || undefined} aria-label={t('a11y.navigation')}>
  <button
    type="button"
    class="menu"
    aria-expanded={open}
    aria-controls="nav-list"
    aria-label={t(open ? 'a11y.closeMenu' : 'a11y.openMenu')}
    onclick={toggle}
  >
    <span aria-hidden="true">{@html open ? Close : Menu}</span>
  </button>
  <ul id="nav-list" bind:this={list}>
    {#each nav as item (item.slug)}
      <li>
        <a
          href={item.href}
          aria-current={item.slug === slug ? 'page' : undefined}
          data-slug={item.slug}
          data-picked={item.slug === active || undefined}
          data-shot={item.shot}
          onclick={(event) => pick(event, item.slug)}
          >{item.title}</a
        >
      </li>
    {/each}
  </ul>
  <span
    class="glow"
    aria-hidden="true"
    style:translate="{x.current}px 0"
    style:width="{width.current}px"
    style:opacity={width.current ? 1 : 0}
  ></span>
</nav>
