import { log } from '$lib/common/utils';

var _read = (name: string, fallback = ''): string =>
  (typeof process === 'undefined' ? '' : (process.env[name] ?? '')) || fallback;

export var SERVER_ENV = {
  pocketBase: _read('PB_URL', 'http://cms:5703'),
  bot: _read('BOT_URL', 'http://bot:5702'),
  botToken: _read('BOT_SERVICE_TOKEN'),
  cacheStrategy: _read('CACHE_STRATEGY', 'file'),
};

void (
  import.meta.env.PROD &&
  !SERVER_ENV.botToken &&
  log.warning(
    'env: BOT_SERVICE_TOKEN is not set — inquiries will not reach Telegram'
  )
);
