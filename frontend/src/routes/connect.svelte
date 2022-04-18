<script context="module">
  import { getPageContent } from "$lib/components/requests/"

  export async function load() {
    try {
      const response = await getPageContent("connect")
      return {
        props: {
          pages: response.ok && (await response.json()),
        }
      }
    } catch (e) {
      return {
        status: e.status,
        error: e.message, 
      }
    }
  }
</script>

<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import Feedback from "$lib/components/chunks/feedback.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading, b64DecodeUnicode } from "$lib/components/utils/"
  
  export let pages
  let page = pages[0]

  status.set("connect")
  browser && loading.set(false)
</script>

<Head title="{page.title}" />
<Content {status} {loading}>
  <Feedback>
    {#if page.content && browser}
      {@html b64DecodeUnicode(page.content)}
    {/if}
  </Feedback>
</Content>
<Composition {status} />