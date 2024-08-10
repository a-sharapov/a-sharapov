export default {
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
  NOT_FOUND: "Not found...",
  NEW_MESSAGE_REQUEST: "[Received message request]",
  CAN_NOT_REPLY: "This bot cannot receive notifications, sorry bro 🤖",
};
