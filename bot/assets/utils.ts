import DICTIONARY from "./dictionary";

export var pipe =
  (...fns: Function[]) =>
  (arg: any) =>
    fns.reduce(
      (acc, fn) => (fn instanceof Promise ? fn.then(acc) : fn(acc)),
      arg
    );

export var getTimeStamp = () => `[${new Date().toLocaleDateString()}]`;

export var sendPersistedMessage = async (
  ctx: any,
  method: any,
  args: unknown[]
): Promise<void> => {
  try {
    const message =
      method instanceof Function ? method?.immediate?.(...args) : void 0;
    message && (await ctx.reply(message));
  } catch {
    await ctx.reply(DICTIONARY.EMPTY_REPLY);
  }
};

export var handleAuth = async (
  ctx: any,
  ACTIVE_CHATS: Set<string>,
  TIMESTAMP: string
): Promise<void> => {
  ctx.session?.messages.push(ctx.message.text);
  ctx.session.isAuth = true;
  ACTIVE_CHATS.add(ctx.message.chat.id);
  console.log(
    `${TIMESTAMP} ${DICTIONARY.NEW_AUTH} ${ctx.from.first_name} ${ctx.from.last_name}`
  );
  await ctx.reply(DICTIONARY.SUCCESS_REPLY);
};
