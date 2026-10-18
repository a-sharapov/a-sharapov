import type { RequestEvent } from '@sveltejs/kit';

var _MARK = /<!--as:static:(\d+)-->/g;

export var staticHtml = (
  { isDataRequest, locals }: Pick<RequestEvent, 'isDataRequest' | 'locals'>,
  html: string
): string =>
  isDataRequest || !html
    ? html
    : `<!--as:static:${locals.statics.push(html) - 1}-->`;

export var fillStatic = (chunk: string, statics: string[]): string =>
  statics.length
    ? chunk.replace(
        _MARK,
        (mark, index: string) => statics[Number(index)] ?? mark
      )
    : chunk;
