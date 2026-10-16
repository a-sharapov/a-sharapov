<script lang="ts">
  import {
    INQUIRY_API_URL,
    INQUIRY_LIMITS,
    INQUIRY_SENT,
    PRIVACY_SLUG,
  } from '$lib/common/constants';
  import { hrefFor, shotFor } from '$lib/common/routes';
  import type { Locale } from '$lib/common/types';
  import Loader from '$lib/components/@UX/Loader/Loader.svelte';
  import { type Dictionary, listOf, provideTranslation, useTranslation } from '$lib/i18n/context';
  import MarkError from '/i/mark-error.svg?raw';
  import MarkSuccess from '/i/mark-success.svg?raw';
  import Send from '/i/send.svg?raw';
  import { sendInquiry } from './inquiry-api';
  import './InquiryForm.css';

  type Phase = 'idle' | 'sending' | 'success' | 'error';

  interface IInquiryForm {
    t: Dictionary;
    locale: Locale;
    page: string;
    sent?: boolean;
  }

  let { t: dictionary, locale, page, sent = false }: IInquiryForm = $props();

  provideTranslation(() => dictionary);
  const getT = useTranslation();
  const t = $derived(getT());
  const topics = $derived(listOf(dictionary, 'form.topic.variants'));
  const privacyHref = $derived(hrefFor({ locale, slug: PRIVACY_SLUG }));

  const _initial = (): Phase => (sent ? 'success' : 'idle');

  let phase = $state<Phase>(_initial());

  const _results = $derived({
    _: null,
    success: {
      mark: MarkSuccess,
      title: t('form.successTitle'),
      text: t('form.success'),
    },
    error: {
      mark: MarkError,
      title: t('form.errorTitle'),
      text: t('form.error'),
    },
  });

  const result = $derived(_results[phase as keyof typeof _results] ?? _results._);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    phase = 'sending';
    sendInquiry(new FormData(form)).then(
      () => (
        (phase = 'success'), form.reset(), window.dispatchEvent(new CustomEvent(INQUIRY_SENT))
      ),
      () => (phase = 'error')
    );
  };

  const retry = () => void (phase = 'idle');
</script>

<form
  class="inquiry"
  method="post"
  action={INQUIRY_API_URL}
  data-phase={phase}
  onsubmit={handleSubmit}
>
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="page" value={page} />
  <label class="trap" aria-hidden="true">
    Website <input type="text" name="website" tabindex="-1" autocomplete="off" />
  </label>

  <div class="fields">
    <fieldset class="topics">
      <legend class="label">{t('form.topic.label')}</legend>
      <div class="options">
        {#each topics as topic (topic)}
          <label class="option">
            <input type="radio" name="topic" value={topic} required />
            <span>{topic}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <label>
      <span class="label">{t('form.contact.label')}</span>
      <input
        type="text"
        name="contact"
        required
        maxlength={INQUIRY_LIMITS.contact}
        autocomplete="email"
        placeholder={t('form.contact.hint')}
      />
    </label>

    <label>
      <span class="label">{t('form.message.label')}</span>
      <textarea
        name="message"
        rows="4"
        required
        maxlength={INQUIRY_LIMITS.message}
        placeholder={t('form.message.hint')}
      ></textarea>
    </label>

    <label class="terms">
      <input type="checkbox" name="terms" value="yes" required />
      <span
        >{t('form.terms')}
        <a href={privacyHref} data-shot={shotFor('resume')}>{t('form.policy')}</a></span
      >
    </label>

    <button type="submit" class="button send" disabled={phase === 'sending'}>
      {t('form.submit')}
      <span class="plane" aria-hidden="true">{@html Send}</span>
    </button>
  </div>

  <div class="status" role="status" aria-live="polite">
    {#if phase === 'sending'}
      <Loader label={t('form.sending')} />
    {/if}
    {#if result}
      <span class="mark" aria-hidden="true">{@html result.mark}</span>
      <h2 class="title">{result.title}</h2>
      {#if phase === 'error'}
        <button type="button" class="action" onclick={retry}>{result.text}</button>
      {:else}
        <p>{result.text}</p>
      {/if}
    {/if}
  </div>
</form>
