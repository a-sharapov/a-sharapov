import { INQUIRY_SENT_QUERY, SITE_ORIGIN } from '#lib/common/constants.ts';
import inquiry, { isSpam, parseInquiry } from '#lib/services/inquiry.ts';
import { clientKey, defineRateLimit } from '#lib/services/rate-limit.ts';
import type { RequestHandler } from './$types';

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

const _sameSite = (request: Request, url: URL) =>
  ((origin) => origin !== null && [SITE_ORIGIN, url.origin].includes(origin))(
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

export var GET: RequestHandler = () =>
  _json({ ok: false, error: 'method_not_allowed' }, 405);

export var POST: RequestHandler = ({ request, url, getClientAddress }) =>
  !_sameSite(request, url)
    ? Promise.resolve(_json({ ok: false, error: 'forbidden' }, 403))
    : !_limit.allow(clientKey(_address(request, getClientAddress)))
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
