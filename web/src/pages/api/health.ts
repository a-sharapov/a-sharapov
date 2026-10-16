import type { APIRoute } from 'astro';
import { SERVER_ENV } from '$lib/services/env';

var _TIMEOUT = 3e3;

const _respond = (ok: boolean) =>
  new Response(JSON.stringify({ ok, cms: ok }), {
    status: ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export var GET: APIRoute = () =>
  fetch(`${SERVER_ENV.pocketBase}/api/health`, {
    signal: AbortSignal.timeout(_TIMEOUT),
  })
    .then(
      ($) => $.ok,
      () => false
    )
    .then(_respond);
