<script>
  import { AVAILABLE_LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import './Locales.scss'

  let current = $store.locale
  let url = `/${current}/`
</script>

<nav data-role="locales">
  {#each AVAILABLE_LOCALES as locale, i}
    {#if locale === current}
      <span class="localeItem">{locale}</span>
    {:else}
      <a class="localeItem" href={url.replace(`/${current}/`, `/${locale}/`)}>
        {locale}
      </a>
    {/if}
    {#if i < locale.length - 1}
      <span class="localeSeparator">&middot;</span>
    {/if}
  {/each}
</nav>
