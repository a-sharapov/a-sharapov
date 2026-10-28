<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ContactKind, ContactRecord } from '#lib/common/types.ts';
  import { localize, splitLabel } from '#lib/common/utils.ts';
  import Github from '#lib/i/github.svg?raw';
  import Linkedin from '#lib/i/linkedin.svg?raw';
  import Mail from '#lib/i/mail.svg?raw';
  import Phone from '#lib/i/phone.svg?raw';
  import Telegram from '#lib/i/telegram.svg?raw';
  import type { Dictionary } from '#lib/i18n/context.ts';
  import './Contacts.css';
  import '#lib/components/@Forms/InquiryForm/InquiryForm.css';

  interface IContacts {
    t: Dictionary;
    contacts: ContactRecord[];
    content: string;
    title: string;
    children?: Snippet;
  }

  const _ICONS: Record<ContactKind, string> = {
    phone: Phone,
    telegram: Telegram,
    email: Mail,
    linkedin: Linkedin,
    github: Github,
  };

  const _EXTERNAL: ContactKind[] = ['telegram', 'linkedin', 'github'];

  const _LINK_ATTRS = { target: '_blank', rel: 'noopener noreferrer external' };

  const _rows = (group: ContactRecord[]) =>
    group.map(({ id, kind, label, href }, index) =>
      (({ 0: head, 1: tail }) => ({
        id,
        tag: href ? 'a' : 'span',
        attrs: href ? { href, ...(_EXTERNAL.includes(kind) ? _LINK_ATTRS : {}) } : {},
        icon: group[index - 1]?.kind === kind ? '' : _ICONS[kind],
        head,
        tail,
      }))(splitLabel(label))
    );

  let { t: dictionary, contacts, content, title, children }: IContacts = $props();

  const t = $derived(localize(dictionary));
  const groups = $derived(
    Object.values(
      contacts.reduce<Record<number, ContactRecord[]>>(
        (acc, contact) => ({
          ...acc,
          [contact.group]: [...(acc[contact.group] ?? []), contact],
        }),
        {}
      )
    ).map(_rows)
  );
</script>

<div class="contacts">
  <header class="profile">
    <h1><span class="sr-only">{title} —</span> {t('profile.name')}</h1>
    <p class="role">{t('profile.role')}</p>
    <div class="reach">
      {#each groups as group, index (index)}
        <ul>
          {#each group as { id, tag, attrs, icon, head, tail } (id)}
            <li>
              <span class="icon" aria-hidden="true">{@html icon}</span>
              <svelte:element this={tag} {...attrs}
                >{head}
                {#if tail}
                  <strong>{tail}</strong>
                {/if}</svelte:element
              >
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </header>
  <div class="write">
    <div class="lead">{@html content}</div>
    {@render children?.()}
  </div>
</div>
