import { INQUIRY_API_URL } from '$lib/common/constants';
import { pipe } from '$lib/common/utils';

export type InquiryResponse = { ok: boolean; error?: string };

const _parseJson = (response: Response): Promise<InquiryResponse> =>
  response.json();

const _passOk = ($: InquiryResponse): Promise<InquiryResponse> =>
  $.ok ? Promise.resolve($) : Promise.reject(new Error($.error ?? 'failed'));

const _handle = pipe<Response, Promise<InquiryResponse>>(_parseJson, _passOk);

const _catch = (): Promise<never> =>
  Promise.reject(new Error('inquiry_failed'));

export var sendInquiry = (
  form: FormData,
  signal?: AbortSignal
): Promise<InquiryResponse> =>
  fetch(INQUIRY_API_URL, { method: 'POST', body: form, signal }).then(
    _handle,
    _catch
  );
