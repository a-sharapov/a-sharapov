<script>
  import { message } from '$lib/components/utils'
  import Notifier from './notifier.svelte'

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    try {
      const form = event.target
      const data = new FormData(form)
      const url = form.getAttribute('action')
      const method = form.getAttribute('method')
      const response = await fetch(url, {
        method,
        body: data,
      })
      const json = await response.json()
      console.log(json)
      $message.content = json.message
    } catch(e) {
      console.error(e)
      message.set({
        type: 'error',
        content: e.message
      })
    }
  }
</script>

<Notifier {message} />
<form action="/" method="post" formenctype="multipart/form-data" on:submit="{handleFormSubmit}">
  <label data-width="half">
    <input type="text" name="name" placeholder="Представьтесь" autocomplete="on" required />
  </label><label data-width="half">
    <input type="text" name="email" placeholder="Укажите ваш e-mail для ответа" autocomplete="on" required />
  </label>
  <p>&nbsp;</p>
  <label data-width="full">
    <textarea name="message" placeholder="Выскажитесь" required></textarea>
  </label>
  <p>&nbsp;</p>
  <label data-width="full">
    <input type="file" name="attachments" multiple />
  </label>
  <p>&nbsp;</p>
  <label data-width="full" data-align="center">
    <button type="submit">Отправить сообщение</button>
  </label>
</form>