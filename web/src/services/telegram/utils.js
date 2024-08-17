import { ALLOWED_MAIL_FIELDS, DISALLOWED_MAIL_FIELDS, MAIL_TITLE } from '@lib/shared/constants'

export var createPayload = async (payload) =>
  `📫 ${MAIL_TITLE.toLocaleUpperCase()}\n${Object.keys(payload)
    .reduce((acc, key) => {
      const name = ALLOWED_MAIL_FIELDS[key] || key
      const value = payload[key]

      return DISALLOWED_MAIL_FIELDS.includes(key) ? acc : [...acc, `${name}: ${value}\n`]
    }, [])
    .join('\n')}`
