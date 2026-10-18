import { SITE_ORIGIN } from '#lib/common/constants.ts';
import { markdownResponse } from '#lib/services/markdown-page.ts';
import type { RequestHandler } from './$types';

export var GET: RequestHandler = ({ params }) =>
  markdownResponse(params.slug ?? '', SITE_ORIGIN);
