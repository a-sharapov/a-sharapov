import { describe, expect, test } from 'bun:test';
import type PocketBase from 'pocketbase';
import {
  defineInquiryService,
  formatInquiry,
  isSpam,
  parseInquiry,
} from '#lib/services/inquiry.ts';
import { defineNotifyService } from '#lib/services/notify.ts';

const _form = (fields: Record<string, string>) =>
  Object.entries(fields).reduce(
    (form, { 0: key, 1: value }) => (form.set(key, value), form),
    new FormData()
  );

const _pb = (create: () => Promise<unknown>) =>
  ({ collection: () => ({ create }) }) as unknown as PocketBase;

describe('inquiry', () => {
  test('parseInquiry: обрезка, лимиты, неизвестная локаль → ru', () => {
    const input = parseInquiry(
      _form({ contact: '  @me  ', message: 'x'.repeat(5000), locale: 'de' })
    );
    expect(input.contact).toBe('@me');
    expect(input.message.length).toBe(4000);
    expect(input.locale).toBe('ru');
  });

  test('parseInquiry: согласие — только при terms=yes', () => {
    expect(parseInquiry(_form({ terms: 'yes' })).consent).toBe(true);
    expect(parseInquiry(_form({ terms: 'on' })).consent).toBe(false);
    expect(parseInquiry(_form({})).consent).toBe(false);
  });

  test('submit: без согласия заявка отклоняется без обращений к CMS и боту', async () => {
    let calls = 0;
    const service = defineInquiryService(
      _pb(() => (calls++, Promise.resolve({}))),
      { send: () => (calls++, Promise.resolve({ ok: true })) }
    );
    expect(
      await service.submit(parseInquiry(_form({ contact: 'a', message: 'b' })))
    ).toEqual({
      ok: false,
      error: 'invalid_input',
    });
    expect(calls).toBe(0);
  });

  test('isSpam по скрытому полю', () => {
    expect(isSpam(_form({ website: 'http://spam' }))).toBe(true);
    expect(isSpam(_form({ contact: 'a' }))).toBe(false);
  });

  test('submit: пустая заявка отклоняется без обращений', async () => {
    const service = defineInquiryService(
      _pb(() => Promise.reject(new Error('no'))),
      {
        send: () => Promise.reject(new Error('no')),
      }
    );
    expect(await service.submit(parseInquiry(_form({})))).toEqual({
      ok: false,
      error: 'invalid_input',
    });
  });

  test('submit: успех, если сохранила хотя бы CMS или бот', async () => {
    const input = parseInquiry(
      _form({ contact: 'a', message: 'b', terms: 'yes' })
    );
    const saved = defineInquiryService(
      _pb(() => Promise.resolve({})),
      {
        send: () => Promise.resolve({ ok: false, error: 'down' }),
      }
    );
    const notified = defineInquiryService(
      _pb(() => Promise.reject(new Error('down'))),
      {
        send: () => Promise.resolve({ ok: true }),
      }
    );
    const lost = defineInquiryService(
      _pb(() => Promise.reject(new Error('down'))),
      {
        send: () => Promise.resolve({ ok: false }),
      }
    );
    expect(await saved.submit(input)).toEqual({ ok: true });
    expect(await notified.submit(input)).toEqual({ ok: true });
    expect(await lost.submit(input)).toEqual({
      ok: false,
      error: 'delivery_failed',
    });
  });

  test('formatInquiry содержит контакт и сообщение', () => {
    const text = formatInquiry(
      parseInquiry(
        _form({ topic: 'Вопрос', contact: '@me', message: 'Привет' })
      )
    );
    expect(text).toContain('@me');
    expect(text).toContain('Привет');
    expect(text).toContain('Вопрос');
  });
});

describe('notify', () => {
  test('шлёт Bearer-токен и разбирает ответ бота', async () => {
    let auth = '';
    const service = defineNotifyService('http://bot', 'secret', ((
      _url: string,
      init: RequestInit
    ) => {
      auth = String((init.headers as Record<string, string>).Authorization);
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );
    }) as typeof fetch);
    expect(await service.send('hi')).toEqual({ ok: true });
    expect(auth).toBe('Bearer secret');
  });

  test('401 и сетевой отказ → ok: false', async () => {
    const denied = defineNotifyService('http://bot', 'x', (() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
        })
      )) as never);
    const offline = defineNotifyService('http://bot', 'x', (() =>
      Promise.reject(new Error('net'))) as never);
    expect(await denied.send('hi')).toEqual({
      ok: false,
      error: 'unauthorized',
    });
    expect((await offline.send('hi')).ok).toBe(false);
  });
});
