import type { Repo } from '../repo';
import { MAX_MESSAGE_LENGTH } from './constants';
import { chunkParts, log as defaultLog, errorMessage, type Log } from './utils';

export type TelegramSender = {
  sendMessage: (chatId: number, text: string) => Promise<unknown>;
};

export type DeliveryReport = { sent: number; failed: number };

export type Notify = (message: string) => Promise<DeliveryReport>;

type NotifyDeps = {
  repo: Repo;
  telegram: TelegramSender;
  log?: Log;
  sleep?: (ms: number) => Promise<unknown>;
};

var _EMPTY_REPORT: DeliveryReport = { sent: 0, failed: 0 };

var _retryAfterMs = (error: unknown): number | null =>
  ((response) =>
    response?.error_code === 429
      ? Math.min(Number(response.parameters?.retry_after ?? 1), 30) * 1000
      : null)(
    (
      error as {
        response?: {
          error_code?: number;
          parameters?: { retry_after?: number };
        };
      }
    )?.response
  );

var _count = (report: DeliveryReport, ok: boolean): DeliveryReport => ({
  sent: report.sent + (ok ? 1 : 0),
  failed: report.failed + (ok ? 0 : 1),
});

export var defineNotify = ({
  repo,
  telegram,
  log = defaultLog,
  sleep = (ms) => Bun.sleep(ms),
}: NotifyDeps): Notify => {
  const _fail = (chatId: number, error: unknown): false => (
    log(`delivery failed chat=${chatId}:`, errorMessage(error)), false
  );

  const _sendPart =
    (chatId: number) =>
    (text: string): Promise<boolean> =>
      ((attempt) =>
        attempt().then(
          () => true,
          (error: unknown) =>
            ((wait) =>
              wait === null
                ? _fail(chatId, error)
                : sleep(wait)
                    .then(attempt)
                    .then(
                      () => true,
                      (retryError: unknown) => _fail(chatId, retryError)
                    ))(_retryAfterMs(error))
        ))(() => telegram.sendMessage(chatId, text));

  const _sendChat =
    (parts: string[]) =>
    (chatId: number): Promise<boolean> =>
      parts.reduce<Promise<boolean>>(
        (sent, part) => sent.then((_) => _ && _sendPart(chatId)(part)),
        Promise.resolve(true)
      );

  return (message) =>
    ((send) =>
      repo.chats
        .ids()
        .reduce<Promise<DeliveryReport>>(
          (report, chatId) =>
            report.then((_) => send(chatId).then((ok) => _count(_, ok))),
          Promise.resolve(_EMPTY_REPORT)
        ))(_sendChat(chunkParts([message], '', MAX_MESSAGE_LENGTH)));
};

export var skipNotify = (): Notify => () => Promise.resolve(_EMPTY_REPORT);
