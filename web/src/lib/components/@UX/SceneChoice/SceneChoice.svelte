<script lang="ts">
  import { chooseScene, shell } from '#lib/common/shell.svelte.ts';
  import type { SceneMode } from '#lib/common/types.ts';
  import { localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import Live from './art/3d.svg?raw';
  import Video from './art/video.svg?raw';
  import './SceneChoice.css';

  interface ISceneChoice {
    t: Dictionary;
  }

  let { t: dictionary }: ISceneChoice = $props();

  const t = $derived(localize(dictionary));

  const _OPTIONS: {
    mode: SceneMode;
    key: string;
    art: string;
    recommended: boolean;
  }[] = [
    { mode: 'video', key: 'video', art: Video, recommended: true },
    { mode: '3d', key: 'live', art: Live, recommended: false },
  ];
</script>

<section
  class="scene-choice"
  data-open={shell.choosing || undefined}
  inert={!shell.choosing}
  aria-labelledby="scene-choice-title"
>
  <div class="frame">
    <h2 id="scene-choice-title">{t('scene.choice.title')}</h2>
    <p class="lead">{t('scene.choice.lead')}</p>
    <div class="options">
      {#each _OPTIONS as { mode, key, art, recommended } (mode)}
        <button
          type="button"
          class="option"
          data-recommended={recommended || undefined}
          aria-labelledby="scene-choice-{key}"
          aria-describedby="scene-choice-{key}-text"
          onclick={() => chooseScene(mode)}
        >
          {#if recommended}
            <span class="badge">{t('scene.choice.recommended')}</span>
          {/if}
          <span class="art" aria-hidden="true">{@html art}</span>
          <span class="name" id="scene-choice-{key}">{t(`scene.choice.${key}.title`)}</span>
          <span class="text" id="scene-choice-{key}-text">{t(`scene.choice.${key}.text`)}</span>
          <span class="go" aria-hidden="true">{t(`scene.choice.${key}.action`)}</span>
        </button>
      {/each}
    </div>
    <p class="note">{t('scene.choice.note')}</p>
  </div>
</section>
