<script>
  import { LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import './ViewSwitcher.scss'

  const switchHeaderView = () =>
    requestAnimationFrame(
      () => void document?.querySelector('main > header')?.classList?.toggle('expanded')
    )
</script>

<button
  class="viewSwitcher"
  title={LOCALES[$store.locale].VIEW_SWITCHER_TITLE}
  on:click={switchHeaderView}
/>
