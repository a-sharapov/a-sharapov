<script lang="ts">
  import { onMount } from 'svelte';
  import { GlyphPreview } from '$lib/common/glyph-preview.svelte';
  import { restoreSound, setSound, shell } from '$lib/common/shell.svelte';
  import sound from '$lib/components/@UX/Sound/engine';
  import { useTranslation } from '$lib/i18n/context';
  import Speaker from '/i/sound.svg?raw';
  import './SoundSwitcher.css';

  const getT = useTranslation();
  const t = $derived(getT());
  const preview = new GlyphPreview();

  onMount(() => void (restoreSound() && sound.arm()));

  $effect(() => sound.mood(shell.theme === 'dark' ? 'night' : 'day'));

  const toggle = () => (
    preview.hold(), setSound(!shell.sound), shell.sound ? sound.enable() : sound.disable()
  );
</script>

<button
  type="button"
  class="glyph-toggle sound"
  aria-pressed={shell.sound}
  aria-label={t('a11y.sound')}
  title={t('a11y.sound')}
  data-look={preview.look(shell.sound)}
  onpointerenter={preview.enter}
  onpointerleave={preview.leave}
  onclick={toggle}
>
  {@html Speaker}
</button>
