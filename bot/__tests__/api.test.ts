import { beforeEach, describe, expect, it } from 'bun:test';
import { defineApi } from '../assets/api';
import type { Notify } from '../assets/notify';
import { defineRepo, IN_MEMORY, openDatabase, type Repo } from '../repo';

var _TOKEN = 'service-secret';
var _URL = 'http://bot.local';

var _request = (
  method: string,
  path: string,
  { token, body }: { token?: string; body?: unknown } = {}
): Request =>
  new Request(`${_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
    },
    body:
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });

var _read = (response: Response) =>
  response.json().then((body) => ({ status: response.status, body }));

describe('HTTP API', () => {
  let repo: Repo;
  let notified: string[];
  let api: ReturnType<typeof defineApi>;

  const notify: Notify = (message) => (
    (notified = [...notified, message]), Promise.resolve({ sent: 1, failed: 0 })
  );

  beforeEach(() => {
    repo = defineRepo(openDatabase(IN_MEMORY));
    notified = [];
    api = defineApi({ repo, notify, token: _TOKEN, log: () => {} });
  });

  it('GET /health — 200 без авторизации', async () => {
    expect(await _read(await api.fetch(_request('GET', '/health')))).toEqual({
      status: 200,
      body: { ok: true, telegram: 'disabled' },
    });
  });

  it('GET /health — состояние пулинга, 200 и без него', async () => {
    const retrying = defineApi({
      repo,
      notify,
      token: _TOKEN,
      telegram: () => 'retrying',
      log: () => {},
    });
    expect(
      await _read(await retrying.fetch(_request('GET', '/health')))
    ).toEqual({ status: 200, body: { ok: true, telegram: 'retrying' } });
  });

  it('POST /sendMessage без токена — 401', async () => {
    const response = await api.fetch(
      _request('POST', '/sendMessage', { body: { message: 'hi' } })
    );
    expect(await _read(response)).toEqual({
      status: 401,
      body: { ok: false, error: 'unauthorized' },
    });
    expect(repo.messages.all()).toEqual([]);
  });

  it('POST /sendMessage с неверным токеном — 401', async () => {
    const response = await api.fetch(
      _request('POST', '/sendMessage', {
        token: 'wrong',
        body: { message: 'hi' },
      })
    );
    expect(response.status).toBe(401);
  });

  it('схема Authorization без Bearer — 401', async () => {
    const response = await api.fetch(
      new Request(`${_URL}/sendMessage`, {
        method: 'POST',
        headers: { Authorization: _TOKEN },
        body: JSON.stringify({ message: 'hi' }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('POST /sendMessage с токеном — 200, сохраняет и рассылает', async () => {
    const response = await api.fetch(
      _request('POST', '/sendMessage', {
        token: _TOKEN,
        body: { message: 'hello' },
      })
    );
    expect(await _read(response)).toEqual({ status: 200, body: { ok: true } });
    expect(repo.messages.all()).toEqual(['hello']);
    await Bun.sleep(0);
    expect(notified).toEqual(['hello']);
  });

  it('невалидное тело — 400', async () => {
    const bodies = [
      'not json',
      {},
      { message: '' },
      { message: '  ' },
      { message: 42 },
      [],
    ];
    const statuses = await Promise.all(
      bodies.map((body) =>
        api
          .fetch(_request('POST', '/sendMessage', { token: _TOKEN, body }))
          .then(_read)
      )
    );
    expect(statuses).toEqual(
      bodies.map(() => ({
        status: 400,
        body: { ok: false, error: 'invalid_body' },
      }))
    );
    expect(repo.messages.all()).toEqual([]);
    expect(notified).toEqual([]);
  });

  it('без тела — 400', async () => {
    const response = await api.fetch(
      _request('POST', '/sendMessage', { token: _TOKEN })
    );
    expect(response.status).toBe(400);
  });

  it('неавторизованный запрос с битым телом — 401, а не 400', async () => {
    const response = await api.fetch(
      _request('POST', '/sendMessage', { body: 'not json' })
    );
    expect(response.status).toBe(401);
  });

  it('DELETE /user — отписывает по username (без @, без учёта регистра)', async () => {
    repo.chats.add(1, 'Manager');
    repo.chats.add(2, 'other');
    const response = await api.fetch(
      _request('DELETE', '/user', {
        token: _TOKEN,
        body: { username: '@manager' },
      })
    );
    expect(await _read(response)).toEqual({
      status: 200,
      body: { ok: true, removed: 1 },
    });
    expect(repo.chats.ids()).toEqual([2]);
  });

  it('DELETE /user без токена — 401, подписка остаётся', async () => {
    repo.chats.add(1, 'manager');
    const response = await api.fetch(
      _request('DELETE', '/user', { body: { username: 'manager' } })
    );
    expect(response.status).toBe(401);
    expect(repo.chats.ids()).toEqual([1]);
  });

  it('неизвестный маршрут или метод — 404', async () => {
    const requests = [
      _request('GET', '/'),
      _request('GET', '/sendMessage', { token: _TOKEN }),
      _request('POST', '/health'),
      _request('GET', '/constructor'),
    ];
    const responses = await Promise.all(
      requests.map((_) => api.fetch(_).then(_read))
    );
    expect(responses).toEqual(
      requests.map(() => ({
        status: 404,
        body: { ok: false, error: 'not_found' },
      }))
    );
  });

  it('пустой BOT_SERVICE_TOKEN закрывает API', async () => {
    const closed = defineApi({ repo, notify, token: '', log: () => {} });
    const responses = await Promise.all(
      [undefined, '', 'anything'].map((token) =>
        closed
          .fetch(
            _request('POST', '/sendMessage', { token, body: { message: 'x' } })
          )
          .then((_) => _.status)
      )
    );
    expect(responses).toEqual([401, 401, 401]);
  });

  it('сбой хранилища — 500', async () => {
    const broken = {
      ...repo,
      messages: {
        ...repo.messages,
        add: () => {
          throw new Error('disk full');
        },
      },
    };
    const failing = defineApi({
      repo: broken,
      notify,
      token: _TOKEN,
      log: () => {},
    });
    const response = await failing.fetch(
      _request('POST', '/sendMessage', {
        token: _TOKEN,
        body: { message: 'x' },
      })
    );
    expect(await _read(response)).toEqual({
      status: 500,
      body: { ok: false, error: 'internal' },
    });
  });

  it('сбой рассылки не влияет на ответ', async () => {
    const rejecting = defineApi({
      repo,
      notify: () => Promise.reject(new Error('telegram down')),
      token: _TOKEN,
      log: () => {},
    });
    const response = await rejecting.fetch(
      _request('POST', '/sendMessage', {
        token: _TOKEN,
        body: { message: 'x' },
      })
    );
    expect(response.status).toBe(200);
    expect(repo.messages.all()).toEqual(['x']);
  });

  it('endpoints — для MOTD', () => {
    expect(api.endpoints).toEqual([
      'GET /health',
      'POST /sendMessage',
      'DELETE /user',
    ]);
  });
});
