<script>
  import { currentState } from '@lib/components/Scene/state'
  import { AVAILABLE_LOCALES, LOCALES } from '@lib/l18n'
  import { INDEX } from '@lib/shared/constants'
  import nav from '@lib/shared/nav'
  import store from '@lib/shared/store'
  import './Nav.scss'

  export let role = 'navigation'
  export let currentUrl

  const checkIsCurrentActive = (INDEX, AVAILABLE_LOCALES, currentUrl) => (url) =>
    (url === INDEX && (AVAILABLE_LOCALES.includes(currentUrl) || !currentUrl)) ||
    (currentUrl && currentUrl.endsWith(url))
</script>

<nav data-role={role}>
  {#each nav as menuItem, i}
    {@const { pageState, title, url } = menuItem}
    {#if checkIsCurrentActive(INDEX, AVAILABLE_LOCALES, currentUrl)(url)}
      <span class="navItem narrow">
        {LOCALES[$store.locale][title]}
      </span>
    {:else}
      <a
        href={[$store.locale, url === INDEX ? null : url].filter(Boolean).join('/')}
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
