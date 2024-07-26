<script>
  import { DEFAULT_LOCALE, LOCALES } from '@lib/l18n'
  import './ViewSwitcher.scss'

  export let locale = DEFAULT_LOCALE

  const switchHeaderView = () =>
    requestAnimationFrame(
      () => void document?.querySelector('main > header')?.classList?.toggle('expanded')
    )
</script>

<button
  class="viewSwitcher"
  title={LOCALES[locale].VIEW_SWITCHER_TITLE}
  on:click={switchHeaderView}
/>
