<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import Feedback from "$lib/components/chunks/feedback.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"  
  import { status, loading } from "$lib/components/utils/"
  
  status.set("connect")
  browser && loading.set(false)
</script>

<Head title="Отправить сообщение" />
<Content {status} {loading}>
  <Feedback>
    <h3>Я на связи</h3>
    <p>И всегда стараюсь отвечать на конструктивные предложения так быстро, как только это становится возможным.</p>
    <hr />
  </Feedback>
</Content>
<Composition {status} />