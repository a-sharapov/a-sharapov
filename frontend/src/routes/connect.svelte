<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import Feedback from "$lib/components/forms/feedback.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading } from "$lib/components/utils/"
  
  status.set("connect")
  browser && loading.set(false)
</script>

<Head title="Отправить сообщение" />
<Content {status} {loading}>
  <Feedback />
</Content>
<Composition {status} />