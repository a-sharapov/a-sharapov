import type { APIRoute } from 'astro';
import { markdownResponse } from '$lib/services/markdown-page';

export var GET: APIRoute = ({ params, site, url }) =>
  markdownResponse(params.slug ?? '', (site ?? url).origin);
