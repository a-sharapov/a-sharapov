<script>
  import { LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import './ViewSwitcher.scss'

  const changeView = () =>
    store.update(({ sceneIs3D, ...store }) => ({ ...store, sceneIs3D: !sceneIs3D }))
</script>

<div class="viewSwitcher">
  <input
    type="checkbox"
    id="themeSwitcher"
    on:change={changeView}
    bind:checked={$store.sceneIs3D}
    class="ambivalent"
    title={LOCALES[$store.locale].VIEW_SWITCHER_LABEL}
    aria-label={LOCALES[$store.locale].VIEW_SWITCHER_LABEL}
  />
</div>
