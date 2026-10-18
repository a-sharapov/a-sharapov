<script lang="ts">
  import { untrack } from 'svelte';
  import { GlyphPreview } from '#lib/common/glyph-preview.svelte.ts';
  import { followDaylight, setTheme, shell } from '#lib/common/shell.svelte.ts';
  import type { Theme } from '#lib/common/types.ts';
  import Bulb from '#lib/i/bulb.svg?raw';
  import { useTranslation } from '#lib/i18n/context.ts';
  import './ThemeSwitcher.css';

  const getT = useTranslation();
  const t = $derived(getT());
  const preview = new GlyphPreview();

  const _NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'light' };

  const toggle = () => (preview.hold(), setTheme(_NEXT[shell.theme] ?? 'light'));

  $effect(() => untrack(followDaylight));
</script>

<button
  type="button"
  role="switch"
  class="glyph-toggle bulb-switch"
  aria-checked={shell.theme === 'dark'}
  aria-label={t('a11y.theme')}
  title={t('a11y.theme')}
  data-look={preview.look(shell.theme === 'dark')}
  data-hovered={preview.hovered || undefined}
  onpointerenter={preview.enter}
  onpointerleave={preview.leave}
  onclick={toggle}
>
  {@html Bulb}
</button>
