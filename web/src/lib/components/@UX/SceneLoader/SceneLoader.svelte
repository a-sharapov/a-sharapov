<script lang="ts">
  import { localize } from '#lib/common/utils.ts';
  import LogoLoader from '#lib/components/@UX/LogoLoader/LogoLoader.svelte';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import './SceneLoader.css';

  interface ISceneLoader {
    t: Dictionary;
  }

  let { t: dictionary }: ISceneLoader = $props();

  const t = $derived(localize(dictionary));
</script>

<div class="scene-loader">
  <LogoLoader label={t('scene.loading')} />
  <div class="caption">
    <span class="runner" aria-hidden="true"><span></span></span>
    <p class="tagline" aria-hidden="true">{t('profile.tagline')}</p>
  </div>
</div>
