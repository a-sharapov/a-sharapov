<script lang="ts" generics="Props extends Record<string, unknown>">
  import { type Component, hydrate, type Snippet, unmount, untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';

  type When = 'load' | 'visible' | 'media';

  interface IIsland {
    load?: () => Promise<{ default: Component<Props> }>;
    props: Props;
    when?: When;
    query?: string;
    html?: string;
    fallback?: Snippet;
  }

  let { load, props, when = 'load', query = '', html, fallback }: IIsland = $props();

  let host = $state<HTMLElement>();
  let due = $state(false);
  let Loaded = $state<Component<Props>>();

  const matches = $derived(when === 'media' ? new MediaQuery(query, false) : null);

  const _arrive = () => void (due = true);

  const _watch = (node: Element) =>
    ((observer) => (observer.observe(node), () => observer.disconnect()))(
      new IntersectionObserver(
        (entries) => void (entries.some(({ isIntersecting }) => isIntersecting) && _arrive()),
        { rootMargin: '200px' }
      )
    );

  $effect(() =>
    due
      ? undefined
      : when === 'visible'
        ? host && _watch(host.firstElementChild ?? host)
        : when === 'media'
          ? void (matches?.current && _arrive())
          : _arrive()
  );

  $effect(
    () => void (due && untrack(() => load)?.().then((module) => void (Loaded = module.default)))
  );

  const _release = (instance: Record<string, unknown>) => () => void unmount(instance);

  $effect(() =>
    Loaded && host
      ? _release(hydrate(Loaded, { target: host, props: untrack(() => props) }))
      : undefined
  );
</script>

{#if html === undefined}
  {#if Loaded}
    <Loaded {...props} />
  {:else}
    {@render fallback?.()}
  {/if}
{:else}
  {#key html}
    <div data-island={when} bind:this={host}>{@html html}</div>
  {/key}
{/if}
