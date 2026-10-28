import { beforeEach, describe, expect, it } from 'bun:test';
import type { Telegraf } from 'telegraf';
import { definePolling, limitPolls, type Polling } from '../assets/polling';

var _RETRY = { first: 1000, max: 4000, steady: 60_000 };

type Launch = {
  started: () => void;
  resolve: () => void;
  reject: (error: unknown) => void;
};

type Timer = { run: () => void; ms: number; cancelled: boolean };

var _settle = () => Bun.sleep(0);

describe('пулинг Telegram', () => {
  let clock: number;
  let launches: Launch[];
  let timers: Timer[];
  let logs: string[];
  let polling: Polling;

  const _last = (): Launch => launches.at(-1) as Launch;

  const _fail = (error: unknown): Promise<void> => (
    _last().reject(error), _settle()
  );

  const _retryFailing = (error: unknown): Promise<void> => (
    (timers.at(-1) as Timer).run(), _fail(error)
  );

  const _waits = (): number[] => timers.map((_) => _.ms);

  beforeEach(() => {
    clock = 0;
    launches = [];
    timers = [];
    logs = [];
    polling = definePolling({
      launch: (started) =>
        new Promise<void>((resolve, reject) => {
          launches = [...launches, { started, resolve, reject }];
        }),
      retry: _RETRY,
      log: (...parts) => void (logs = [...logs, parts.join(' ')]),
      now: () => clock,
      schedule: (run, ms) =>
        ((timer: Timer) => (
          (timers = [...timers, timer]), () => void (timer.cancelled = true)
        ))({ run, ms, cancelled: false }),
    });
  });

  it('запуск: starting, затем polling', () => {
    polling.start();
    expect(polling.state()).toBe('starting');
    _last().started();
    expect(polling.state()).toBe('polling');
    expect(logs).toEqual(['telegram polling started']);
  });

  it('ошибка пулинга — перезапуск с паузой, пауза растёт до предела', async () => {
    polling.start();
    await _fail(new Error('409: Conflict'));
    expect(polling.state()).toBe('retrying');
    expect(logs.at(-1)).toBe(
      'telegram polling stopped: 409: Conflict; retry in 1 s'
    );
    await [1, 2, 3, 4].reduce<Promise<void>>(
      (chain) => chain.then(() => _retryFailing(new TypeError('ECONNRESET'))),
      Promise.resolve()
    );
    expect(launches.length).toBe(5);
    expect(_waits()).toEqual([1000, 2000, 4000, 4000, 4000]);
  });

  it('пулинг закончился сам — тоже перезапуск', async () => {
    polling.start();
    _last().resolve();
    await _settle();
    expect(polling.state()).toBe('retrying');
    expect(_waits()).toEqual([1000]);
  });

  it('после долгой работы пауза снова короткая', async () => {
    polling.start();
    await _fail(new Error('a'));
    await _retryFailing(new Error('b'));
    (timers.at(-1) as Timer).run();
    clock += _RETRY.steady;
    await _fail(new Error('c'));
    expect(_waits()).toEqual([1000, 2000, 1000]);
  });

  it('остановка во время паузы отменяет перезапуск', async () => {
    polling.start();
    await _fail(new Error('a'));
    polling.stop();
    expect(polling.state()).toBe('stopped');
    expect(timers.map((_) => _.cancelled)).toEqual([true]);
  });

  it('остановленный пулинг не перезапускается', async () => {
    polling.start();
    _last().started();
    polling.stop();
    _last().resolve();
    await _settle();
    expect(polling.state()).toBe('stopped');
    expect(timers).toEqual([]);
    expect(launches.length).toBe(1);
  });
});

describe('срок ответа getUpdates', () => {
  const _bot = (reply: (method: string) => Promise<unknown>) =>
    limitPolls({ telegram: { callApi: reply } } as unknown as Telegraf, 20);

  const _call = (bot: Telegraf, method: string): Promise<unknown> =>
    (bot.telegram.callApi as (method: string) => Promise<unknown>)(method);

  const _outcome = (work: Promise<unknown>): Promise<unknown> =>
    Promise.race([
      work.then(
        (_) => ({ value: _ }),
        (error: Error) => ({ error: error.message })
      ),
      Bun.sleep(60).then(() => 'pending'),
    ]);

  it('getUpdates без ответа — отказ по сроку', async () => {
    const bot = _bot(() => new Promise(() => undefined));
    expect(await _outcome(_call(bot, 'getUpdates'))).toEqual({
      error: 'getUpdates got no reply in 0.02 s',
    });
  });

  it('ответ getUpdates проходит как есть', async () => {
    const bot = _bot(() => Promise.resolve([]));
    expect(await _outcome(_call(bot, 'getUpdates'))).toEqual({ value: [] });
  });

  it('другие методы срок не ограничивает', async () => {
    const bot = _bot(() => new Promise(() => undefined));
    expect(await _outcome(_call(bot, 'sendMessage'))).toBe('pending');
  });
});
