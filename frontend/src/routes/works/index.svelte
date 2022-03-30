<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import Works from "$lib/components/chunks/works.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"
  import Loader from "$lib/components/ui/loader.svelte"
  import { status, loading } from "$lib/components/utils/"

  status.set("works")

  browser && loading.set(false)
</script>

<Head title="Проекты" />
<Content {status} {loading}>
  <Works {status} {loading}>
    <Loader {loading} />
    
  </Works>
</Content>
<Composition {status} />