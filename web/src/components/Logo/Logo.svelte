<script>
  import { LOCALES } from '@lib/l18n'
  import './Logo.scss'
  import Logo from '/logo.svg?raw'

  export let locale
</script>

<div class="logoWrapper">
  {@html Logo}
  <span class="tagline narrow">{LOCALES[locale].TAGLINE}</span>
</div>
