<script lang="ts">
  import { GlyphPreview } from '#lib/common/glyph-preview.svelte.ts';
  import { setScene, shell } from '#lib/common/shell.svelte.ts';
  import Cube from '#lib/i/cube.svg?raw';
  import { useTranslation } from '#lib/i18n/context.ts';
  import './SceneSwitcher.css';

  const getT = useTranslation();
  const t = $derived(getT());
  const preview = new GlyphPreview();

  const toggle = () => (preview.hold(), setScene(shell.scene === '3d' ? 'video' : '3d'));
</script>

<button
  type="button"
  class="glyph-toggle scene-switch"
  aria-pressed={shell.scene === '3d'}
  aria-label={t('a11y.scene')}
  title={t('a11y.scene')}
  data-look={preview.look(shell.scene === '3d')}
  onpointerenter={preview.enter}
  onpointerleave={preview.leave}
  onclick={toggle}
>
  {@html Cube}
</button>
