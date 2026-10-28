import { Telegraf } from 'telegraf';
import { setMotd } from './assets';
import { defineApi } from './assets/api';
import { readConfig } from './assets/config';
import { MAX_BODY_BYTES } from './assets/constants';
import { defineHandlers } from './assets/handlers';
import { defineNotify, skipNotify } from './assets/notify';
import { definePolling, limitPolls } from './assets/polling';
import { log } from './assets/utils';
import { defineRepo, openDatabase } from './repo';

const config = readConfig(Bun.env);
const db = openDatabase(config.dbPath);
const repo = defineRepo(db);
const bot = config.telegramToken
  ? defineHandlers({ repo, managerTokens: config.managerTokens }).attach(
      limitPolls(new Telegraf(config.telegramToken))
    )
  : null;
const polling = bot
  ? definePolling({ launch: (onStarted) => bot.launch(onStarted) })
  : null;

const api = defineApi({
  repo,
  notify: bot ? defineNotify({ repo, telegram: bot.telegram }) : skipNotify(),
  token: config.serviceToken,
  telegram: () => polling?.state() ?? 'disabled',
});

const server = Bun.serve({
  port: config.port,
  fetch: api.fetch,
  maxRequestBodySize: MAX_BODY_BYTES,
});

console.log(setMotd(server.port ?? config.port, api.endpoints));

void (
  config.serviceToken ||
  log('BOT_SERVICE_TOKEN is not set: protected endpoints reply 401')
);
void (
  config.managerTokens.length ||
  log('TG_MANAGER_TOKEN is not set: nobody can subscribe')
);

void (polling
  ? polling.start()
  : log('TG_TOKEN is not set: telegram is disabled, messages are only stored'));

const _stopBot = (reason: string): Promise<void> =>
  Promise.try(() => bot?.stop(reason)).then(undefined, () => undefined);

setInterval(repo.messages.prune, 24 * 60 * 60 * 1000).unref();

const _shutdown = (signal: string): Promise<void> => (
  log(`shutting down (${signal})`),
  polling?.stop(),
  _stopBot(signal)
    .then(() => server.stop(true))
    .finally(() => (db.close(), process.exit(0)))
);

process.once('SIGINT', _shutdown);
process.once('SIGTERM', _shutdown);
