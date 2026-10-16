#!/usr/bin/env bun

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import source from './keys.toml';

type Mode = 'dev' | 'prod';
type Kind = 'mode' | 'setting' | 'secret' | 'external' | 'derived' | 'host';
type Env = Record<string, string>;

type Key = {
  name: string;
  group: string;
  kind: Kind;
  to: string[];
  default?: string;
  dev?: string;
  prod?: string;
  value?: string;
  choices: string[];
  from: string[];
  pinned: boolean;
  doc: string;
};

type Manifest = {
  groups: Record<string, string>;
  keys: Key[];
  obsolete: Record<string, string>;
};

type Options = {
  command: string;
  positionals: string[];
  envFile: string;
  example: string;
  out: string;
  mode?: Mode;
  persist: boolean;
  check: boolean;
};

type Report = { errors: string[]; warnings: string[] };

const KINDS: Kind[] = [
  'mode',
  'setting',
  'secret',
  'external',
  'derived',
  'host',
];
const MODES: Mode[] = ['dev', 'prod'];
const LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
const SAFE = /^[A-Za-z0-9_./:@,+=%-]*$/;
const PLACEHOLDER = /^(<!.*>|changeme|change-me|your_|example|token_here)/i;
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const pipe =
  <T>(...fns: Array<(value: T) => T>) =>
  (input: T): T =>
    fns.reduce((value, fn) => fn(value), input);

const _fail = (message: string): never => {
  console.error(message);
  return process.exit(1);
};

const _toKey = (
  group: string,
  name: string,
  spec: Record<string, any>
): Key => ({
  name,
  group,
  kind: spec.kind,
  to: spec.to ?? [],
  default: spec.default,
  dev: spec.dev,
  prod: spec.prod,
  value: spec.value,
  choices: spec.choices ?? [],
  from: spec.from ?? [],
  pinned: spec.pinned ?? false,
  doc: spec.doc ?? '',
});

const _loadManifest = (data: Record<string, any>): Manifest => {
  const { groups, obsolete = {}, ...tables } = data;
  const keys = Object.keys(groups).flatMap((group) =>
    Object.entries(tables[group] ?? {}).map(({ 0: name, 1: spec }) =>
      _toKey(group, name, spec as Record<string, any>)
    )
  );
  const problems = [
    ...keys
      .filter((key) => !KINDS.includes(key.kind))
      .map((key) => `${key.name}: неизвестный kind ${key.kind}`),
    ...Object.keys(tables)
      .filter((table) => !(table in groups))
      .map((table) => `[${table}]: таблица вне [groups]`),
  ];
  return problems.length
    ? _fail(`keys.toml: ${problems.join('; ')}`)
    : { groups, keys, obsolete };
};

const _unquote = (raw: string): string => {
  const value = raw.trim();
  const single = value.match(/^'([^']*)'/);
  const double = value.match(/^"((?:[^"\\]|\\.)*)"/);
  return single
    ? single[1]
    : double
      ? double[1].replace(/\\([\\"$`])/g, '$1')
      : value.split(/\s+#/)[0].trim();
};

const _parseEnv = (text: string): Env =>
  text
    .split('\n')
    .map((line) => line.match(LINE))
    .reduce<Env>(
      (acc, match) =>
        match ? { ...acc, [match[1]]: _unquote(match[2]) } : acc,
      {}
    );

const _readEnv = (path: string): Env =>
  existsSync(path) ? _parseEnv(readFileSync(path, 'utf8')) : {};

const quote = (value: string): string =>
  SAFE.test(value)
    ? value
    : !value.includes("'") && !value.includes('\n')
      ? `'${value}'`
      : `"${value.replace(/[\\"$`]/g, '\\$&')}"`;

const _writePrivate = (path: string, text: string): void => {
  writeFileSync(path, text, { mode: 0o600 });
  chmodSync(path, 0o600);
};

const _real = (value: string | undefined): string =>
  value && !PLACEHOLDER.test(value) ? value : '';

const _own = (key: Key, env: Env): string =>
  _real(env[key.name]) ||
  key.from.map((old) => _real(env[old])).find(Boolean) ||
  '';

const _modeDefault = (key: Key, mode: Mode): string =>
  (mode === 'prod' ? key.prod : key.dev) ?? key.default ?? '';

const _detectMode = (env: Env, override?: Mode): Mode => {
  const mode = override ?? (env.ENV || 'dev');
  return MODES.includes(mode as Mode)
    ? (mode as Mode)
    : _fail(`ENV=${mode}: ожидается dev или prod`);
};

const _fill = (template: string, values: Env): string =>
  template.replace(/\{([A-Z0-9_]+)\}/g, (_, name) => values[name] ?? '');

const _baseValue: Record<Kind, (key: Key, own: string, mode: Mode) => string> =
  {
    mode: (_key, _own, mode) => mode,
    setting: (key, own, mode) => own || _modeDefault(key, mode),
    host: (key, own, mode) => own || _modeDefault(key, mode),
    secret: (_key, own) => own,
    external: (_key, own) => own,
    derived: (_key, own) => own,
  };

const resolveValues = (manifest: Manifest, env: Env, mode: Mode): Env => {
  const base = manifest.keys.reduce<Env>(
    (acc, key) => ({
      ...acc,
      [key.name]: _baseValue[key.kind](key, _own(key, env), mode),
    }),
    {}
  );
  return manifest.keys.reduce<Env>(
    (acc, key) =>
      key.kind === 'derived' && !acc[key.name]
        ? { ...acc, [key.name]: _fill(key.value ?? '', base) }
        : acc,
    base
  );
};

const _services = (manifest: Manifest): string[] =>
  [...new Set(manifest.keys.flatMap((key) => key.to))].toSorted();

const _serviceText = (
  manifest: Manifest,
  values: Env,
  service: string
): string =>
  manifest.keys
    .filter((key) => key.to.includes(service) && values[key.name])
    .map((key) => `${key.name}=${quote(values[key.name])}\n`)
    .join('');

const _randomChars = (count: number): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(count * 2)))
    .filter((byte) => byte < 248)
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join('');

const _randomSecret = (length = 40, acc = ''): string =>
  acc.length >= length
    ? acc.slice(0, length)
    : _randomSecret(length, acc + _randomChars(length));

const _missingSecrets = (manifest: Manifest, env: Env): Env =>
  manifest.keys
    .filter((key) => key.kind === 'secret' && !_own(key, env))
    .reduce<Env>((acc, key) => ({ ...acc, [key.name]: _randomSecret() }), {});

const _trimEnd = (lines: string[]): string[] =>
  lines.reduceRight<string[]>(
    (acc, line) => (acc.length || line.trim() ? [line, ...acc] : acc),
    []
  );

const _stamp = (): string => new Date().toLocaleString('sv-SE').slice(0, 16);

const _upsertLines = (
  text: string,
  pairs: Env,
  allowCommented: boolean
): string => {
  const pattern = allowCommented
    ? /^\s*#?\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=/
    : /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=/;
  const lines = _trimEnd(text.split('\n'));
  const nameOf = (line: string): string => line.match(pattern)?.[1] ?? '';
  const present = new Set(lines.map(nameOf).filter((name) => name in pairs));
  const replaced = lines.map((line) =>
    present.has(nameOf(line))
      ? `${nameOf(line)}=${quote(pairs[nameOf(line)])}`
      : line
  );
  const rest = Object.entries(pairs).filter(
    ({ 0: name }) => !present.has(name)
  );
  const block = rest.length
    ? [
        '',
        `# Сгенерировано scripts/env/generate.ts ${_stamp()}`,
        ...rest.map(({ 0: name, 1: value }) => `${name}=${quote(value)}`),
      ]
    : [];
  return `${[...replaced, ...block].join('\n')}\n`;
};

const _exampleNote: Record<Kind, (key: Key) => string> = {
  mode: () => '',
  setting: (key) => (key.prod ? `в prod: ${key.prod}` : ''),
  secret: () => 'генерируется автоматически',
  external: () => 'вписать вручную; в prod обязателен',
  derived: () => 'выводится сам',
  host: () => 'только для хоста',
};

const _isActive = (key: Key): boolean =>
  key.kind === 'mode' || key.kind === 'external' || Boolean(key.prod);

const _exampleValue = (key: Key, devValues: Env): string =>
  ['secret', 'external'].includes(key.kind) ? '' : devValues[key.name];

const _exampleLine = (key: Key, devValues: Env): string => {
  const note = _exampleNote[key.kind](key);
  const comment = `# ${key.doc}${note ? ` (${note})` : ''}\n`;
  const choices = key.choices.length
    ? `# варианты: ${key.choices.join(' | ')}\n`
    : '';
  const prefix = _isActive(key) ? '' : '# ';
  return `${comment}${choices}${prefix}${key.name}=${quote(_exampleValue(key, devValues))}\n`;
};

const renderExample = (manifest: Manifest): string => {
  const devValues = resolveValues(manifest, {}, 'dev');
  const head = [
    '# a-sharapov — переменные окружения. Генерируется: bun scripts/env/generate.ts example',
    '# Манифест — scripts/env/keys.toml: кому раздаётся ключ и откуда значение.',
    '#',
    '# Новый .env: make dot-env (секреты сгенерируются сами). Вручную — только внешние ключи',
    '# (TG_TOKEN) и то, что отличается от умолчания. make env раскладывает .env по env/<сервис>.env.',
    '',
  ].join('\n');
  const sections = Object.entries(manifest.groups).map(
    ({ 0: group, 1: title }) =>
      `\n# -- ${title} --\n${manifest.keys
        .filter((key) => key.group === group)
        .map((key) => _exampleLine(key, devValues))
        .join('')}`
  );
  return `${head}${sections.join('')}`;
};

const _severity = (mode: Mode): keyof Report =>
  (({ dev: 'warnings', prod: 'errors' }) as const)[mode];

const _manifestNames = (manifest: Manifest): Set<string> =>
  new Set(manifest.keys.flatMap((key) => [key.name, ...key.from]));

const _passChoices =
  (manifest: Manifest, values: Env) =>
  (report: Report): Report => ({
    ...report,
    errors: [
      ...report.errors,
      ...manifest.keys
        .filter(
          (key) => key.choices.length && !key.choices.includes(values[key.name])
        )
        .map(
          (key) =>
            `${key.name}=${values[key.name]}: допустимо ${key.choices.join(', ')}`
        ),
    ],
  });

const _passPlaceholders =
  (manifest: Manifest, env: Env, mode: Mode) =>
  (report: Report): Report => ({
    ...report,
    [_severity(mode)]: [
      ...report[_severity(mode)],
      ...manifest.keys
        .filter(
          (key) =>
            ['secret', 'external'].includes(key.kind) &&
            PLACEHOLDER.test(env[key.name] ?? '')
        )
        .map((key) => `${key.name}: заглушка вместо значения`),
    ],
  });

const _passExternals =
  (manifest: Manifest, values: Env, env: Env, mode: Mode) =>
  (report: Report): Report => ({
    ...report,
    [_severity(mode)]: [
      ...report[_severity(mode)],
      ...manifest.keys
        .filter(
          (key) =>
            key.kind === 'external' &&
            !values[key.name] &&
            !PLACEHOLDER.test(env[key.name] ?? '')
        )
        .map((key) => `${key.name}: не задан — ${key.doc}`),
    ],
  });

const _passProdDefaults =
  (manifest: Manifest, values: Env, mode: Mode) =>
  (report: Report): Report => ({
    ...report,
    errors: [
      ...report.errors,
      ...manifest.keys
        .filter(
          (key) =>
            mode === 'prod' && key.prod && values[key.name] === key.default
        )
        .map(
          (key) =>
            `${key.name}=${values[key.name]}: значение для dev, в prod — например ${key.prod}`
        ),
    ],
  });

const _passSecrets =
  (manifest: Manifest, env: Env) =>
  (report: Report): Report => ({
    ...report,
    warnings: [
      ...report.warnings,
      ...manifest.keys
        .filter(
          (key) =>
            key.kind === 'secret' &&
            !_own(key, env) &&
            !PLACEHOLDER.test(env[key.name] ?? '')
        )
        .map((key) => `${key.name}: нет в .env — сгенерируется при make env`),
    ],
  });

const _passPinned =
  (manifest: Manifest, env: Env) =>
  (report: Report): Report => ({
    ...report,
    warnings: [
      ...report.warnings,
      ...manifest.keys
        .filter(
          (key) =>
            key.pinned && _own(key, env) && _own(key, env) !== key.default
        )
        .map(
          (key) =>
            `${key.name}=${_own(key, env)}: в compose и Caddy зашит ${key.default}`
        ),
    ],
  });

const _passLegacy =
  (manifest: Manifest, env: Env) =>
  (report: Report): Report => ({
    ...report,
    warnings: [
      ...report.warnings,
      ...manifest.keys.flatMap((key) =>
        key.from
          .filter((old) => old in env)
          .map((old) =>
            key.name in env
              ? `${old}: прежнее имя, действует ${key.name} — удалить`
              : `${old}: прежнее имя — переименовать в ${key.name}`
          )
      ),
      ...Object.entries(manifest.obsolete)
        .filter(({ 0: name }) => name in env)
        .map(({ 0: name, 1: note }) => `${name}: устарел (${note}) — удалить`),
      ...Object.keys(env)
        .filter(
          (name) =>
            !_manifestNames(manifest).has(name) && !(name in manifest.obsolete)
        )
        .map((name) => `${name}: нет в манифесте scripts/env/keys.toml`),
    ],
  });

const problems = (manifest: Manifest, env: Env, mode: Mode): Report => {
  const values = resolveValues(manifest, env, mode);
  return pipe<Report>(
    _passChoices(manifest, values),
    _passExternals(manifest, values, env, mode),
    _passPlaceholders(manifest, env, mode),
    _passProdDefaults(manifest, values, mode),
    _passSecrets(manifest, env),
    _passPinned(manifest, env),
    _passLegacy(manifest, env)
  )({ errors: [], warnings: [] });
};

const _requireEnv = (path: string): Env =>
  existsSync(path)
    ? _readEnv(path)
    : _fail(`нет ${path} — сначала make dot-env`);

const _writeServiceFiles = (
  manifest: Manifest,
  values: Env,
  out: string
): string[] => {
  const services = _services(manifest);
  mkdirSync(out, { recursive: true });
  services.forEach((service) => {
    _writePrivate(
      join(out, `${service}.env`),
      _serviceText(manifest, values, service)
    );
  });
  const stale = readdirSync(out).filter(
    (file) => file.endsWith('.env') && !services.includes(file.slice(0, -4))
  );
  stale.forEach((file) => {
    unlinkSync(join(out, file));
  });
  return stale;
};

type SplitState = {
  env: Env;
  mode: Mode;
  generated: Env;
  persisted: boolean;
  removed: string[];
};

const cmdSplit = (options: Options, manifest: Manifest): number => {
  const _passSource = (state: SplitState): SplitState => {
    const env = _requireEnv(options.envFile);
    return { ...state, env, mode: _detectMode(env, options.mode) };
  };
  const _passGenerate = (state: SplitState): SplitState => ({
    ...state,
    generated: _missingSecrets(manifest, state.env),
  });
  const _passPersist = (state: SplitState): SplitState => {
    const persisted =
      options.persist && Object.keys(state.generated).length > 0;
    void (
      persisted &&
      _writePrivate(
        options.envFile,
        _upsertLines(
          readFileSync(options.envFile, 'utf8'),
          state.generated,
          false
        )
      )
    );
    return { ...state, persisted };
  };
  const _passWrite = (state: SplitState): SplitState => ({
    ...state,
    removed: _writeServiceFiles(
      manifest,
      resolveValues(manifest, { ...state.env, ...state.generated }, state.mode),
      options.out
    ),
  });
  const _passReport = (state: SplitState): SplitState => {
    const names = Object.keys(state.generated).join(', ');
    const note = [
      names &&
        `; сгенерированы: ${names}${state.persisted ? ' (дописаны в .env)' : ' (не записаны в .env)'}`,
      state.removed.length &&
        `; удалены устаревшие: ${state.removed.join(', ')}`,
    ]
      .filter(Boolean)
      .join('');
    console.log(
      `env: ${state.mode}, ${options.out}/{${_services(manifest).join(',')}}.env${note}`
    );
    return state;
  };
  pipe<SplitState>(
    _passSource,
    _passGenerate,
    _passPersist,
    _passWrite,
    _passReport
  )({ env: {}, mode: 'dev', generated: {}, persisted: false, removed: [] });
  return 0;
};

const cmdCheck = (options: Options, manifest: Manifest): number => {
  const env = _requireEnv(options.envFile);
  const mode = _detectMode(env, options.mode);
  const { errors, warnings } = problems(manifest, env, mode);
  warnings.forEach((line) => {
    console.error(`env check: предупреждение: ${line}`);
  });
  errors.forEach((line) => {
    console.error(`env check: ошибка: ${line}`);
  });
  console.log(
    `env check: ${mode}, ошибок ${errors.length}, предупреждений ${warnings.length}`
  );
  return errors.length ? 1 : 0;
};

const _createDotEnv = (options: Options, manifest: Manifest): number => {
  const mode = options.mode ?? 'dev';
  const template = existsSync(options.example)
    ? readFileSync(options.example, 'utf8')
    : renderExample(manifest);
  const secrets = _missingSecrets(manifest, {});
  const values: Env = {
    ENV: mode,
    ...manifest.keys
      .filter((key) => key.kind === 'setting' && key.prod)
      .reduce<Env>(
        (acc, key) => ({ ...acc, [key.name]: _modeDefault(key, mode) }),
        {}
      ),
    ...secrets,
  };
  const externals = manifest.keys
    .filter((key) => key.kind === 'external')
    .map((key) => key.name);
  _writePrivate(options.envFile, _upsertLines(template, values, true));
  console.log(
    `dot-env: ${options.envFile} (${mode}), сгенерированы: ${Object.keys(secrets).join(', ')}; вписать вручную: ${externals.join(', ')}`
  );
  return 0;
};

const cmdDotEnv = (options: Options, manifest: Manifest): number =>
  existsSync(options.envFile)
    ? (console.log(`dot-env: ${options.envFile} уже есть — не трогаю`), 0)
    : _createDotEnv(options, manifest);

const cmdExample = (options: Options, manifest: Manifest): number => {
  const text = renderExample(manifest);
  const current = existsSync(options.example)
    ? readFileSync(options.example, 'utf8')
    : '';
  const stale = current !== text;
  const _checkOnly = (): number =>
    stale
      ? (console.error(
          `example: ${options.example} устарел — bun scripts/env/generate.ts example`
        ),
        1)
      : (console.log(`example: ${options.example} актуален`), 0);
  const _write = (): number => (
    writeFileSync(options.example, text),
    console.log(`example: ${options.example}`),
    0
  );
  return options.check ? _checkOnly() : _write();
};

const cmdGet = (options: Options, manifest: Manifest): number => {
  const name = options.positionals[0] ?? '';
  const env = _readEnv(options.envFile);
  const values = resolveValues(manifest, env, _detectMode(env, options.mode));
  return name in values
    ? (console.log(values[name]), 0)
    : _fail(`get: ключа ${name || '(пусто)'} нет в манифесте`);
};

const COMMANDS: Record<
  string,
  (options: Options, manifest: Manifest) => number
> = {
  example: cmdExample,
  'dot-env': cmdDotEnv,
  split: cmdSplit,
  check: cmdCheck,
  get: cmdGet,
};

const USAGE =
  'usage: bun scripts/env/generate.ts <example|dot-env|split|check|get KEY> [--root DIR] [--env-file F] [--out DIR] [--mode dev|prod] [--no-persist] [--check]';

const _parseOptions = (argv: string[]): Options => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      root: { type: 'string', default: resolve(import.meta.dir, '../..') },
      'env-file': { type: 'string' },
      out: { type: 'string' },
      mode: { type: 'string' },
      'no-persist': { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
    },
  });
  const root = resolve(values.root as string);
  const mode = values.mode as Mode | undefined;
  return {
    command: positionals[0] ?? '',
    positionals: positionals.slice(1),
    envFile: resolve(root, (values['env-file'] as string) ?? '.env'),
    example: join(root, '.env.example'),
    out: resolve(root, (values.out as string) ?? 'env'),
    mode:
      mode === undefined || MODES.includes(mode)
        ? mode
        : _fail(`--mode ${mode}: ожидается dev или prod`),
    persist: !values['no-persist'],
    check: Boolean(values.check),
  };
};

const options = _parseOptions(Bun.argv.slice(2));
const command = COMMANDS[options.command] ?? (() => _fail(USAGE));
process.exit(command(options, _loadManifest(source)));
