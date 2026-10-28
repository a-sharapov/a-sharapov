<script lang="ts">
  import type { NavItem } from '#lib/common/types.ts';
  import { localize } from '#lib/common/utils.ts';
  import Nav from '#lib/components/@Nav/Nav/Nav.svelte';
  import SceneSwitcher from '#lib/components/@UX/SceneSwitcher/SceneSwitcher.svelte';
  import SoundSwitcher from '#lib/components/@UX/SoundSwitcher/SoundSwitcher.svelte';
  import ThemeSwitcher from '#lib/components/@UX/ThemeSwitcher/ThemeSwitcher.svelte';
  import { type Dictionary, provideTranslation } from '#lib/i18n/context.ts';
  import './Header.css';

  interface IHeader {
    t: Dictionary;
    nav: NavItem[];
    slug: string;
  }

  let { t, nav, slug }: IHeader = $props();

  provideTranslation(() => t);

  const skipLabel = $derived(localize(t)('a11y.skip'));
</script>

<header class="chrome">
  <a class="skip" href="#content">{skipLabel}</a>
  <Nav {nav} {slug} />
  <div class="controls">
    <ThemeSwitcher />
    <SoundSwitcher />
    <SceneSwitcher />
  </div>
</header>
