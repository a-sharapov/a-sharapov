<script lang="ts">
  import { tick } from 'svelte';
  import {
    INQUIRY_API_URL,
    INQUIRY_LIMITS,
    INQUIRY_SENT,
    PRIVACY_SLUG,
  } from '#lib/common/constants.ts';
  import { hrefFor, shotFor } from '#lib/common/routes.ts';
  import type { Locale } from '#lib/common/types.ts';
  import Loader from '#lib/components/@UX/Loader/Loader.svelte';
  import MarkError from '#lib/i/mark-error.svg?raw';
  import MarkSuccess from '#lib/i/mark-success.svg?raw';
  import Send from '#lib/i/send.svg?raw';
  import {
    type Dictionary,
    listOf,
    provideTranslation,
    useTranslation,
  } from '#lib/i18n/context.ts';
  import { sendInquiry } from './inquiry-api';
  import './InquiryForm.css';

  type Phase = 'idle' | 'sending' | 'success' | 'error';

  const _FIELDS = ['topic', 'contact', 'message', 'terms'] as const;

  type Field = (typeof _FIELDS)[number];

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
  let title = $state<HTMLElement>();
  let live = $state(false);
  let tried = $state(false);
  let invalid = $state<Field[]>([]);

  $effect(() => void (live = true));

  const _errors = $derived<Record<Field, string>>({
    topic: t('form.errors.topic'),
    contact: t('form.errors.required'),
    message: t('form.errors.required'),
    terms: t('form.errors.terms'),
  });

  const errorOf = (name: Field) => (invalid.includes(name) ? _errors[name] : '');

  const errorId = (name: Field) => (invalid.includes(name) ? `inquiry-${name}-error` : undefined);

  const _filled = (data: FormData, name: Field) => String(data.get(name) ?? '').trim() !== '';

  const _check = (form: HTMLFormElement) =>
    ((data) => _FIELDS.filter((name) => !_filled(data, name)))(new FormData(form));

  const _focusFirst = (form: HTMLFormElement) =>
    void tick().then(() => form.querySelector<HTMLElement>(`[name="${invalid[0]}"]`)?.focus());

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

  const _announce = () => void tick().then(() => title?.focus());

  const _send = (form: HTMLFormElement) =>
    void ((phase = 'sending'),
    sendInquiry(new FormData(form)).then(
      () => (
        (phase = 'success'),
        (tried = false),
        form.reset(),
        _announce(),
        window.dispatchEvent(new CustomEvent(INQUIRY_SENT))
      ),
      () => ((phase = 'error'), _announce())
    ));

  const handleSubmit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) =>
    void (event.preventDefault(),
    (tried = true),
    (invalid = _check(event.currentTarget)),
    invalid.length ? _focusFirst(event.currentTarget) : _send(event.currentTarget));

  const recheck = (event: Event & { currentTarget: HTMLFormElement }) =>
    void (tried && (invalid = _check(event.currentTarget)));

  const retry = () => void (phase = 'idle');

  const _alignRows = (area: HTMLTextAreaElement, row: number) =>
    void (area.scrollTop = Math.round(area.scrollTop / row) * row);

  const alignRows = (event: UIEvent & { currentTarget: HTMLTextAreaElement }) =>
    _alignRows(
      event.currentTarget,
      Number.parseFloat(getComputedStyle(event.currentTarget).lineHeight)
    );
</script>

<form
  class="inquiry"
  method="post"
  action={INQUIRY_API_URL}
  data-phase={phase}
  novalidate={live}
  onsubmit={handleSubmit}
  oninput={recheck}
>
  <input type="hidden" name="locale" value={locale} />
  <input type="hidden" name="page" value={page} />
  <label class="trap" aria-hidden="true">
    Website <input type="text" name="website" tabindex="-1" autocomplete="off" />
  </label>

  <div class="fields">
    <fieldset class="topics" aria-describedby={errorId('topic')}>
      <legend class="label">
        {t('form.topic.label')}
        {#if errorOf('topic')}
          <span class="error" id={errorId('topic')} aria-hidden="true">{errorOf('topic')}</span>
        {/if}
      </legend>
      <div class="options">
        {#each topics as topic (topic)}
          <label class="option">
            <input type="radio" name="topic" value={topic} required />
            <span>{topic}</span>
          </label>
        {/each}
      </div>
    </fieldset>

    <label class="field">
      <span class="label">{t('form.contact.label')}</span>
      {#if errorOf('contact')}
        <span class="error" id={errorId('contact')} aria-hidden="true">{errorOf('contact')}</span>
      {/if}
      <input
        type="text"
        name="contact"
        required
        aria-invalid={errorOf('contact') ? 'true' : undefined}
        aria-describedby={errorId('contact')}
        maxlength={INQUIRY_LIMITS.contact}
        autocomplete="email"
        placeholder={t('form.contact.hint')}
      />
    </label>

    <label class="field">
      <span class="label">{t('form.message.label')}</span>
      {#if errorOf('message')}
        <span class="error" id={errorId('message')} aria-hidden="true">{errorOf('message')}</span>
      {/if}
      <textarea
        name="message"
        rows="4"
        onscrollend={alignRows}
        required
        aria-invalid={errorOf('message') ? 'true' : undefined}
        aria-describedby={errorId('message')}
        maxlength={INQUIRY_LIMITS.message}
        placeholder={t('form.message.hint')}
      ></textarea>
    </label>

    <label class="terms">
      <input
        type="checkbox"
        name="terms"
        value="yes"
        required
        aria-invalid={errorOf('terms') ? 'true' : undefined}
        aria-describedby={errorId('terms')}
      />
      <span
        >{t('form.terms')}
        <a href={privacyHref} data-shot={shotFor('resume')}>{t('form.policy')}</a>
        {#if errorOf('terms')}
          <span class="error" id={errorId('terms')} aria-hidden="true">{errorOf('terms')}</span>
        {/if}</span
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
      <h2 class="title" tabindex="-1" bind:this={title}>{result.title}</h2>
      {#if phase === 'error'}
        <button type="button" class="action" onclick={retry}>{result.text}</button>
      {:else}
        <p>{result.text}</p>
      {/if}
    {/if}
  </div>
</form>
