import { describe, expect, test } from 'bun:test';
import type { APIContext } from 'astro';
import { POST } from '$lib/pages/api/inquiry';

const _SITE = new URL('https://a-sharapov.com');

const _post = (
  headers: Record<string, string>,
  fields: Record<string, string> = {},
  address = '198.51.100.1'
) =>
  POST({
    request: new Request('http://web:5701/api/inquiry', {
      method: 'POST',
      headers: { 'x-forwarded-for': address, ...headers },
      body: Object.entries(fields).reduce(
        (form, { 0: key, 1: value }) => (form.set(key, value), form),
        new FormData()
      ),
    }),
    site: _SITE,
    url: new URL('http://web:5701/api/inquiry'),
    clientAddress: '10.0.0.2',
  } as unknown as APIContext) as Promise<Response>;

describe('api/inquiry', () => {
  test('без Origin и с чужим Origin — 403', async () => {
    expect((await _post({})).status).toBe(403);
    expect((await _post({ origin: 'https://evil.example' })).status).toBe(403);
  });

  test('свой Origin, но без согласия — 400', async () => {
    const response = await _post(
      { origin: _SITE.origin },
      { contact: 'a', message: 'b' },
      '198.51.100.2'
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'invalid_input',
    });
  });

  test('скрытое поле заполнено — тихий успех без сохранения', async () => {
    expect(
      (
        await _post(
          { origin: _SITE.origin },
          { website: 'spam' },
          '198.51.100.3'
        )
      ).status
    ).toBe(200);
  });

  test('отправка обычной формой (без JS) — 303 обратно на страницу с отметкой', async () => {
    const response = await _post(
      { origin: _SITE.origin, accept: 'text/html,*/*' },
      { website: 'spam', page: '/ru/contacts' },
      '198.51.100.4'
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/ru/contacts?sent');
  });

  test('чужой адрес возврата не принимается', async () => {
    const response = await _post(
      { origin: _SITE.origin, accept: 'text/html' },
      { website: 'spam', page: '//evil.example' },
      '198.51.100.5'
    );
    expect(response.headers.get('location')).toBe('/?sent');
  });

  test('после пяти заявок с одного адреса — 429', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push(
        (
          await _post(
            { origin: _SITE.origin },
            { website: 'x' },
            '198.51.100.9'
          )
        ).status
      );
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
