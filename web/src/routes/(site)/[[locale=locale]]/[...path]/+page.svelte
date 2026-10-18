<script lang="ts">
  import Card from '#lib/components/@Content/Card/Card.svelte';
  import Contacts from '#lib/components/@Content/Contacts/Contacts.svelte';
  import Sheet from '#lib/components/@Content/Sheet/Sheet.svelte';
  import Head from '#lib/components/@Layout/Head/Head.svelte';
  import Island from '#lib/components/@UX/Island/Island.svelte';
  import { page } from '$app/state';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Head t={data.i18n} site={data.site} {...data.head} />

{#if data.template === 'card'}
  <Card t={data.i18n} href={data.contactsHref} content={data.html} contacts={data.contacts} />
{:else}
  <Sheet shot={data.shot} layout={data.layout}>
    {#if data.template === 'contacts'}
      <Contacts t={data.i18n} contacts={data.contacts} content={data.html} title={data.title}>
        <Island
          when="visible"
          load={() => import('#lib/components/@Forms/InquiryForm/InquiryForm.svelte')}
          html={data.form}
          props={{ t: data.i18n, locale: data.locale, page: page.url.pathname, sent: data.sent }}
        />
      </Contacts>
    {:else}
      {@html data.html}
    {/if}
  </Sheet>
{/if}
