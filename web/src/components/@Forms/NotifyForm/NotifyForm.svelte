<script>
  import Loader from '@lib/components/Loader/Loader.svelte'
  import Error from '@lib/components/Marks/Error.svelte'
  import Success from '@lib/components/Marks/Success.svelte'
  import { DEFAULT_LOCALE, LOCALES } from '@lib/l18n'
  import { COLLECT_API_URL } from '@lib/shared/constants'
  import { pipe } from '@lib/shared/utils'
  import './NotifyForm.scss'

  const IDLE = Symbol.for('idle')
  const LOADING = Symbol.for('loading')
  const ERROR = Symbol.for('error')
  const SUCCESS = Symbol.for('success')

  export let locale = DEFAULT_LOCALE
  export let errorHeader = LOCALES[locale].ERROR_TITLE
  export let errorText = undefined
  export let successHeader = LOCALES[locale].SUCCESS_TITLE
  export let successText = LOCALES[locale].SUCCESS_TEXT
  export let retryText = LOCALES[locale].RETRY_TEXT
  export let loadingText = LOCALES[locale].LOADING_TITLE

  let state = IDLE
  let form

  const submitMailerForm = async () => {
    state = LOADING
    const formData = new FormData(form)
    const eventName = formData.get('processEvent')

    if (eventName) {
      const _toSneakeCase = (r) =>
        String(r)
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
      const _toUpperCase = (r) => String(r).toUpperCase()
      const _getFromStorage = (r) => sessionStorage.getItem(r)

      formData.set('processEvent', pipe(_toSneakeCase, _toUpperCase, _getFromStorage)(eventName))
    }

    const { ok } = await fetch(COLLECT_API_URL, {
      method: form?.getAttribute('method') || 'POST',
      body: formData
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }))

    state = ok ? SUCCESS : ERROR
  }
</script>

<form
  class="notifyForm"
  data-state={state.description}
  on:submit|preventDefault={submitMailerForm}
  bind:this={form}
  method="POST"
  enctype="multipart/form-data"
>
  {#if state === IDLE}
    <slot />
  {/if}
  {#if state === LOADING}
    <Loader type="inline" text={loadingText} />
  {/if}
  {#if state === ERROR}
    <div class="errorMessage">
      <p class="centered">
        <Error />
      </p>
      <h4>{errorHeader}</h4>
      <p class="centered">
        {#if errorText}
          {errorText}
        {:else}
          <span
            class="action"
            data-action="retry"
            role="button"
            tabindex="0"
            on:click={() => void (state = IDLE)}
            on:keydown={() => void (state = IDLE)}
          >
            {retryText}
          </span>
        {/if}
      </p>
    </div>
  {/if}
  {#if state === SUCCESS}
    <div class="successMessage">
      <p class="centered">
        <Success />
      </p>
      <h4>{successHeader}</h4>
      <p class="centered">
        {successText}
      </p>
    </div>
  {/if}
</form>
