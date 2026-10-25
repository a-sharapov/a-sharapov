import type { LOCALES, SHOTS } from './constants';

export type Locale = (typeof LOCALES)[number];

export type Shot = (typeof SHOTS)[number];

export type PageTemplate =
  | 'card'
  | 'contacts'
  | 'article'
  | 'resume'
  | 'services';

export type Theme = 'light' | 'dark';

export type SceneMode = '3d' | 'video';

export type XYZ = [x: number, y: number, z: number];

export interface TimeStamps {
  created: string;
  updated: string;
}

export interface PageRecord extends TimeStamps {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  longtitle: string;
  description: string;
  keywords: string;
  template: PageTemplate;
  content: string;
  sort: number;
  nav: boolean;
  published: boolean;
}

export type ContactKind =
  | 'phone'
  | 'telegram'
  | 'email'
  | 'linkedin'
  | 'github';

export interface ContactRecord extends TimeStamps {
  id: string;
  kind: ContactKind;
  label: string;
  href: string;
  group: number;
  sort: number;
}

export interface NavItem {
  slug: string;
  title: string;
  href: string;
  shot: Shot;
}

export interface InquiryInput {
  topic: string;
  contact: string;
  message: string;
  locale: Locale;
  page: string;
  consent: boolean;
}

export type Translate = (key: string) => string;
