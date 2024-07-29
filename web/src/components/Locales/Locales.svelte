<script>
  import { AVAILABLE_LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import './Locales.scss'

  let { locale: current } = $store
  export let slug = `${current}`
</script>

<nav data-role="locales">
  {#each AVAILABLE_LOCALES as locale, i}
    {#if locale === current}
      <span class="localeItem">{locale}</span>
    {:else}
      <a class="localeItem" href={slug.replace(`${current}`, `${locale}`)}>
        {locale}
      </a>
    {/if}
    {#if i < locale.length - 1}
      <span class="localeSeparator">&middot;</span>
    {/if}
  {/each}
</nav>
