<script>
  import { currentState } from '@lib/components/Scene/state'
  import { DEFAULT_LOCALE, LOCALES } from '@lib/l18n'
  import nav from '@lib/shared/nav'
  import './Nav.scss'

  export let locale = DEFAULT_LOCALE
  export let role = 'navigation'
  export let currentUrl = '/'
</script>

<nav data-role={role}>
  {#each nav as menuItem, i}
    {@const { pageState, title, url } = menuItem}
    {#if url.endsWith(currentUrl)}
      <span class="navItem narrow">
        {LOCALES[locale][title]}
      </span>
    {:else}
      <a
        href={url}
        class="navItem narrow"
        data-item={title}
        on:pointerdown={() => void currentState.set(pageState)}
      >
        {LOCALES[locale][title]}
      </a>
    {/if}
    {#if i < nav.length - 1}
      <span class="navSeparator">&middot;</span>
    {/if}
  {/each}
  <slot />
</nav>
