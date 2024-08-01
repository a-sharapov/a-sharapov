<script>
  import { DEFAULT_LOCALE, LOCALES } from '@lib/l18n'
  import './Logo.scss'
  import Logo from '/logo.svg?raw'
  import LogoEn from '/logo_en.svg?raw'

  export let vcardIsActive = false
  export let locale
  export let className = ''
</script>

<div class={['logoWrapper', className].filter(Boolean).join(' ')}>
  {#if locale !== DEFAULT_LOCALE}
    {@html LogoEn}
  {:else}
    {@html Logo}
  {/if}
  <span class="tagline narrow" class:active={vcardIsActive}>
    {vcardIsActive ? LOCALES[locale].TAGLINE_HOVER : LOCALES[locale].TAGLINE}
  </span>
</div>
