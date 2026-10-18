import { describe, expect, mock, test } from 'bun:test';

['github', 'linkedin', 'phone', 'telegram'].forEach(
  (name) =>
    void mock.module(`/i/${name}.svg?raw`, () => ({ default: '<svg/>' }))
);

var { cuboid, hull, lathe, perspective, shadowOf } = await import(
  '$lib/components/@Viewer/Scene/sketches/figures'
);
var { line } = await import('$lib/components/@Viewer/Scene/sketches/pencil');

var _view = perspective({
  eye: [30, 40, 60],
  target: [0, 0, 0],
  zoom: 100,
  at: [50, 50],
});

describe('наброски: проекция и фигуры', () => {
  test('цель взгляда проецируется в точку привязки', () => {
    const { 0: x, 1: y } = _view.project([0, 0, 0]);
    expect(x).toBeCloseTo(50, 6);
    expect(y).toBeCloseTo(50, 6);
  });

  test('выше — значит выше на странице', () => {
    expect(_view.project([0, 10, 0])[1]).toBeLessThan(
      _view.project([0, 0, 0])[1]
    );
  });

  test('выпуклая оболочка отбрасывает внутренние точки', () => {
    const outline = hull([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [5, 5],
      [2, 7],
    ]);
    expect(outline).toHaveLength(4);
    expect(outline).not.toContainEqual([5, 5]);
  });

  test('коробка сверху-сбоку: три грани видны, девять рёбер видимы, три скрыты', () => {
    const figure = cuboid(_view, { at: [0, 0, 0], size: [10, 6, 8], seed: 1 });
    expect(figure.faces).toHaveLength(3);
    expect(figure.lines).toHaveLength(9);
    expect(figure.hidden).toHaveLength(3);
    expect(figure.faces.map(({ normal }) => normal[1])).toContain(1);
  });

  test('тело вращения: два силуэта, у нижнего кольца есть скрытая задняя дуга', () => {
    const figure = lathe(_view, {
      base: [0, 0, 0],
      profile: [
        [3, 0],
        [3.4, 9],
      ],
      rims: [1],
      rings: [0],
      seed: 2,
    });
    expect(figure.lines.length).toBe(4);
    expect(figure.hidden.length).toBeGreaterThan(0);
    expect(figure.area.length).toBeGreaterThan(4);
  });

  test('тень ложится на стол и уходит от света', () => {
    const light: [number, number, number] = [0.5, 0.7, 0.5];
    const { 0: shadow } = shadowOf([[0, 10, 0]], light);
    expect(shadow![1]).toBeCloseTo(0, 9);
    expect(shadow![0]).toBeLessThan(0);
    expect(shadow![2]).toBeLessThan(0);
  });

  test('штрих от руки начинается и кончается рядом с заданными точками', () => {
    const stroke = line([10, 10], [40, 12], 7);
    const { 0: first } = stroke;
    const last = stroke.at(-1)!;
    expect(Math.hypot(first![0] - 10, first![1] - 10)).toBeLessThan(1.2);
    expect(Math.hypot(last[0] - 40, last[1] - 12)).toBeLessThan(1.2);
  });
});
