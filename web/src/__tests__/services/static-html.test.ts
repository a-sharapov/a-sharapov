import { describe, expect, test } from 'bun:test';
import { fillStatic, staticHtml } from '#lib/services/static-html.ts';

const _event = (isDataRequest: boolean) => ({
  isDataRequest,
  locals: { statics: [] as string[] },
});

describe('static-html', () => {
  test('страница с сервера: в данных метка, HTML — в разметке', () => {
    const event = _event(false);
    const mark = staticHtml(event, '<p>текст</p>');
    expect(mark).not.toContain('текст');
    expect(
      fillStatic(`<main><!---->${mark}<!----></main>`, event.locals.statics)
    ).toBe('<main><!----><p>текст</p><!----></main>');
  });

  test('переход в браузере: HTML приходит в данных', () => {
    const event = _event(true);
    expect(staticHtml(event, '<p>текст</p>')).toBe('<p>текст</p>');
    expect(event.locals.statics).toEqual([]);
  });

  test('пустой HTML — без метки, сериализованные данные не трогаются', () => {
    const event = _event(false);
    expect(staticHtml(event, '')).toBe('');
    const mark = staticHtml(event, '<p>$& и $1</p>');
    const json = `{"html":"${mark.replace('<', '\\u003C')}"}`;
    expect(fillStatic(`${mark}${json}`, event.locals.statics)).toBe(
      `<p>$& и $1</p>${json}`
    );
  });
});
