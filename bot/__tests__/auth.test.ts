import { describe, expect, it } from 'bun:test';
import { extractBearerToken, isAuthorized, tokensMatch } from '../assets/auth';
import { readConfig } from '../assets/config';

var _withAuth = (value: string): Request =>
  new Request('http://bot.local', { headers: { Authorization: value } });

describe('сервисный токен', () => {
  it('extractBearerToken читает Bearer без учёта регистра схемы', () => {
    expect(extractBearerToken(_withAuth('Bearer secret'))).toBe('secret');
    expect(extractBearerToken(_withAuth('bearer secret'))).toBe('secret');
    expect(extractBearerToken(_withAuth('Basic secret'))).toBe('');
    expect(extractBearerToken(new Request('http://bot.local'))).toBe('');
  });

  it('tokensMatch — совпадение; пустые и разная длина — нет', () => {
    expect(tokensMatch('secret', 'secret')).toBe(true);
    expect(tokensMatch('secret', 'secreT')).toBe(false);
    expect(tokensMatch('ab', 'abc')).toBe(false);
    expect(tokensMatch('', '')).toBe(false);
    expect(tokensMatch('x', '')).toBe(false);
  });

  it('isAuthorized — только с верным Bearer', () => {
    expect(isAuthorized(_withAuth('Bearer secret'), 'secret')).toBe(true);
    expect(isAuthorized(_withAuth('Bearer wrong'), 'secret')).toBe(false);
    expect(isAuthorized(_withAuth('Bearer secret'), '')).toBe(false);
  });
});

describe('readConfig', () => {
  it('дефолты без env', () => {
    expect(readConfig({})).toEqual({
      telegramToken: '',
      serviceToken: '',
      managerTokens: [],
      port: 5702,
      dbPath: './data/bot.db',
    });
  });

  it('ключи менеджеров через запятую, с пробелами и пустыми', () => {
    expect(
      readConfig({ TG_MANAGER_TOKEN: ' a, b ,,c ', TG_PORT: '5799' })
    ).toMatchObject({ managerTokens: ['a', 'b', 'c'], port: 5799 });
  });
});
