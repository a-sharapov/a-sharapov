export var DEFAULT_PORT = 5702;

export var DEFAULT_DB_PATH = './data/bot.db';

export var LIMIT = 10;

export var MESSAGE_RETENTION = '-12 months';

export var LINE_JOINER = '\n\n----\n\n';

export var MAX_MESSAGE_LENGTH = 4096;

export var MAX_BODY_BYTES = 1024 * 1024;

export var POLLING_RETRY = {
  first: 1000,
  max: 60 * 1000,
  steady: 10 * 60 * 1000,
};

export var POLL_DEADLINE = 90 * 1000;
