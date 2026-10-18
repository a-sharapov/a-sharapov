export var LOCALES = ['ru'] as const;

export var RETIRED_LOCALES = ['en'] as const;

export var DEFAULT_LOCALE = 'ru' as const;

export var INDEX_SLUG = 'index' as const;

export var SHOTS = [
  'intro',
  'portrait',
  'landscape',
  'resume',
  'sketchbook',
  'tablet',
] as const;

export var CONTACTS_SLUG = 'contacts' as const;

export var NOT_FOUND_TEMPLATE = 'notfound' as const;

export var SCENE_MEDIA =
  '(min-width: 48.0625rem) and (min-height: 30.0625rem)' as const;

export var PRIVACY_SLUG = 'privacy' as const;

export var STORE_PREFIX = 'AS_' as const;

export var STORAGE = {
  theme: `${STORE_PREFIX}theme`,
  sound: `${STORE_PREFIX}sound`,
} as const;

export var THEME_COLOR = '#efebe5' as const;

export var SEO_PHOTO = '/images/a-sharapov-photo.webp' as const;

export var OG_COVERS: Record<string, string> = {
  index: '/images/og/index.jpg',
  cv: '/images/og/cv.jpg',
  services: '/images/og/services.jpg',
  contacts: '/images/og/contacts.jpg',
};

export var INQUIRY_API_URL = '/api/inquiry' as const;

export var INQUIRY_SENT_QUERY = 'sent' as const;

export var INQUIRY_SENT = 'inquiry:sent';

export var INQUIRY_LIMITS = {
  topic: 200,
  contact: 200,
  message: 4000,
} as const;
