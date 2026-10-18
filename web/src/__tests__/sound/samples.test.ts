import { describe, expect, test } from 'bun:test';
import {
  type Bank,
  jitter,
  jitterGain,
  leadOffset,
  loadBank,
  pickClip,
  SAMPLE_CUES,
  SAMPLE_FILES,
  type SampleName,
} from '#lib/components/@UX/Sound/samples.ts';
import { CUES } from '#lib/components/@UX/Sound/voices.ts';

const SOUNDS = new URL('../../../static/sounds/', import.meta.url);
const FILES = Object.values(SAMPLE_FILES).flat();

describe('файлы звуков', () => {
  test('каждый файл манифеста лежит в static/sounds', () => {
    FILES.forEach(
      (file) =>
        void expect(
          Bun.file(new URL(`${file}.mp3`, SOUNDS)).size
        ).toBeGreaterThan(1000)
    );
  });

  test('в папке нет лишних mp3', () => {
    const present = [...new Bun.Glob('*.mp3').scanSync(SOUNDS.pathname)];
    expect(present.sort()).toEqual(FILES.map((file) => `${file}.mp3`).sort());
  });

  test('у каждого файла есть источник и лицензия', async () => {
    const licenses = await Bun.file(new URL('LICENSES.md', SOUNDS)).text();
    FILES.forEach(
      (file) =>
        void expect(licenses).toMatch(
          new RegExp(`\\| ${file}\\.mp3 \\|[^\\n]+\\| CC0 1\\.0 \\|`)
        )
    );
  });

  test('вес — меньше 400 КБ', () => {
    const total = FILES.reduce(
      (sum, file) => sum + Bun.file(new URL(`${file}.mp3`, SOUNDS)).size,
      0
    );
    expect(total).toBeLessThan(400 * 1024);
  });

  test('события ссылаются на существующие звуки и голоса', () => {
    Object.entries(SAMPLE_CUES).forEach(({ 0: cue, 1: spec }) => {
      expect(CUES).toContain(cue as never);
      expect(SAMPLE_FILES[spec!.sample].length).toBeGreaterThan(0);
      expect(spec!.level).toBeGreaterThan(0);
      expect(spec!.level).toBeLessThan(0.2);
    });
  });
});

describe('подготовка клипа', () => {
  test('тишина в начале срезается, атака — за 2 мс до удара', () => {
    const data = new Float32Array(48000);
    data[4800] = 0.5;
    data[4801] = -0.4;
    expect(leadOffset(data, 48000)).toBeCloseTo(0.098, 6);
  });

  test('без тишины — с начала', () => {
    const data = Float32Array.from({ length: 100 }, (_, i) => Math.sin(i));
    expect(leadOffset(data, 48000)).toBe(0);
    expect(leadOffset(new Float32Array(10), 48000)).toBe(0);
  });

  test('вариант и разброс', () => {
    const clips = [1, 2, 3].map((n) => ({ buffer: { n } as never, offset: 0 }));
    expect(pickClip(clips, 0)).toBe(clips[0]!);
    expect(pickClip(clips, 0.5)).toBe(clips[1]!);
    expect(pickClip(clips, 0.9999)).toBe(clips[2]!);
    expect(jitter(0, 0.06)).toBeCloseTo(0.97, 6);
    expect(jitter(1, 0.06)).toBeCloseTo(1.03, 6);
    expect(jitterGain(0.5)).toBe(1);
    expect(jitterGain(0)).toBeCloseTo(10 ** (-1.5 / 20), 6);
  });
});

describe('загрузка', () => {
  test('недоступный файл не ломает банк — для него остаётся синтез', async () => {
    const requested: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((url: string) => (
      requested.push(url),
      Promise.resolve(
        url.includes('strap')
          ? new Response(null, { status: 404 })
          : new Response(new ArrayBuffer(8))
      )
    )) as typeof fetch;
    const ctx = {
      decodeAudioData: () =>
        Promise.resolve({
          sampleRate: 48000,
          getChannelData: () => new Float32Array([0, 0, 0.5]),
        }),
    } as unknown as BaseAudioContext;
    const bank: Bank = new Map();
    await loadBank(ctx, bank, '/sounds');
    globalThis.fetch = original;
    expect(requested).toHaveLength(FILES.length);
    expect(requested.every((url) => url.startsWith('/sounds/'))).toBe(true);
    expect(bank.has('strap')).toBe(false);
    expect(bank.get('clink')).toHaveLength(3);
    expect(bank.get('room')![0]!.offset).toBe(0);
    expect(
      (Object.keys(SAMPLE_FILES) as SampleName[]).filter(
        (name) => !bank.has(name)
      )
    ).toEqual(['strap']);
  });
});
