<script lang="ts">
  import { tick } from 'svelte';
  import type { ContactKind, ContactRecord } from '#lib/common/types.ts';
  import { localize, splitLabel } from '#lib/common/utils.ts';
  import Mail from '#lib/i/mail.svg?raw';
  import Phone from '#lib/i/phone.svg?raw';
  import Telegram from '#lib/i/telegram.svg?raw';
  import Turn from '#lib/i/turn.svg?raw';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import Logo from '#lib/logo.svg?raw';
  import './Card.css';

  interface ICard {
    t: Dictionary;
    href: string;
    content: string;
    contacts: ContactRecord[];
  }

  const _ICONS: Partial<Record<ContactKind, string>> = {
    phone: Phone,
    telegram: Telegram,
    email: Mail,
  };

  let { t: dictionary, href, content, contacts }: ICard = $props();

  const t = $derived(localize(dictionary));
  const reach = $derived(
    contacts
      .filter(({ kind }) => kind in _ICONS)
      .map((contact, index, list) =>
        (({ 0: head, 1: tail }) => ({
          id: contact.id,
          link: contact.href,
          icon: list[index - 1]?.kind === contact.kind ? '' : (_ICONS[contact.kind] ?? ''),
          head,
          tail,
        }))(splitLabel(contact.label))
      )
  );

  let flipped = $state(false);
  let face = $state<HTMLElement>();
  let back = $state<HTMLElement>();

  const flip = (next: boolean) =>
    void ((flipped = next),
    tick().then(() => (next ? back?.querySelector('a') : face)?.focus({ preventScroll: true })));

  const onBack = (event: MouseEvent) =>
    void ((event.target as Element).closest('a') || flip(false));

  const onKey = (event: KeyboardEvent) => void (event.key === 'Escape' && flip(false));
</script>

<section class="card" aria-labelledby="card-title">
  <h1 id="card-title" class="logo">
    <span aria-hidden="true">{@html Logo}</span>
    <span class="sr-only">{t('profile.name')} — {t('profile.role')}</span>
  </h1>
  <p class="tagline">
    <span class="idle">{t('profile.tagline')}</span>
    <a class="cta" {href}>{t('profile.taglineHover')}</a>
  </p>
</section>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="paper-card" data-flipped={flipped ? '' : undefined} onkeydown={onKey}>
  <div class="turn">
    <button
      type="button"
      class="face"
      inert={flipped}
      bind:this={face}
      aria-label={t('a11y.flipCard')}
      onclick={() => flip(true)}
    >
      <span class="logo" aria-hidden="true">{@html Logo}</span>
      <span class="tagline" aria-hidden="true">{t('profile.tagline')}</span>
      <span class="hint" aria-hidden="true">{@html Turn}</span>
    </button>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="back" inert={!flipped} bind:this={back} onclick={onBack}>
      <p class="name">{t('profile.name')}</p>
      <p class="role">{t('profile.role')}</p>
      <ul>
        {#each reach as { id, link, icon, head, tail } (id)}
          <li>
            <span class="icon" aria-hidden="true">{@html icon}</span>
            <a href={link}
              >{head}
              {#if tail}
                <strong>{tail}</strong>
              {/if}</a
            >
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>

{#if content}
  <div class="intro">{@html content}</div>
{/if}
