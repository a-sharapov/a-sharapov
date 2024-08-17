import { telegramService } from '@lib/services/telegram'
import { DICTIONARY } from '@lib/services/telegram/dictionary'
import { pipe, sanitizeValue } from '@lib/shared/utils'

export var GET = () =>
  new Response(
    JSON.stringify({
      ok: false,
      message: DICTIONARY.NOT_ALLOWED
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

const _createBodyObject = (payload) =>
  [...payload.entries()].reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: result[key] ? [...result[key], value] : [value]
    }),
    {}
  )

const _flatSingleValues = (body) =>
  Object.entries(body).reduce(
    (acc, [key, values]) => ({
      ...acc,
      [key]: sanitizeValue([...values].filter(Boolean).join(', '))
    }),
    {}
  )

export var POST = async ({ request }) => {
  let output = {
    ok: false,
    message: ''
  }

  try {
    const formData = await request.formData()
    const dataObject = pipe(_createBodyObject, _flatSingleValues)(formData)

    const { 0: serviceStatus, 1: serviceMessage } = await telegramService(dataObject)

    output.ok = serviceStatus
    output.message = serviceMessage || ''
  } catch (e) {
    output.message = (e instanceof Error ? e.message : e) || DICTIONARY.UNKNOWN_ERROR
  }

  return new Response(JSON.stringify(output), {
    status: output.ok ? 200 : 400,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
