import { afterAll, describe, expect, setSystemTime, test } from 'bun:test';

type Resolved = { theme: string; until: number };

type Script = (...args: unknown[]) => void;

const _ZONE = Bun.env.TZ;

const _compile = (path: string) =>
  Bun.file(`${import.meta.dir}/${path}`)
    .text()
    .then(
      (code) =>
        new Function(
          'window',
          'document',
          'localStorage',
          'setTimeout',
          code
        ) as Script
    );

const _SHELL = await _compile('../../../static/js/shell-init.js');
const _PROXY = await _compile('../../../../proxy/assets/js/theme.js');

const _run = (script: Script, stored: string | null = null) => {
  const dataset: Record<string, string> = {};
  const window: { __asTheme?: (now?: number) => Resolved } = {};
  script(
    window,
    {
      documentElement: { dataset },
      querySelector: () => null,
      addEventListener: () => undefined,
    },
    { getItem: () => stored },
    () => 0
  );
  return { theme: dataset.theme, resolve: window.__asTheme };
};

const _at = (zone: string, local: string) => (
  (Bun.env.TZ = zone), setSystemTime(new Date(local)), Date.now()
);

const _clock = (time: number) =>
  ((date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`)(
    new Date(time)
  );

afterAll(() => {
  setSystemTime();
  Bun.env.TZ = _ZONE;
});

describe('тема по времени', () => {
  test('Берлин: летом день до заката ~21:20, зимой ночь с ~15:50 до ~08:10', () => {
    _at('Europe/Berlin', '2026-06-21T12:00:00');
    const summer = _run(_SHELL);
    expect(summer.theme).toBe('light');
    expect(_clock(summer.resolve!().until)).toMatch(/^21:[0-5]\d$/);

    _at('Europe/Berlin', '2026-12-21T16:30:00');
    const evening = _run(_SHELL).resolve!();
    expect(evening.theme).toBe('dark');
    expect(new Date(evening.until).getDate()).toBe(22);
    expect(_clock(evening.until)).toMatch(/^08:[0-2]\d$/);

    _at('Europe/Berlin', '2026-12-21T07:30:00');
    const morning = _run(_SHELL).resolve!();
    expect(morning.theme).toBe('dark');
    expect(new Date(morning.until).getDate()).toBe(21);
    expect(_clock(_run(_SHELL).resolve!(morning.until).until)).toMatch(
      /^15:[4-5]\d$/
    );
  });

  test('переход на летнее время сдвигает закат на час', () => {
    _at('Europe/Berlin', '2026-03-28T12:00:00');
    const before = _clock(_run(_SHELL).resolve!().until);
    _at('Europe/Berlin', '2026-03-29T12:00:00');
    const after = _clock(_run(_SHELL).resolve!().until);
    expect(before).toMatch(/^18:/);
    expect(after).toMatch(/^19:/);
  });

  test('выбор держится до ближайшего восхода или заката, старый формат — по времени', () => {
    const noon = _at('Europe/Berlin', '2026-06-21T12:00:00');
    const until = _run(_SHELL).resolve!().until;
    expect(_run(_SHELL, `dark@${until}`).theme).toBe('dark');
    expect(_run(_SHELL, `dark@${until}`).resolve!().until).toBe(until);
    expect(_run(_SHELL, `dark@${noon - 1}`).theme).toBe('light');
    expect(_run(_SHELL, 'dark').theme).toBe('light');
    expect(_run(_SHELL, `dusk@${until}`).theme).toBe('light');
  });

  test('страницы прокси считают тему так же, как сайт', () => {
    const zones = ['Europe/Berlin', 'Europe/Moscow', 'Asia/Almaty'];
    const start = new Date('2026-01-01T00:20:00Z').getTime();
    const differ = zones.flatMap((zone) =>
      Array.from({ length: 365 * 8 }, (_, step) => start + step * 3 * 36e5)
        .map(
          (time) => (
            (Bun.env.TZ = zone),
            setSystemTime(new Date(time)),
            { zone, time, shell: _run(_SHELL).theme, proxy: _run(_PROXY).theme }
          )
        )
        .filter(({ shell, proxy }) => shell !== proxy)
    );
    expect(differ).toEqual([]);
  });
});
