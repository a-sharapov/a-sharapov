import { INDEX_SLUG, SITE_ORIGIN } from '#lib/common/constants.ts';
import { markdownResponse } from '#lib/services/markdown-page.ts';
import type { RequestHandler } from './$types';

export var GET: RequestHandler = () =>
  markdownResponse(INDEX_SLUG, SITE_ORIGIN);
