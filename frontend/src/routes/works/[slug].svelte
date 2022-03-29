<script>
  import { writable } from 'svelte/store'
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import VCard from "$lib/components/chunks/vcard.svelte"
  import Works from "$lib/components/chunks/works.svelte"
  import CV from "$lib/components/chunks/cv.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"
  import Loader from "$lib/components/ui/loader.svelte"
  import { status, loading } from "$lib/components/utils/"

  status.set("works")

  browser && loading.set(false)
</script>

<Head title="Проекты" />
<Content {status} {loading}>
  {#if $status === "main" && !$loading}
    <VCard {status} {loading} />
  {:else if $status === "cv"}
    <CV {status} {loading}>
      <Loader {loading} />
    </CV>
  {:else if $status === "works"}
    <Works {status} {loading}>
      <Loader {loading} />
      
    </Works>
  {/if}
</Content>
<Composition {status} />