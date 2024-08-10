export default {
  SHUTTING_DOWN: `Сервис бота будет перезапущен... Для получения сообщений требуется выполнить авторизацию заново /start.`,
  SUCCESS_REPLY: `Ключ доступа верный, теперь вы будете получать уведомления.`,
  ERROR_REPLY: `Нераспознан ключ доступа, если вы перестали получать уведомления - попробуйте инициировать сессию заново используя команду /start.`,
  UNSUBSCRIBE_REPLY: `Вы отписались от уведомлений.`,
  EMPTY_REPLY: `Пока нет сообщений.`,
  NEW_AUTH: `[Авторизовался новый пользователь]`,
  INITIALIZE_SESSION: (ctx: any) =>
    `Привет${
      ctx.from?.first_name && `, ${ctx.from.first_name}`
    }!\nДля того, чтобы получать уведомления - пришлите свой ключ доступа:`,
  AVAILABLE_OPERATIONS: (LIMIT: number | string) =>
    `Вот все доступные методы:\n- Для авторизации используйте команду /start и пришлите свой ключ доступа в следующем сообщении.\n- Для того, чтобы получить ${LIMIT} последних сообщений используйте команду /last.\n- Для того, чтобы получить все сообщения используйте команду /all. Для того, чтобы отписаться от сообщений используйте команду /unsubscribe.`,
  NOT_FOUND: "Ничего не найдено...",
  NEW_MESSAGE_REQUEST: "[Получен запрос на передачу сообщения]",
  UNSUBSCRIBE_REQUEST: "[Получен запрос на отмену подписки]",
  CAN_NOT_REPLY: "Бот не может получать уведомления, sorry bro 🤖",
};
