import { createHash, timingSafeEqual } from 'node:crypto';

var _BEARER = /^Bearer\s+(.+)$/i;

export var extractBearerToken = (request: Request): string =>
  (request.headers.get('authorization') ?? '').match(_BEARER)?.[1]?.trim() ??
  '';

var _digest = (value: string): Buffer =>
  createHash('sha256').update(value).digest();

export var tokensMatch = (presented: string, expected: string): boolean =>
  timingSafeEqual(_digest(presented), _digest(expected)) &&
  presented.length > 0 &&
  expected.length > 0;

export var isAuthorized = (request: Request, token: string): boolean =>
  tokensMatch(extractBearerToken(request), token);
