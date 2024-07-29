<script>
  import { LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import './ThemeSwitcher.scss'

  const LIGHT = Symbol.for('light')
  const DARK = Symbol.for('dark')
  const STORE_KEY = 'THEME'

  let currentTheme = writable(LIGHT)
  let isDark = writable(currentTheme === DARK)

  const toggleCurrentTheme = () =>
    void currentTheme.update((theme) => (theme === LIGHT ? DARK : LIGHT))

  onMount(() => {
    const storedTheme = localStorage.getItem(STORE_KEY)

    currentTheme.subscribe((theme) => {
      const themeDescriptor = Symbol.keyFor(theme)
      localStorage.setItem(STORE_KEY, themeDescriptor)
      isDark.set(theme === DARK)
      store.update((store) => ({ ...store, theme }))
      document.documentElement.dataset.theme = themeDescriptor
      document.dispatchEvent(new CustomEvent('themeChanged', { detail: themeDescriptor }))
    })

    if (storedTheme && $currentTheme !== Symbol.for(storedTheme)) {
      currentTheme.set(Symbol.for(storedTheme))
    }
  })
</script>

<div class="themeSwitcher" data-current={Symbol.keyFor($currentTheme)}>
  <input
    type="checkbox"
    id="themeSwitcher"
    on:change={toggleCurrentTheme}
    bind:checked={$isDark}
    class="ambivalent"
    title={LOCALES[$store.locale].THEME_SWITCHER_LABEL}
    aria-label={LOCALES[$store.locale].THEME_SWITCHER_LABEL}
  />
</div>
