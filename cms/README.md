# CMS (PocketBase)

Контент сайта: страницы, контакты, строки интерфейса и заявки из формы обратной связи. Схема — миграции в `pb_migrations/` (в git), данные — `pb_data/` (не в git).

## Коллекции

| Коллекция   | Ключ             | Поля                                                                                                                                 | Доступ без токена        |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `i18n`      | `locale` unique  | `locale` (`^[a-z]{2}$`), `content` json                                                                                              | list/view                |
| `Pages`     | `slug`+`locale`  | `title` (меню и `<title>`), `longtitle`, `description`, `keywords`, `template` (`card` / `contacts` / `article`), `content` HTML, `sort`, `nav`, `published` | list/view: `published = true` |
| `Contacts`  | —                | `kind` (`phone` / `telegram` / `email` / `linkedin` / `github`), `label`, `href`, `group` (0..n), `sort`, `published`     | list/view: `published = true` |
| `Inquiries` | —                | `topic` ≤200, `contact` ≤200, `message` ≤4000, `locale` ≤2, `page` ≤200, `created`/`updated`                                         | только create            |

Изменение, создание и удаление (кроме create в `Inquiries`) — только superuser. Публичный create в `Inquiries` безопасен, потому что в prod PocketBase доступна только из docker-сети.

## Локально

```bash
make -C cms start   # скачает бинарник PocketBase (если нет) и поднимет :$CMS_PORT (5703)
make -C cms reg     # создать/обновить superuser из CMS_LOGIN / CMS_PASSWORD (.env)
```

Миграции применяются при старте. Superuser создаётся и миграцией `*_upsert_superuser.js`, если в окружении заданы `CMS_LOGIN` и `CMS_PASSWORD`. Миграция выполняется один раз, поэтому новый пароль задаётся через `make -C cms reg`.

Админка: `http://localhost:5703/_/`. Если в админке менять схему коллекций, PocketBase сам допишет миграции в `pb_migrations/` — их нужно закоммитить.

## Сиды

`seed/pages.json`, `seed/contacts.json`, `seed/i18n/<locale>.json` → API PocketBase:

```bash
make cms-seed                                  # из корня репозитория
bun scripts/cms-seed.ts --dry-run              # только план
bun scripts/cms-seed.ts --only i18n --replace  # перезаписать переводы целиком
```

- `i18n` — deep-merge в существующий `content`: ключи, которых нет в сиде, сохраняются. С `--replace` содержимое заменяется сидом.
- `Pages` — upsert по (`slug`, `locale`), `Contacts` — по (`kind`, `href`). Поля из сида перезаписывают правки, сделанные в админке. Записи, которых нет в сиде, не удаляются.
- Нужны `CMS_LOGIN` / `CMS_PASSWORD`. URL берётся из `--url`, `CMS_URL` или `http://localhost:5703`.

## Prod

Образ: `@docker/cms.prod` (контекст — `./cms`, порт 5703). `entrypoint.sh` берёт CORS-origins из `DOMAIN`. `pb_data` монтируется томом.
