<script lang="ts">
  import { INDEX_SLUG } from '#lib/common/constants.ts';
  import { hrefFor, shotFor } from '#lib/common/routes.ts';
  import type { Locale } from '#lib/common/types.ts';
  import { localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import './NotFound.css';

  interface INotFound {
    t: Dictionary;
    locale: Locale;
  }

  let { t: dictionary, locale }: INotFound = $props();

  const t = $derived(localize(dictionary));
</script>

<div class="not-found">
  <p class="code" aria-hidden="true">404</p>
  <h1>{t('error.notFound.title')}</h1>
  <p class="text">{t('error.notFound.text')}</p>
  <a class="home" href={hrefFor({ locale, slug: INDEX_SLUG })} data-shot={shotFor('card')}>
    {t('error.notFound.home')}
  </a>
</div>
