<script>
  import { writable } from 'svelte/store'
  import emailjs from '@emailjs/browser'
  import Loader from '../ui/loader.svelte'

  export let sended
  export let message

  let processed = writable(false)

  message.set({
    type: 'info',
    content: '',
    hidden: true,
  })

  const handleFormSubmit = async (event) => {
    const form = event.target
    processed.set(true)

    emailjs.sendForm('service_sharapov_ya_mail', 'sharapov_web_simple', form, import.meta.env.VITE_MAIL_PUBLIC)
    .then((result) => {
      processed.set(false)
      message.set({
        type: "success",
        content: 'Сообщение успешно отправлено! Спасибо.',
        hidden: false,
      })
      sended.set("completed")
    }, (error) => {
      processed.set(false)
      message.set({
        type: 'error',
        content: 'Ошибка отправки сообщения! Попробуйте связаться по данным в CV.',
        hidden: false,
      })
      sended.set("uncompleted")
    })
  }
</script>

<form method="post" formenctype="multipart/form-data" data-processed="{$processed}" on:submit|preventDefault="{handleFormSubmit}">
  <Loader loading="{processed}" />
  <label data-width="half">
    <input type="text" name="name" placeholder="Представьтесь" autocomplete="on" required />
  </label><label data-width="half">
    <input type="email" name="email" placeholder="Укажите ваш e-mail для ответа" autocomplete="on" required />
  </label>
  <p>&nbsp;</p>
  <label data-width="full">
    <textarea name="message" placeholder="Выскажитесь" required></textarea>
  </label>
  <!--p>&nbsp;<p>
  <label data-width="full">
    <input type="file" name="attachments" multiple />
  </label-->
  <p>&nbsp;</p>
  <label data-width="full" data-align="center">
    <button type="submit">Отправить сообщение</button>
  </label>
</form>

<style>
  form[data-processed="true"] label {
    filter: blur(2px);
  }
</style>