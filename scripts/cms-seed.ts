#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

type Target = 'i18n' | 'pages' | 'contacts';
type Action = 'create' | 'update' | 'skip';

type Cli = {
  url: string;
  only: string[];
  replace: boolean;
  dryRun: boolean;
  help: boolean;
  login: string;
  password: string;
};

type Ctx = Omit<Cli, 'only'> & { only: Target[]; token: string };

type StoredRecord = JsonObject & { id: string };

type Plan = {
  collection: string;
  key: string;
  action: Action;
  id: string;
  body: JsonObject;
};

type Row = Pick<Plan, 'collection' | 'key' | 'action'>;

type Counts = Record<string, Record<Action, number>>;

type Spec = {
  collection: string;
  keys: string[];
  load: () => JsonObject[];
  compose: (
    ctx: Ctx
  ) => (seed: JsonObject, stored?: StoredRecord) => JsonObject;
};

const ROOT = join(import.meta.dir, '..');
const SEED_DIR = join(ROOT, 'cms/seed');
const I18N_DIR = join(SEED_DIR, 'i18n');
const TARGETS: Target[] = ['i18n', 'pages', 'contacts'];
const ACTIONS: Action[] = ['create', 'update', 'skip'];
const PER_PAGE = 200;

const pipe =
  (...fns: Array<(arg: any) => any>) =>
  (payload?: unknown): any =>
    fns.reduce(
      (acc, fn) => (acc instanceof Promise ? acc.then(fn) : fn(acc)),
      payload
    );

const _isObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const _asObject = (value: unknown): JsonObject =>
  _isObject(value) ? value : {};

const _errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const _deepMerge = (base: Json, overlay: Json): Json =>
  _isObject(base) && _isObject(overlay)
    ? Object.keys(overlay).reduce<JsonObject>(
        (acc, key) => ({
          ...acc,
          [key]:
            key in acc
              ? _deepMerge(acc[key] as Json, overlay[key] as Json)
              : (overlay[key] as Json),
        }),
        { ...base }
      )
    : overlay;

const _sortKeys = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(_sortKeys)
    : _isObject(value)
      ? Object.keys(value)
          .toSorted()
          .reduce<JsonObject>(
            (acc, key) => ({ ...acc, [key]: _sortKeys(value[key] as Json) }),
            {}
          )
      : value;

const _same = (a: Json | undefined, b: Json | undefined): boolean =>
  JSON.stringify(_sortKeys(a ?? null)) === JSON.stringify(_sortKeys(b ?? null));

const _flag = (argv: string[], name: string): boolean => argv.includes(name);

const _option = (argv: string[], name: string): string | undefined => {
  const value = argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined;
  return value?.startsWith('-') ? undefined : value;
};

const _parseList = (raw: string): string[] =>
  raw
    .split(',')
    .map((_) => _.trim())
    .filter(Boolean);

const _parseCli = (argv: string[]): Cli => ({
  url: (
    _option(argv, '--url') ??
    process.env.CMS_URL ??
    'http://localhost:5703'
  ).replace(/\/+$/, ''),
  only: _parseList(_option(argv, '--only') ?? TARGETS.join(',')),
  replace: _flag(argv, '--replace'),
  dryRun: _flag(argv, '--dry-run'),
  help: _flag(argv, '--help') || _flag(argv, '-h'),
  login: process.env.CMS_LOGIN ?? '',
  password: process.env.CMS_PASSWORD ?? '',
});

const _cliErrors = (cli: Cli): string[] => [
  ...cli.only
    .filter((_) => !TARGETS.includes(_ as Target))
    .map((_) => `unknown --only target "${_}" (use ${TARGETS.join(',')})`),
  ...(cli.login && cli.password
    ? []
    : ['CMS_LOGIN and CMS_PASSWORD must be set']),
];

const _passCli = (cli: Cli): Cli | Promise<never> =>
  pipe(_cliErrors, (_: string[]) =>
    _.length ? Promise.reject(new Error(_.join('; '))) : cli
  )(cli);

const _printHelp = (): number => (
  console.log(`Usage: bun scripts/cms-seed.ts [options]

Upsert cms/seed → PocketBase: i18n/<locale>.json, pages.json, contacts.json.

Options:
  --url URL                     CMS URL (default: CMS_URL or http://localhost:5703)
  --only i18n,pages,contacts    Collections to seed (default: all)
  --replace                     i18n: replace content (default: deep-merge)
  --dry-run                     Plan only, no writes
  -h, --help                    This help

Env:
  CMS_LOGIN, CMS_PASSWORD       Superuser credentials

Examples:
  bun scripts/cms-seed.ts --dry-run
  bun scripts/cms-seed.ts --only i18n --replace
  make cms-seed
`),
  0
);

const _passResponse =
  (label: string) =>
  (response: Response): Promise<Json> =>
    response
      .text()
      .then((text) =>
        response.ok
          ? ((text ? JSON.parse(text) : null) as Json)
          : Promise.reject(
              new Error(`${label} → HTTP ${response.status}: ${text.trim()}`)
            )
      );

const _networkError =
  (label: string) =>
  (error: unknown): Promise<never> =>
    Promise.reject(new Error(`${label} → ${_errorText(error)}`));

const _request =
  (url: string, token = '') =>
  (method: string, path: string, body?: JsonObject): Promise<Json> =>
    fetch(`${url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(
      _passResponse(`${method} ${path}`),
      _networkError(`${method} ${url}${path}`)
    );

const _recordsPath = (collection: string): string =>
  `/api/collections/${encodeURIComponent(collection)}/records`;

const _authenticate = (cli: Cli): Promise<Ctx> =>
  _request(cli.url)('POST', '/api/collections/_superusers/auth-with-password', {
    identity: cli.login,
    password: cli.password,
  }).then((_) => ({
    ...cli,
    only: cli.only as Target[],
    token: String(_asObject(_).token ?? ''),
  }));

const _listPage =
  (ctx: Ctx, collection: string) =>
  (page: number): Promise<StoredRecord[]> =>
    _request(ctx.url, ctx.token)(
      'GET',
      `${_recordsPath(collection)}?perPage=${PER_PAGE}&page=${page}`
    )
      .then(_asObject)
      .then((_) =>
        Number(_.totalPages ?? 0) > page
          ? _listPage(
              ctx,
              collection
            )(page + 1).then((rest) => [
              ...(_.items as StoredRecord[]),
              ...rest,
            ])
          : ((_.items ?? []) as StoredRecord[])
      );

const _readJson = (path: string): Json =>
  JSON.parse(readFileSync(path, 'utf8')) as Json;

const _readList = (path: string): JsonObject[] =>
  existsSync(path) ? (_readJson(path) as JsonObject[]) : [];

const _loadI18n = (): JsonObject[] =>
  existsSync(I18N_DIR)
    ? readdirSync(I18N_DIR)
        .filter((_) => /^[a-z]{2}\.json$/.test(_))
        .toSorted()
        .map((name) => ({
          locale: name.slice(0, 2),
          content: _asObject(_readJson(join(I18N_DIR, name))),
        }))
    : [];

const _composeI18n =
  (ctx: Ctx) =>
  (seed: JsonObject, stored?: StoredRecord): JsonObject => ({
    locale: seed.locale ?? '',
    content: ctx.replace
      ? _asObject(seed.content)
      : _deepMerge(_asObject(stored?.content), _asObject(seed.content)),
  });

const _composeSeed = () => (seed: JsonObject) => seed;

const _specs: Record<Target, Spec> = {
  i18n: {
    collection: 'i18n',
    keys: ['locale'],
    load: _loadI18n,
    compose: _composeI18n,
  },
  pages: {
    collection: 'Pages',
    keys: ['slug', 'locale'],
    load: () => _readList(join(SEED_DIR, 'pages.json')),
    compose: _composeSeed,
  },
  contacts: {
    collection: 'Contacts',
    keys: ['kind', 'href'],
    load: () => _readList(join(SEED_DIR, 'contacts.json')),
    compose: _composeSeed,
  },
};

const _keyOf =
  (keys: string[]) =>
  (record: JsonObject): string =>
    keys.map((key) => String(record[key] ?? '')).join('/');

const _indexBy = (
  keys: string[],
  stored: StoredRecord[]
): Record<string, StoredRecord> =>
  stored.reduce<Record<string, StoredRecord>>(
    (acc, record) => ({ ...acc, [_keyOf(keys)(record)]: record }),
    {}
  );

const _actionOf = (
  stored: StoredRecord | undefined,
  body: JsonObject
): Action =>
  !stored
    ? 'create'
    : Object.keys(body).some((field) => !_same(stored[field], body[field]))
      ? 'update'
      : 'skip';

const _planOne =
  (ctx: Ctx, spec: Spec, byKey: Record<string, StoredRecord>) =>
  (seed: JsonObject): Plan => {
    const key = _keyOf(spec.keys)(seed);
    const stored = byKey[key];
    const body = spec.compose(ctx)(seed, stored);
    return {
      collection: spec.collection,
      key,
      action: _actionOf(stored, body),
      id: stored?.id ?? '',
      body,
    };
  };

const _plan =
  (ctx: Ctx, spec: Spec) =>
  ({ 0: seeds, 1: stored }: [JsonObject[], StoredRecord[]]): Plan[] =>
    seeds.map(_planOne(ctx, spec, _indexBy(spec.keys, stored)));

const _writers: Record<Action, (ctx: Ctx, plan: Plan) => Promise<Json>> = {
  create: (ctx, plan) =>
    _request(ctx.url, ctx.token)(
      'POST',
      _recordsPath(plan.collection),
      plan.body
    ),
  update: (ctx, plan) =>
    _request(ctx.url, ctx.token)(
      'PATCH',
      `${_recordsPath(plan.collection)}/${plan.id}`,
      plan.body
    ),
  skip: () => Promise.resolve(null),
};

const _toRow = ({ collection, key, action }: Plan): Row => ({
  collection,
  key,
  action,
});

const _apply =
  (ctx: Ctx) =>
  (plans: Plan[]): Promise<Row[]> =>
    plans.reduce<Promise<Row[]>>(
      (acc, plan) =>
        acc.then((rows) =>
          _writers[ctx.dryRun ? 'skip' : plan.action](ctx, plan).then(() => [
            ...rows,
            _toRow(plan),
          ])
        ),
      Promise.resolve([])
    );

const _seedTarget =
  (ctx: Ctx) =>
  (target: Target): Promise<Row[]> =>
    Promise.all([
      _specs[target].load(),
      _listPage(ctx, _specs[target].collection)(1),
    ])
      .then(_plan(ctx, _specs[target]))
      .then(_apply(ctx));

const _seedAll = (ctx: Ctx): Promise<Row[]> =>
  ctx.only.reduce<Promise<Row[]>>(
    (acc, target) =>
      acc.then((rows) =>
        _seedTarget(ctx)(target).then((next) => [...rows, ...next])
      ),
    Promise.resolve([])
  );

const _announce = (cli: Cli): Cli => (
  console.log(
    `cms-seed: url=${cli.url} only=${cli.only.join(',')} i18n=${cli.replace ? 'replace' : 'merge'}${cli.dryRun ? ' (dry-run: no writes)' : ''}`
  ),
  cli
);

const _emptyCounts = (only: Target[]): Counts =>
  only.reduce<Counts>(
    (acc, target) => ({
      ...acc,
      [_specs[target].collection]: { create: 0, update: 0, skip: 0 },
    }),
    {}
  );

const _countRows =
  (only: Target[]) =>
  (rows: Row[]): Counts =>
    rows.reduce<Counts>(
      (acc, { collection, action }) => ({
        ...acc,
        [collection]: {
          ...acc[collection],
          [action]: (acc[collection]?.[action] ?? 0) + 1,
        } as Record<Action, number>,
      }),
      _emptyCounts(only)
    );

const _formatTable = (counts: Counts): string =>
  [
    ['collection', ...ACTIONS],
    ...Object.entries(counts).map(({ 0: name, 1: row }) => [
      name,
      ...ACTIONS.map((action) => String(row[action])),
    ]),
  ]
    .map((cells) =>
      [
        (cells[0] ?? '').padEnd(12),
        ...cells.slice(1).map((_) => _.padStart(8)),
      ].join('')
    )
    .join('\n');

const _formatRows = (rows: Row[]): string =>
  rows
    .map((_) => `  ${_.collection.padEnd(10)} ${_.action.padEnd(7)} ${_.key}`)
    .join('\n');

const _report =
  (cli: Cli) =>
  (rows: Row[]): number => (
    console.log(
      [
        _formatRows(rows),
        _formatTable(_countRows(cli.only as Target[])(rows)),
        cli.dryRun ? 'dry-run ok' : 'ok',
      ]
        .filter(Boolean)
        .join('\n\n')
    ),
    0
  );

const _run = (cli: Cli): Promise<number> =>
  pipe(_passCli, _announce, _authenticate, _seedAll, _report(cli))(cli);

const _handle = pipe(_parseCli, (cli: Cli) =>
  cli.help ? _printHelp() : _run(cli)
);

const _catch = (error: unknown): number => (
  console.error(`error: ${_errorText(error)}`), 1
);

Promise.resolve(process.argv.slice(2))
  .then(_handle)
  .then(undefined, _catch)
  .then((code) => process.exit(code));
