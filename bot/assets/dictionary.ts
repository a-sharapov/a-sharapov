export default {
  NOT_FOUND: "Not found",
  SUCCESS_REPLY: `Ключ доступа верный, теперь вы будете получать уведомления.`,
  CAN_NOT_REPLY: `Бот не может получать уведомления, sorry bro 🤖`,
  ERROR_REPLY: `Нераспознан ключ доступа, если вы перестали получать уведомления - попробуйте инициировать сессию заново используя команду /start.`,
  EMPTY_REPLY: `Пока нет сообщений.`,
  NEW_AUTH: `[Авторизовался новый пользователь]`,
  NEW_MESSAGE_REQUEST: `[Получен запрос на передачу сообщения]`,
  INITIALIZE_SESSION: (ctx: any): string =>
    `Привет${
      ctx.from?.first_name && `, ${ctx.from.first_name}`
    }!\nДля того, чтобы получать уведомления - пришлите свой ключ доступа:`,
  AVAILABLE_OPERATIONS: (LIMIT: number): string => `Вот все доступные методы:\n
            - Для авторизации используйте команду /start и пришлите свой ключ доступа в следующем сообщении.\n- Для того, чтобы получить ${LIMIT} последних сообщений используйте команду /last.\n- Для того, чтобы получить все сообщения используйте команду /all.`,
};