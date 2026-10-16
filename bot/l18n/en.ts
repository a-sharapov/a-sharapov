import type ru from './ru';

export default {
  GREETING: (name = '') =>
    `Hi${name ? `, ${name}` : ''}!\nTo receive notifications, please send your access key:`,
  SUCCESS_REPLY:
    'The access key is correct, you will now receive notifications.',
  ERROR_REPLY:
    'Unrecognized access key, if you stopped receiving notifications - try to reinitiate the session using the /start command.',
  UNSUBSCRIBE_REPLY: 'You have been unsubscribed from notifications.',
  EMPTY_REPLY: 'No messages yet.',
  HELP: (limit: number) =>
    `Here are all available methods:\n- To authorize, use the /start command and send your access key in the next message.\n- To get ${limit} recent messages use the /last command.\n- To get all messages use the /all command.\n- To unsubscribe from messages use the /unsubscribe command.`,
  CAN_NOT_REPLY: 'This bot cannot receive notifications, sorry bro 🤖',
} satisfies typeof ru;
