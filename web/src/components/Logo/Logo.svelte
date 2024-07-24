<script>
  import { TAGLINE } from '@lib/shared/constants'
  import './Logo.scss'
  import Logo from '/logo.svg?raw'
</script>

<span class="logoWrapper">
  {@html Logo}
  <span class="tagline narrow">{TAGLINE}</span>
</span>
