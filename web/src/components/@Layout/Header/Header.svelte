<script lang="ts">
  import type { NavItem } from '$lib/common/types';
  import Nav from '$lib/components/@Nav/Nav/Nav.svelte';
  import SoundSwitcher from '$lib/components/@UX/SoundSwitcher/SoundSwitcher.svelte';
  import ThemeSwitcher from '$lib/components/@UX/ThemeSwitcher/ThemeSwitcher.svelte';
  import { type Dictionary, provideTranslation } from '$lib/i18n/context';
  import './Header.css';

  interface IHeader {
    t: Dictionary;
    nav: NavItem[];
    slug: string;
  }

  let { t, nav, slug }: IHeader = $props();

  provideTranslation(() => t);
</script>

<header class="chrome">
  <Nav {nav} {slug} />
  <div class="controls">
    <ThemeSwitcher />
    <SoundSwitcher />
  </div>
</header>
