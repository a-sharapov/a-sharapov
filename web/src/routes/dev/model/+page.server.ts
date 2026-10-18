import { error } from '@sveltejs/kit';
import { dev } from '$app/env';
import type { PageServerLoad } from './$types';

export var load: PageServerLoad = ({ url }) => {
  if (!dev) error(404, 'Not found');
  return { name: url.searchParams.get('name') ?? 'cup' };
};
