<script>
  import { currentState } from '@lib/components/Scene/state'
  import { LOCALES } from '@lib/l18n'
  import nav from '@lib/shared/nav'
  import store from '@lib/shared/store'
  import './Nav.scss'

  export let role = 'navigation'
  export let currentUrl
</script>

<nav data-role={role}>
  {#each nav as menuItem, i}
    {@const { pageState, title, url } = menuItem}
    {#if (url === 'index' && !currentUrl) || (currentUrl && currentUrl.endsWith(url))}
      <span class="navItem narrow">
        {LOCALES[$store.locale][title]}
      </span>
    {:else}
      <a
        href={[$store.locale, url].join('/')}
        class="navItem narrow"
        data-item={title}
        data-scene={pageState.description}
        on:pointerdown={() => void currentState.set(pageState)}
      >
        {LOCALES[$store.locale][title]}
      </a>
    {/if}
    {#if i < nav.length - 1}
      <span class="navSeparator">&middot;</span>
    {/if}
  {/each}
  <slot />
</nav>
