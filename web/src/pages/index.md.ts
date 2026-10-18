import type { APIRoute } from 'astro';
import { INDEX_SLUG } from '$lib/common/constants';
import { markdownResponse } from '$lib/services/markdown-page';

export var GET: APIRoute = ({ site, url }) =>
  markdownResponse(INDEX_SLUG, (site ?? url).origin);
