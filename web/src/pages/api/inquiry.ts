import type { APIRoute } from 'astro';
import { INQUIRY_SENT_QUERY } from '$lib/common/constants';
import inquiry, { isSpam, parseInquiry } from '$lib/services/inquiry';
import { clientKey, defineRateLimit } from '$lib/services/rate-limit';

type Result = { ok: boolean; error?: string };

var _limit = defineRateLimit({ window: 10 * 60 * 1000, perKey: 5, total: 60 });

const _json = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

const _STATUS: Record<string, number> = {
  invalid_input: 400,
  invalid_body: 400,
  forbidden: 403,
  rate_limited: 429,
  _: 502,
};

const _sameSite = (request: Request, site: URL | undefined, url: URL) =>
  ((origin) => origin !== null && [site?.origin, url.origin].includes(origin))(
    request.headers.get('origin')
  );

const _address = (request: Request, fallback: () => string) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || fallback();

const _back = (value: FormDataEntryValue | null | undefined) =>
  ((page) => (page.startsWith('/') && !page.startsWith('//') ? page : '/'))(
    String(value ?? '')
  );

const _respond = (request: Request, form: FormData | null) => ($: Result) =>
  $.ok && request.headers.get('accept')?.includes('text/html')
    ? new Response(null, {
        status: 303,
        headers: {
          Location: `${_back(form?.get('page'))}?${INQUIRY_SENT_QUERY}`,
        },
      })
    : _json($, $.ok ? 200 : (_STATUS[$.error ?? '_'] ?? _STATUS._));

export var GET: APIRoute = () =>
  _json({ ok: false, error: 'method_not_allowed' }, 405);

export var POST: APIRoute = ({ request, site, url, clientAddress }) =>
  !_sameSite(request, site, url)
    ? Promise.resolve(_json({ ok: false, error: 'forbidden' }, 403))
    : !_limit.allow(clientKey(_address(request, () => clientAddress)))
      ? Promise.resolve(
          _json({ ok: false, error: 'rate_limited' }, 429, {
            'Retry-After': '600',
          })
        )
      : request.formData().then(
          (form) =>
            (isSpam(form)
              ? Promise.resolve<Result>({ ok: true })
              : inquiry.submit(parseInquiry(form))
            ).then(_respond(request, form)),
          () => _respond(request, null)({ ok: false, error: 'invalid_body' })
        );
