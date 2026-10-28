import type { Telegraf } from 'telegraf';
import { POLL_DEADLINE, POLLING_RETRY } from './constants';
import { log as defaultLog, errorMessage, type Log } from './utils';

export type PollingState = 'starting' | 'polling' | 'retrying' | 'stopped';

export type TelegramState = PollingState | 'disabled';

type Retry = typeof POLLING_RETRY;

type Schedule = (run: () => void, ms: number) => () => void;

type PollingDeps = {
  launch: (onStarted: () => void) => Promise<unknown>;
  retry?: Retry;
  log?: Log;
  now?: () => number;
  schedule?: Schedule;
};

var _cancel = (timer: ReturnType<typeof setTimeout>) => (): void =>
  clearTimeout(timer);

var _schedule: Schedule = (run, ms) => _cancel(setTimeout(run, ms));

var _expiring = (ms: number) =>
  ((deferred) => ({
    expired: deferred.promise,
    cancel: _cancel(
      setTimeout(
        () =>
          deferred.reject(
            new Error(`getUpdates got no reply in ${ms / 1000} s`)
          ),
        ms
      )
    ),
  }))(Promise.withResolvers<never>());

var _within = <T>(work: Promise<T>, ms: number): Promise<T> =>
  ((deadline) =>
    Promise.race([work, deadline.expired]).finally(deadline.cancel))(
    _expiring(ms)
  );

export var limitPolls = (bot: Telegraf, ms = POLL_DEADLINE): Telegraf =>
  ((callApi) => (
    (bot.telegram.callApi = ((method, payload, options) =>
      ((work) => (method === 'getUpdates' ? _within(work, ms) : work))(
        callApi(method, payload, options)
      )) as typeof callApi),
    bot
  ))(bot.telegram.callApi.bind(bot.telegram));

export var definePolling = ({
  launch,
  retry = POLLING_RETRY,
  log = defaultLog,
  now = Date.now,
  schedule = _schedule,
}: PollingDeps) => {
  let state: PollingState = 'stopped';
  let delay = retry.first;
  let since = 0;
  let cancel = (): void => undefined;

  const _started = (): void => (
    (state = 'polling'), log('telegram polling started')
  );

  const _retry = (reason: string): void =>
    ((wait) => (
      (state = 'retrying'),
      (delay = Math.min(wait * 2, retry.max)),
      log(`telegram polling stopped: ${reason}; retry in ${wait / 1000} s`),
      void (cancel = schedule(_run, wait))
    ))(now() - since >= retry.steady ? retry.first : delay);

  const _unlessStopped = (reason: string): void =>
    void (state === 'stopped' || _retry(reason));

  const _run = (): void => (
    (state = 'starting'),
    (since = now()),
    void launch(_started).then(
      () => _unlessStopped('ended'),
      (error: unknown) => _unlessStopped(errorMessage(error))
    )
  );

  return {
    start: _run,
    stop: (): void => ((state = 'stopped'), cancel()),
    state: (): PollingState => state,
  };
};

export type Polling = ReturnType<typeof definePolling>;
