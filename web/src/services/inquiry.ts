import type { default as Client, default as PocketBase } from 'pocketbase';
import { DEFAULT_LOCALE, INQUIRY_LIMITS } from '$lib/common/constants';
import { isLocale } from '$lib/common/routes';
import type { InquiryInput } from '$lib/common/types';
import { log } from '$lib/common/utils';
import notify, { type NotifyResult } from './notify';
import pb from './pb';

var _COLLECTION = 'Inquiries' as const;

export type InquiryResult = { ok: boolean; error?: string };

type Notifier = { send: (message: string) => Promise<NotifyResult> };

const _text = (value: FormDataEntryValue | null, max: number): string =>
  String(value ?? '')
    .replace(/\s+\n/g, '\n')
    .trim()
    .slice(0, max);

export var parseInquiry = (form: FormData): InquiryInput => ({
  topic: _text(form.get('topic'), INQUIRY_LIMITS.topic),
  contact: _text(form.get('contact'), INQUIRY_LIMITS.contact),
  message: _text(form.get('message'), INQUIRY_LIMITS.message),
  locale: ((value) => (isLocale(value) ? value : DEFAULT_LOCALE))(
    form.get('locale')
  ),
  page: _text(form.get('page'), 200),
  consent: form.get('terms') === 'yes',
});

export var isSpam = (form: FormData): boolean =>
  String(form.get('website') ?? '').length > 0;

export var isComplete = (input: InquiryInput): boolean =>
  Boolean(input.contact && input.message && input.consent);

export var formatInquiry = (input: InquiryInput): string =>
  [
    '📫 Новое сообщение с сайта',
    input.topic && `Тема: ${input.topic}`,
    `Связь: ${input.contact}`,
    `Сообщение:\n${input.message}`,
    `Страница: ${input.page || '/'} (${input.locale})`,
  ]
    .filter(Boolean)
    .join('\n\n');

export var defineInquiryService = (
  pocketBase: PocketBase,
  notifier: Notifier,
  collection = _COLLECTION
) => {
  const _save = (input: InquiryInput) =>
    pocketBase
      .collection(collection)
      .create(input, { requestKey: null })
      .then(
        () => true,
        (error: unknown) => (log.warning('inquiry.save:', String(error)), false)
      );

  const _notify = (input: InquiryInput) =>
    notifier
      .send(formatInquiry(input))
      .then(
        ($) => (void (!$.ok && log.warning('inquiry.notify:', $.error)), $.ok)
      );

  return {
    collection,
    submit: (input: InquiryInput): Promise<InquiryResult> =>
      isComplete(input)
        ? Promise.all([_save(input), _notify(input)]).then(
            ({ 0: saved, 1: notified }) =>
              saved || notified
                ? { ok: true }
                : { ok: false, error: 'delivery_failed' }
          )
        : Promise.resolve({ ok: false, error: 'invalid_input' }),
  };
};

export default defineInquiryService(pb as Client, notify);
