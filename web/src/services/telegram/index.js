import { TG_WEBHOOK } from '@lib/shared/constants'
import { DICTIONARY } from './dictionary'
import { createPayload } from './utils'

export var telegramService = async (payload, webhookUrl = TG_WEBHOOK) => {
  let status = true
  let statusMessage = null
  const isDryRun = false //import.meta.env.DEV
  const logTime = () =>
    `${new Date().toLocaleTimeString('ru-RU')}, ${new Date().toLocaleDateString('ru-RU')}`

  try {
    if (isDryRun) {
      statusMessage = DICTIONARY.DEV_MODE
      console.log(`[${logTime()}] TELEGRAM SERVICE: ${statusMessage}`, payload)
    } else {
      const sanitizedPayload = await createPayload(payload)
      const { message } = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: sanitizedPayload
        })
      }).then((res) => res.json())

      statusMessage = message
    }
  } catch (e) {
    status = false
    statusMessage = (e instanceof Error ? e.message : e) || null
    console.error(`[${logTime()}] TELEGRAM SERVICE: ${statusMessage}`)
  }

  return [status, statusMessage]
}
