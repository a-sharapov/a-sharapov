var LOCALES = {
  RU: {
    SHUTTING_DOWN: `Сервис бота будет перезапущен... Для получения сообщений требуется выполнить авторизацию заново /start.`,
    SUCCESS_REPLY: `Ключ доступа верный, теперь вы будете получать уведомления.`,
    ERROR_REPLY: `Нераспознан ключ доступа, если вы перестали получать уведомления - попробуйте инициировать сессию заново используя команду /start.`,
    EMPTY_REPLY: `Пока нет сообщений.`,
    NEW_AUTH: `[Авторизовался новый пользователь]`,
    INITIALIZE_SESSION: (ctx: any) =>
      `Привет${
        ctx.from?.first_name && `, ${ctx.from.first_name}`
      }!\nДля того, чтобы получать уведомления - пришлите свой ключ доступа:`,
    AVAILABLE_OPERATIONS: (LIMIT: number | string) =>
      `Вот все доступные методы:\n- Для авторизации используйте команду /start и пришлите свой ключ доступа в следующем сообщении.\n- Для того, чтобы получить ${LIMIT} последних сообщений используйте команду /last.\n- Для того, чтобы получить все сообщения используйте команду /all.`,
  },
  EN: {
    SHUTTING_DOWN: `The bot service will be restarted... To receive messages you need to authorize again \`/start\`.`,
    SUCCESS_REPLY: `The access key is correct, you will now receive notifications.`,
    ERROR_REPLY: `Unrecognized access key, if you stopped receiving notifications - try to reinitiate the session using the \`/start\` command.`,
    EMPTY_REPLY: `No messages yet.`,
    NEW_AUTH: `[New User Authorized]`,
    INITIALIZE_SESSION: (ctx: any) =>
      `Hi${
        ctx.from?.first_name && `, ${ctx.from.first_name}`
      }!\n To receive notifications, please send your access key:`,
    AVAILABLE_OPERATIONS: (LIMIT: number | string) =>
      `Here are all available methods:\n- To authorize, use the \`/start\` command and send your access key in the next message.\n- To get ${LIMIT} of recent messages use the \`/last\` command.\n- To get all messages use the \`/all\` command.`,
  },
};

export default LOCALES;
