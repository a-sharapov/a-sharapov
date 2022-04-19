<script>
  import { browser } from '$app/env'
  import Head from "$lib/components/seo/head.svelte"
  import VCard from "$lib/components/chunks/vcard.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading, b64DecodeUnicode } from "$lib/components/utils/"
  import config from "$lib/config/main.js"
  import page from "$lib/content/main.json"

  const { slogan } = config

  status.set("main")
  browser && loading.set(false)
</script>

<Head title="{page.title}" />
<Content {status} {loading}>
  <VCard {status} {loading} {slogan} change="{b64DecodeUnicode(page.content)}" />
</Content>
<Composition {status} />