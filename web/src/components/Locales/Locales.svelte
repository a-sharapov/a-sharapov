<script>
  import { AVAILABLE_LOCALES } from '@lib/l18n'
  import './Locales.scss'

  export let current
  let url = `/${current}/`
</script>

<div class="locales">
  {#each AVAILABLE_LOCALES as locale}
    {#if locale === current}
      <span class="localeItem" class:active={current === locale}>{locale}</span>
    {:else}
      <a class="localeItem" href={url.replace(`/${current}/`, `/${locale}/`)}>
        {locale}
      </a>
    {/if}
  {/each}
</div>
