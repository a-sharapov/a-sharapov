<script>
  import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '@lib/l18n'
  import store from '@lib/shared/store'
  import { determineLocale } from '@lib/shared/utils'
  import './Locales.scss'

  export let slug = `${$store.locale}`

  $: store.update((store) => ({ ...store, locale: determineLocale(slug) || DEFAULT_LOCALE }))
</script>

<nav data-role="locales">
  {#each AVAILABLE_LOCALES as locale, i}
    {#if locale === $store.locale}
      <span class="localeItem">{locale}</span>
    {:else}
      <a class="localeItem" href={slug.replace(`${$store.locale}`, `${locale}`)}>
        {locale}
      </a>
    {/if}
    {#if i < locale.length - 1}
      <span class="localeSeparator">&middot;</span>
    {/if}
  {/each}
</nav>
