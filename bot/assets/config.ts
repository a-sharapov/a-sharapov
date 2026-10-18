import { DEFAULT_DB_PATH, DEFAULT_PORT } from './constants';
import { splitList } from './utils';

export type Config = {
  telegramToken: string;
  serviceToken: string;
  managerTokens: string[];
  port: number;
  dbPath: string;
};

export var readConfig = (env: Record<string, string | undefined>): Config => ({
  telegramToken: env.TG_TOKEN?.trim() ?? '',
  serviceToken: env.BOT_SERVICE_TOKEN?.trim() ?? '',
  managerTokens: splitList(env.TG_MANAGER_TOKEN),
  port: Number(env.TG_PORT) || DEFAULT_PORT,
  dbPath: env.BOT_DB_PATH?.trim() || DEFAULT_DB_PATH,
});
