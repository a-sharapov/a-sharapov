import type { Repo } from '../repo';
import { isAuthorized } from './auth';
import type { Notify } from './notify';
import type { TelegramState } from './polling';
import { log as defaultLog, errorMessage, type Log, pipe } from './utils';

type Route = (request: Request) => Promise<Response>;

type ApiDeps = {
  repo: Repo;
  notify: Notify;
  token: string;
  telegram?: () => TelegramState;
  log?: Log;
};

var _json = (status: number, body: Record<string, unknown>): Response =>
  Response.json(body, { status });

var _ok = (extra: Record<string, unknown> = {}): Response =>
  _json(200, { ok: true, ...extra });

var _error = (status: number, error: string) => (): Response =>
  _json(status, { ok: false, error });

var _unauthorized = _error(401, 'unauthorized');
var _invalidBody = _error(400, 'invalid_body');
var _notFound = _error(404, 'not_found');
var _internal = _error(500, 'internal');

var _readJson = (request: Request): Promise<unknown> =>
  request.json().then(
    (_) => _,
    () => null
  );

var _stringField =
  (key: string) =>
  (body: unknown): string | null =>
    ((value) => (typeof value === 'string' && value.trim() ? value : null))(
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)[key]
        : null
    );

var _routeKey = (request: Request): string =>
  `${request.method} ${new URL(request.url).pathname}`;

export var defineApi = ({
  repo,
  notify,
  token,
  telegram = () => 'disabled',
  log = defaultLog,
}: ApiDeps) => {
  const _guard =
    (route: Route): Route =>
    (request) =>
      isAuthorized(request, token)
        ? route(request)
        : Promise.resolve(_unauthorized());

  const _withField =
    (key: string, apply: (value: string) => Response): Route =>
    (request) =>
      _readJson(request).then(
        pipe(_stringField(key), (_: string | null) =>
          _ === null ? _invalidBody() : apply(_)
        )
      );

  const _sendMessage = (message: string): Response => (
    repo.messages.add(message),
    log(`POST /sendMessage: stored, length=${message.length}`),
    void Promise.resolve(message)
      .then(notify)
      .then(
        (_) => log(`delivered: sent=${_.sent} failed=${_.failed}`),
        (error: unknown) => log('delivery failed:', errorMessage(error))
      ),
    _ok()
  );

  const _unsubscribe = (username: string): Response =>
    ((removed) => (
      log(`DELETE /user: @${username} removed=${removed}`), _ok({ removed })
    ))(repo.chats.removeByUsername(username.trim().replace(/^@/, '')));

  const routes: Record<string, Route> = {
    'GET /health': () => Promise.resolve(_ok({ telegram: telegram() })),
    'POST /sendMessage': _guard(_withField('message', _sendMessage)),
    'DELETE /user': _guard(_withField('username', _unsubscribe)),
    _: () => Promise.resolve(_notFound()),
  };

  const _catch = (error: unknown): Response => (
    log('request failed:', errorMessage(error)), _internal()
  );

  return {
    endpoints: Object.keys(routes).filter((_) => _ !== '_'),
    fetch: (request: Request): Promise<Response> =>
      Promise.resolve(request)
        .then((_) => (routes[_routeKey(_)] ?? routes._)(_))
        .then(undefined, _catch),
  };
};

export type Api = ReturnType<typeof defineApi>;
