import { describe, expect, test } from 'bun:test';
import {
  AMBIENCE,
  contact,
  createMotion,
  crossed,
  dB,
  distanceGain,
  GRAIN_RATE,
  grainCount,
  panOf,
  planeVoice,
  rustleActivity,
} from '$lib/components/@UX/Sound/cues';

describe('уровни и панорама', () => {
  test('dB → множитель', () => {
    expect(dB(0)).toBe(1);
    expect(dB(-20)).toBeCloseTo(0.1, 6);
    expect(dB(-6)).toBeCloseTo(0.501, 3);
  });

  test('панорама не уходит в крайние каналы', () => {
    expect(panOf(0)).toBe(0);
    expect(panOf(0.5)).toBeCloseTo(0.375, 6);
    expect(panOf(4)).toBe(0.8);
    expect(panOf(-4)).toBe(-0.8);
  });

  test('ближе — громче, в пределах', () => {
    expect(distanceGain(55)).toBeCloseTo(1, 6);
    expect(distanceGain(20)).toBe(1.35);
    expect(distanceGain(500)).toBe(0.55);
    expect(distanceGain(0)).toBe(1.35);
  });

  test('ночью фон тише и глуше', () => {
    expect(AMBIENCE.night.bed).toBeLessThan(AMBIENCE.day.bed);
    expect(AMBIENCE.night.lowpass).toBeLessThan(AMBIENCE.day.lowpass);
    expect(AMBIENCE.night.air).toBe(0);
  });
});

describe('пересечение порога', () => {
  test('вверх, вниз, мимо', () => {
    expect(crossed(0.5, 0.6, 0.58)).toBe(1);
    expect(crossed(0.6, 0.5, 0.58)).toBe(-1);
    expect(crossed(0.58, 0.58, 0.58)).toBe(0);
    expect(crossed(0.1, 0.2, 0.58)).toBe(0);
    expect(crossed(0.57, 0.58, 0.58)).toBe(1);
  });
});

describe('детектор движения', () => {
  const run = (speeds: number[], delta = 1 / 60) =>
    ((motion) => speeds.map((speed) => motion.step(speed, delta)))(
      createMotion({ start: 6, stop: 1.2, peak: 10, settle: 0.08 })
    );

  test('старт и остановка после разгона', () => {
    const events = run([0, 2, 8, 20, 30, 12, 3, 0.5, 0.3, 0.2, 0.1, 0, 0]);
    expect(events.filter(Boolean)).toEqual(['start', 'stop']);
    expect(events.indexOf('start')).toBe(2);
  });

  test('остановка — только когда стоит дольше settle', () => {
    const events = run([10, 20, 0.5, 15, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(events.filter(Boolean)).toEqual(['start', 'stop']);
    expect(events.lastIndexOf('stop')).toBe(8);
  });

  test('без разгона до peak — без «удара»', () => {
    const events = run([7, 8, 0, 0, 0, 0, 0, 0]);
    expect(events.filter(Boolean)).toEqual(['start']);
  });

  test('сброс забывает движение', () => {
    const motion = createMotion({
      start: 6,
      stop: 1.2,
      peak: 10,
      settle: 0.08,
    });
    expect(motion.step(20, 0.016)).toBe('start');
    expect(motion.moving).toBe(true);
    expect(motion.reset()).toBeNull();
    expect(motion.moving).toBe(false);
    expect(motion.step(0, 0.5)).toBeNull();
  });
});

describe('голос самолётика', () => {
  test('на месте — тишина', () => {
    expect(planeVoice(0).gain).toBe(0);
    expect(planeVoice(3).gain).toBe(0);
  });

  test('быстрее — громче и выше', () => {
    const slow = planeVoice(20);
    const fast = planeVoice(80);
    expect(fast.gain).toBeGreaterThan(slow.gain);
    expect(fast.frequency).toBeGreaterThan(slow.frequency);
    expect(fast.flutter).toBeGreaterThan(slow.flutter);
    expect(planeVoice(500).gain).toBeCloseTo(dB(-26), 6);
  });
});

describe('шорох', () => {
  test('активность — доля полной скорости, по модулю', () => {
    expect(rustleActivity(0.6, 1.2)).toBeCloseTo(0.5, 6);
    expect(rustleActivity(-0.6, 1.2)).toBeCloseTo(0.5, 6);
    expect(rustleActivity(5, 1.2)).toBe(1);
  });

  test('число зёрен — в среднем активность × частота × время', () => {
    const delta = 1 / 60;
    const counts = Array.from({ length: 1000 }, (_, i) =>
      grainCount(0.5, delta, (i + 0.5) / 1000)
    );
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    expect(mean).toBeCloseTo(0.5 * GRAIN_RATE * delta, 2);
    expect(grainCount(0, delta, 0)).toBe(0);
  });
});

describe('касания по ходу переноса', () => {
  test('ушёл с места и пришёл на место подачи', () => {
    expect(contact(0, 0.01)).toEqual({ event: 'lift', home: true });
    expect(contact(0.98, 1)).toEqual({ event: 'land', home: false });
  });

  test('ушёл с места подачи и вернулся домой', () => {
    expect(contact(1, 0.98)).toEqual({ event: 'lift', home: false });
    expect(contact(0.01, 0)).toEqual({ event: 'land', home: true });
  });

  test('в пути и на месте — без событий', () => {
    expect(contact(0.3, 0.4)).toBeNull();
    expect(contact(0, 0)).toBeNull();
    expect(contact(1, 1)).toBeNull();
  });

  test('скачок через весь ход — касание на месте подачи', () => {
    expect(contact(0, 1)).toEqual({ event: 'land', home: false });
    expect(contact(1, 0)).toEqual({ event: 'land', home: true });
  });
});
