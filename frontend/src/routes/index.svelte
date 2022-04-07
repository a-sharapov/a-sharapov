<script context="module">

</script>

<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import VCard from "$lib/components/chunks/vcard.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading } from "$lib/components/utils/"
  
  status.set("main")
  browser && loading.set(false)
</script>

<Head title="Приветствие" />
<Content {status} {loading}>
  <VCard {status} {loading} />
</Content>
<Composition {status} />