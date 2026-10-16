import PocketBase from 'pocketbase';
import { delay, log } from '$lib/common/utils';
import { SERVER_ENV } from './env';

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_TIMEOUT = 3e3;
const REQUEST_TIMEOUT = 5e3;

const _deadline = (signal?: AbortSignal | null): AbortSignal =>
  signal
    ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT)])
    : AbortSignal.timeout(REQUEST_TIMEOUT);

const _client = (): PocketBase =>
  Object.assign(new PocketBase(SERVER_ENV.pocketBase), {
    beforeSend: (url: string, options: { signal?: AbortSignal | null }) => ({
      url,
      options: { ...options, signal: _deadline(options.signal) },
    }),
  });

const _isBunTest = (): boolean =>
  Boolean((globalThis as { __AS_BUN_TEST__?: boolean }).__AS_BUN_TEST__);

const _connect = (attempt: number): Promise<void> =>
  fetch(`${SERVER_ENV.pocketBase}/api/health`, { signal: _deadline() }).then(
    () => log.info('CMS: connected'),
    () =>
      attempt >= MAX_RECONNECT_ATTEMPTS
        ? log.error('CMS: unavailable')
        : (log.warning(`CMS: retry ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS}`),
          delay(RECONNECT_TIMEOUT).then(() => _connect(attempt + 1)))
  );

export default _isBunTest()
  ? (null as unknown as PocketBase)
  : (void _connect(0), _client());
