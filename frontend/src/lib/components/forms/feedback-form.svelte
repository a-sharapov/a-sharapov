<script>
  export let sended
  export let message

  message.set({
    type: 'info',
    content: '',
    hidden: true,
  })

  const handleFormSubmit = async (event) => {
    const form = event.target
    const data = new FormData(form)
    const url = form.getAttribute('action')
    const method = form.getAttribute('method')
    let response = await fetch(url, {
        method,
        body: data,
    })

    if (response.ok) {
      response = await response.json()
      message.set({
        type: "success",
        content: response.message,
        hidden: false,
      })
      sended.set("completed")
    } else {
      response = await response.json()
      sended.set("uncompleted")
      message.set({
        type: 'error',
        content: response.message,
        hidden: false,
      })
    }
  }
</script>

<form action="/api/feedback" method="post" formenctype="multipart/form-data" on:submit|preventDefault="{handleFormSubmit}">
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