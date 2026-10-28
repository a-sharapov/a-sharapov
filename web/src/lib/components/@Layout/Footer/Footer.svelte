<script lang="ts">
  import { PRIVACY_SLUG } from '#lib/common/constants.ts';
  import { hrefFor, shotFor } from '#lib/common/routes.ts';
  import type { Locale } from '#lib/common/types.ts';
  import { localize } from '#lib/common/utils.ts';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import './Footer.css';

  interface IFooter {
    t: Dictionary;
    locale: Locale;
  }

  let { t: dictionary, locale }: IFooter = $props();

  const t = $derived(localize(dictionary));
  const year = new Date().getFullYear();
  const privacyHref = $derived(hrefFor({ locale, slug: PRIVACY_SLUG }));
</script>

<footer class="colophon">
  <p class="copyleft">
    <span class="years">2011 – {year}</span>
    <span class="glyph" aria-hidden="true">©</span>
    {t('footer.copyleft')}&nbsp;<span class="divider" aria-hidden="true">·</span>
    <a href={privacyHref} data-shot={shotFor('resume')}>{t('footer.privacy')}</a>
  </p>
</footer>
