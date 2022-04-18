<script context="module">
  import { getPageContent } from "$lib/components/requests/"

  export async function load() {
    try {
      const response = await getPageContent("main")
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
  import VCard from "$lib/components/chunks/vcard.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading, b64DecodeUnicode } from "$lib/components/utils/"
  import config from "$lib/config/main.js"
  
  const { slogan } = config
  export let pages
  let page = pages[0]

  status.set("main")
  browser && loading.set(false)
</script>

<Head title="{page.title}" />
<Content {status} {loading}>
  <VCard {status} {loading} {slogan} change="{b64DecodeUnicode(page.content)}" />
</Content>
<Composition {status} />