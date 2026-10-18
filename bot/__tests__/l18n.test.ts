import { describe, expect, it } from 'bun:test';
import { LOCALES, resolveLocale, selectDictionary } from '../l18n';

describe('выбор словаря по language_code', () => {
  it('ru и en — свои словари', () => {
    expect(selectDictionary('ru')).toBe(LOCALES.ru);
    expect(selectDictionary('en')).toBe(LOCALES.en);
  });

  it('региональный тег сводится к языку', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('EN-gb')).toBe('en');
    expect(resolveLocale('ru-RU')).toBe('ru');
  });

  it('неизвестный или пустой язык — ru по умолчанию', () => {
    expect(resolveLocale('de')).toBe('ru');
    expect(resolveLocale('')).toBe('ru');
    expect(resolveLocale(undefined)).toBe('ru');
  });

  it('ключи Object.prototype не считаются языком', () => {
    expect(resolveLocale('constructor')).toBe('ru');
    expect(resolveLocale('__proto__')).toBe('ru');
  });

  it('словари с одинаковым набором ключей', () => {
    expect(Object.keys(LOCALES.en).toSorted()).toEqual(
      Object.keys(LOCALES.ru).toSorted()
    );
  });

  it('приветствие без имени не содержит «undefined»', () => {
    expect(LOCALES.ru.GREETING()).toStartWith('Привет!');
    expect(LOCALES.en.GREETING('Ann')).toStartWith('Hi, Ann!');
  });
});
