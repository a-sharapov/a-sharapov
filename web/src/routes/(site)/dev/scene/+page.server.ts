import { error } from '@sveltejs/kit';
import { SHOTS } from '#lib/common/constants.ts';
import type { Shot } from '#lib/common/types.ts';
import { dev } from '$app/env';
import type { PageServerLoad } from './$types';

var _shot = (requested: string | null): Shot =>
  SHOTS.includes(requested as Shot) ? (requested as Shot) : 'intro';

export var load: PageServerLoad = ({ url }) => {
  if (!dev) error(404, 'Not found');
  return ((shot) => ({
    bare: true,
    shot,
    layout: shot === 'portrait' ? 'contacts' : 'article',
  }))(_shot(url.searchParams.get('shot')));
};
