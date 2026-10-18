import { defineParams } from '@sveltejs/kit/params';
import { isLocale } from '#lib/common/routes.ts';

export var params = defineParams({
  locale: (param) => (isLocale(param) ? param : undefined),
});
