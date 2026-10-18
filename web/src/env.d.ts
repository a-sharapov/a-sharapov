/// <reference path="../.astro/types.d.ts" />

import type { InteractivityProps } from '@threlte/extras';
import type { Locale, NavItem } from './common/types';

declare global {
  namespace Threlte {
    interface UserProps extends InteractivityProps {}
  }

  namespace App {
    interface Locals {
      locale: Locale;
      slug: string;
      i18n: Record<string, unknown>;
      nav: NavItem[];
    }
  }
}

export type Locals = App.Locals;
