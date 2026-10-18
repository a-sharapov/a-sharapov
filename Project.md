# a-sharapov.com

Astro SSR + Svelte на Bun, Telegram-бот уведомлений, CMS на PocketBase и Caddy перед ними. Всё запускается через Docker Compose и `make`.

| Сервис  | Что                                                                         | Порт    | Код                        |
| ------- | --------------------------------------------------------------------------- | ------- | -------------------------- |
| `proxy` | Caddy 2: HTTPS (ACME в prod, локальный CA в dev), HTTP/3, страница-заглушка | 80, 443 | `proxy/`                   |
| `web`   | Astro SSR + Svelte, Bun                                                     | 5701    | `web/`, `@docker/web.*`    |
| `bot`   | Telegram-бот и HTTP API для web, SQLite в `bot/data`                        | 5702    | `bot/`, `@docker/bot.*`    |
| `cms`   | PocketBase: страницы, контакты, переводы, заявки                            | 5703    | `cms/`, `@docker/cms.prod` |

- `dev.yml` — одна сеть, исходники web и bot примонтированы, порты 5701–5703 открыты на `127.0.0.1`.
- `prod.yml` — сети `edge` (proxy ↔ web), `app` (web ↔ cms ↔ bot, без интернета), `egress` (bot → Telegram); наружу только 80/443.

## Быстрый старт

```bash
make dot-env   # .env из .env.example, секреты генерируются; вписать TG_TOKEN
make run       # env/*.env, сборка, запуск, логи web
```

Сайт — <http://localhost> и <https://localhost> (сертификат локального CA Caddy). CMS — <http://localhost:5703/_/>: `make cms-admin` создаёт суперпользователя, `make cms-seed` заливает `cms/seed`.

## Команды

| Команда                       | Что делает                                                             |
| ----------------------------- | ---------------------------------------------------------------------- |
| `make dot-env`                | новый `.env` (есть — не трогает); на сервере `make dot-env ENV=prod`   |
| `make env`                    | `.env` → `env/<сервис>.env`, недостающие секреты дописываются в `.env` |
| `make env-check`              | сверка `.env` с манифестом: в prod — ошибки, в dev — предупреждения    |
| `make run`                    | `env` + `up -d --build`; в dev — затем логи web                        |
| `make deploy`                 | то же без логов — для сервера                                          |
| `make rerun` / `recreate-web` | пересборка web, bot, cms / только web; proxy не трогается              |
| `make stop` / `make clean`    | остановить; `clean` удаляет и тома, в том числе сертификаты Caddy      |
| `make logs S=web`             | логи сервиса (без `S` — всех)                                          |
| `make cms-seed`               | `bun scripts/cms-seed.ts --url $CMS_URL`                               |
| `make cms-admin`              | суперпользователь PocketBase из `CMS_LOGIN` / `CMS_PASSWORD`           |
| `make proxy-reload`           | перечитать Caddyfile без перезапуска proxy                             |
| `make check`                  | `check-bot`, `check-web`, `check-compose`, `check-proxy`               |

Режим берётся из `ENV` в `.env`; `make <команда> ENV=prod` его переопределяет. Форматирование и линт — `bunx @biomejs/biome check .` (`biome.json`).

## Окружение

Единственный источник — манифест [`scripts/env/keys.toml`](scripts/env/keys.toml): кому раздаётся ключ и откуда значение. [`scripts/env/generate.ts`](scripts/env/generate.ts) (Bun, без зависимостей) пишет из него `.env.example`, раскладывает `.env` по `env/<сервис>.env` (их читают `dev.yml` и `prod.yml`) и проверяет `.env`. Команды: `example`, `dot-env`, `split`, `check`, `get KEY`; `--root` — другой каталог вместо корня репозитория.

| Ключ                | Вид       | Сервисы    | Значение                                      |
| ------------------- | --------- | ---------- | --------------------------------------------- |
| `ENV`               | режим     | хост       | `dev` \| `prod`                               |
| `CMS_URL`           | хост      | хост       | `http://localhost:5703` — для `make cms-seed` |
| `DOMAIN`            | настройка | proxy, cms | `localhost`, в prod `a-sharapov.com`          |
| `ACME_EMAIL`        | настройка | proxy      | `webmaster@a-sharapov.com`                    |
| `WEB_PORT`          | настройка | web        | `5701`                                        |
| `PB_URL`            | выводится | web        | `http://cms:5703`                             |
| `BOT_URL`           | выводится | web        | `http://bot:5702`                             |
| `CACHE_STRATEGY`    | настройка | web        | `file` \| `memory` — кэш контента CMS         |
| `BOT_SERVICE_TOKEN` | секрет    | web, bot   | генерируется                                  |
| `TG_PORT`           | настройка | bot        | `5702`                                        |
| `TG_TOKEN`          | внешний   | bot        | от @BotFather, в prod обязателен              |
| `TG_MANAGER_TOKEN`  | секрет    | bot        | генерируется; ключи менеджеров через запятую  |
| `BOT_DB_PATH`       | настройка | bot        | `./data/bot.db`                               |
| `CMS_PORT`          | настройка | cms        | `5703`                                        |
| `CMS_LOGIN`         | настройка | cms        | `admin@a-sharapov.com`                        |
| `CMS_PASSWORD`      | секрет    | cms        | генерируется                                  |

Новый ключ: строка в `keys.toml` → `bun scripts/env/generate.ts example` → `make env` и пересоздание сервиса.

**Старый `.env` (nginx + certbot).** `make env` понимает прежние имена: `MAIN_DOMAIN_NAME` → `DOMAIN` (хвостовой `# комментарий` отбрасывается), `DOMAIN_NAME_EMAIL` → `ACME_EMAIL`; `TG_TOKEN` и `TG_MANAGER_TOKEN` остаются как есть, `BOT_SERVICE_TOKEN` и `CMS_PASSWORD` допишутся сами. `make env-check` перечислит, что переименовать и что удалить: `CERTBOT_SERVICE_NAME`, `NGINX_SERVICE_NAME`, `WEB_SERVICE_NAME`, `TG_SERVICE_NAME`, `WEB_ROOT`, `TG_ROOT`, `TG_ACCESS_KEY`.

## Prod

На сервере нужны Docker с Compose, `make`, git, curl и Bun (скрипты окружения). Всё ставит скрипт подготовки — `scripts/setup/ubuntu.sh` или `scripts/setup/fedora.sh`. Это один самодостаточный файл: репозиторий на сервере не нужен, повторный запуск безопасен.

```bash
scp scripts/setup/ubuntu.sh root@host: && ssh root@host bash ubuntu.sh   # или: ssh root@host 'bash -s' < scripts/setup/ubuntu.sh
```

Скрипт ставит пакеты, Docker из download.docker.com и Bun, создаёт пользователя `deploy` с ключом GitHub Actions и открывает 80/443. В конце он печатает таблицу для окружения `production` в GitHub: `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_URL`, `DEPLOY_HOST_KEY` и секрет `DEPLOY_SSH_KEY`. Пару ключей скрипт создаёт сам: закрытый печатается один раз и на сервере не остаётся. Свой открытый ключ можно передать через `--key "ssh-ed25519 …"`. Прочие ключи — `--user`, `--host`, `--domain`, `--path`; `--local` — рабочая машина (только пакеты, Docker и Bun, вы — в группе `docker`). Справка — `--help`.

```bash
make dot-env ENV=prod   # ENV=prod, DOMAIN=a-sharapov.com, секреты; вписать TG_TOKEN
make env-check          # пустой TG_TOKEN или DOMAIN=localhost — ошибка
make deploy
make cms-admin
```

- DNS `a-sharapov.com` и `www` указывают на сервер, открыты 80/tcp, 443/tcp и 443/udp. Сертификаты Let's Encrypt Caddy выпускает и продлевает сам (том `caddy_data`).
- `www` → apex (308), `/page.html` → `/page` (301). Пока web пересобирается, proxy отдаёт `proxy/assets/fallback.html`; `/health` проверяет сам proxy.
- После правки `proxy/Caddyfile.prod` или `proxy/snippets/*` — `make proxy-reload`.

### CI/CD

- CI (`.github/workflows/ci.yml`) — на push и PR в `master`: biome, тесты и сборка web и бота, `astro check`, compose, Caddyfile, скрипты деплоя, сборка prod-образов. Локально то же — `make check` и `make check-images`.
- Деплой (`.github/workflows/deploy.yml`) — вручную из Actions, только для коммита `master` с зелёным CI: bundle по SSH, на сервере `scripts/deploy/server.sh` — сборка, запуск, проверка здоровья, при сбое откат на прежнюю версию, затем сиды изменённых файлов `cms/seed`.
- Окружение GitHub `production`: секрет `DEPLOY_SSH_KEY`, переменные `DEPLOY_HOST`, `DEPLOY_HOST_KEY` (ключ из таблицы скрипта подготовки или строка `known_hosts`), `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_URL`, при нестандартном порте — `DEPLOY_PORT`.

### Админка CMS через SSH-туннель

В prod CMS не публикуется ни наружу, ни на localhost сервера: она только во внутренней сети `app`. Хост видит контейнер по его IP в этой сети, туда и ведёт туннель:

```bash
CMS_IP=$(ssh user@a-sharapov.com "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' a-sharapov_cms")
ssh -N -L 5703:$CMS_IP:5703 user@a-sharapov.com
```

Админка — <http://localhost:5703/_/>. Сиды в prod — на сервере (учётные данные — из его `.env`):

```bash
make cms-seed CMS_URL=http://$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' a-sharapov_cms):5703
```
