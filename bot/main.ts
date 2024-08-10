import { serve } from "bun";
import { Telegraf } from "telegraf";
import { setMotd } from "./assets";
import { attachBotHandlers, handleServiceRequest } from "./assets/handlers";
import { getTimeStamp } from "./assets/utils";
import db from "./repo";

const token = import.meta.env.TG_TOKEN;
const port = import.meta.env.TG_PORT || 5702;

const bot = new Telegraf(token as string);

bot && attachBotHandlers(bot);

const fetch = async (request: Request) => {
  const { url: path, method, body } = request;
  const { status, response } = await handleServiceRequest({
    path,
    method,
    body,
    bot,
  });

  return new Response(JSON.stringify(response), { status });
};

const handleExit = (code: unknown) => {
  console.log(`❗ Shutting down... (${code})`);
  db.close();
  bot.stop(String(code));
};

try {
  bot.launch();
  serve({
    port,
    fetch,
  });

  void (!token && console.warn(`❗ Bot token is not provided!`));
  console.log(setMotd(port));
} catch (e) {
  console.log(
    `${getTimeStamp()} Startup error :`,
    e instanceof Error ? e.message : e
  );
}

process.on("exit", handleExit);
