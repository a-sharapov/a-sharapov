<script lang="ts">
  import { SCENE_MEDIA } from '#lib/common/constants.ts';
  import { setScene, shell } from '#lib/common/shell.svelte.ts';
  import { localize } from '#lib/common/utils.ts';
  import Island from '#lib/components/@UX/Island/Island.svelte';
  import LogoLoader from '#lib/components/@UX/LogoLoader/LogoLoader.svelte';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import './SceneLoader.css';

  interface ISceneLoader {
    t: Dictionary;
  }

  let { t: dictionary }: ISceneLoader = $props();

  const t = $derived(localize(dictionary));

  const _SLOW_MS = 4000;

  let slow = $state(false);

  const loadChoice =
    import.meta.env.SSR || !shell.choosing
      ? undefined
      : () => import('#lib/components/@UX/SceneChoice/SceneChoice.svelte');

  const _booting = () =>
    document.querySelector('.viewer')?.getAttribute('data-phase') === 'boot' &&
    matchMedia(SCENE_MEDIA).matches;

  const _wait = (since: number) =>
    (
      (timer) => () =>
        clearTimeout(timer)
    )(
      setTimeout(() => void (slow = _booting()), Math.max(0, since + _SLOW_MS - performance.now()))
    );

  $effect(() => (shell.choosing ? undefined : _wait(loadChoice ? performance.now() : 0)));
</script>

<div class="scene-loader">
  <LogoLoader label={t('scene.loading')} />
  <div class="caption">
    <span class="runner" aria-hidden="true"><span></span></span>
    <p class="tagline" aria-hidden="true">{t('profile.tagline')}</p>
  </div>
  <Island load={loadChoice} props={{ t: dictionary }} />
  {#if slow && shell.scene === '3d'}
    <div class="lite">
      <p>{t('scene.lite.slow')}</p>
      <button type="button" onclick={() => setScene('video')}>{t('scene.lite.switch')}</button>
    </div>
  {/if}
</div>
