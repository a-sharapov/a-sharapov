import { pipe } from '$lib/common/utils';
import { SERVER_ENV } from './env';

var _ENDPOINT = '/sendMessage' as const;

export type NotifyResult = { ok: boolean; error?: string };

export var defineNotifyService = (
  baseUrl: string,
  token: string | undefined,
  request: typeof fetch = fetch
) => {
  const _parseJson = (response: Response) =>
    response
      .json()
      .then(($: NotifyResult) => ({ ...$, ok: response.ok && $.ok }));

  const _passOk = ($: NotifyResult): Promise<NotifyResult> =>
    $.ok
      ? Promise.resolve($)
      : Promise.reject(new Error($.error ?? 'notify_failed'));

  const _handle = pipe(_parseJson, _passOk);

  const _catch = (error: unknown): NotifyResult => ({
    ok: false,
    error: error instanceof Error ? error.message : 'notify_failed',
  });

  return {
    send: (message: string): Promise<NotifyResult> =>
      request(`${baseUrl}${_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(5e3),
      })
        .then(_handle)
        .then(undefined, _catch),
  };
};

export default defineNotifyService(
  SERVER_ENV.bot,
  SERVER_ENV.botToken || undefined
);
