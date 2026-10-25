-include .env
ifneq (,$(wildcard .env))
export $(shell sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env)
endif

PROJECT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
ENV ?= dev
ENV := $(strip $(ENV))
CMS_URL ?= http://localhost:5703

ifeq ($(filter $(ENV),dev prod),)
$(error ENV=$(ENV) недопустим; нужен dev или prod)
endif

DC := docker compose -f $(PROJECT_DIR)/$(ENV).yml
GENERATE := bun $(PROJECT_DIR)/scripts/env/generate.ts --mode $(ENV)
GENERATE_PROD := bun $(PROJECT_DIR)/scripts/env/generate.ts --mode prod
CADDY := docker run --rm -v $(PROJECT_DIR)/proxy:/etc/caddy:ro,z
SHELLCHECK := docker run --rm -v $(PROJECT_DIR)/scripts:/mnt:ro,z -w /mnt koalaman/shellcheck:v0.10.0
BIOME := @biomejs/biome@2.4.10
APP := web bot cms

.PHONY: help dot-env env env-check run deploy rerun recreate-web stop clean logs \
	cms-seed cms-admin proxy-reload video check check-lint check-bot check-web check-compose check-proxy \
	check-deploy check-images

help: ## Список команд
	@grep -E '^[a-z-]+:.*## ' $(PROJECT_DIR)/Makefile | sed 's/:.*## /\t/' | expand -t 16

dot-env: ## Новый .env со сгенерированными секретами (есть — не трогает); prod: make dot-env ENV=prod
	@$(GENERATE) dot-env

env: ## .env → env/<сервис>.env; недостающие секреты дописываются в .env
	@[ -f $(PROJECT_DIR)/.env ] || $(GENERATE) dot-env
	@$(GENERATE) split

env-check: ## Проверка .env по манифесту (prod — ошибки, dev — предупреждения)
	@$(GENERATE) check

run: env ## Сборка и запуск; в dev — затем логи web
	@$(DC) up -d --build --remove-orphans
ifeq ($(ENV),dev)
	@$(DC) logs -f web
endif

deploy: env ## Сборка и запуск без логов (сервер)
	@$(DC) up -d --build --remove-orphans

rerun: env ## Пересборка и перезапуск web, bot, cms (proxy не трогает)
	@$(DC) up -d --build --force-recreate $(APP)
ifeq ($(ENV),dev)
	@$(DC) logs -f web
endif

recreate-web: env ## Пересборка и перезапуск только web
	@$(DC) up -d --build --force-recreate --no-deps web

stop: ## Остановить и удалить контейнеры
	@$(DC) down

clean: ## Остановить и удалить контейнеры и тома
	@$(DC) down -v --remove-orphans

logs: ## Логи: make logs [S=web]
	@$(DC) logs -f --tail=200 $(S)

cms-seed: ## Сиды cms/seed → PocketBase по CMS_URL (prod — через SSH-туннель); ONLY=pages,i18n,contacts
	@CMS_LOGIN="$$($(GENERATE) get CMS_LOGIN)" CMS_PASSWORD="$$($(GENERATE) get CMS_PASSWORD)" \
	    bun $(PROJECT_DIR)/scripts/cms-seed.ts --url "$(CMS_URL)" $(if $(ONLY),--only $(ONLY))

cms-admin: ## Создать или обновить суперпользователя PocketBase из CMS_LOGIN / CMS_PASSWORD
	@$(DC) exec cms ./pocketbase superuser upsert "$$($(GENERATE) get CMS_LOGIN)" "$$($(GENERATE) get CMS_PASSWORD)"

proxy-reload: ## Перечитать Caddyfile без перезапуска proxy
	@$(DC) exec proxy caddy reload --config /etc/caddy/Caddyfile

video: ## Клипы видеоверсии из dev-сцены (make run, Chrome и GPU); ONLY=intro,intro-resume THEME=light
	@cd $(PROJECT_DIR)/scripts/video && bun install --frozen-lockfile --silent && \
	    bun record.ts $(if $(ONLY),--only $(ONLY)) $(if $(THEME),--theme $(THEME))

check: check-lint check-bot check-web check-compose check-proxy check-deploy ## Все проверки (как CI; образы — check-images)

check-lint: ## Biome: формат и линт всего репозитория
	@cd $(PROJECT_DIR) && bunx $(BIOME) ci .

check-bot: ## Бот: install, тесты, проверка типов, сборка бинарника
	@cd $(PROJECT_DIR)/bot && bun install --frozen-lockfile && bun test && bun run check && bun run build

check-web: ## Web: install, тесты, сборка
	@cd $(PROJECT_DIR)/web && bun install --frozen-lockfile && bun run test && bun run check && bun run build

check-compose: ## dev.yml и prod.yml: docker compose config
	@bash $(PROJECT_DIR)/scripts/compose-check.sh

check-proxy: ## Caddyfile.dev и Caddyfile.prod: caddy validate
	@out="$$($(CADDY) caddy:2-alpine caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile.dev 2>&1)" \
	    || { echo "$$out"; exit 1; }
	@out="$$($(CADDY) -e DOMAIN="$$($(GENERATE_PROD) get DOMAIN)" -e ACME_EMAIL="$$($(GENERATE_PROD) get ACME_EMAIL)" \
	    caddy:2-alpine caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile.prod 2>&1)" \
	    || { echo "$$out"; exit 1; }
	@echo "check-proxy: OK"

check-deploy: ## Скрипты деплоя и подготовки машины: shellcheck и тесты
	@$(SHELLCHECK) -x deploy/receive.sh deploy/server.sh deploy/seed-targets.sh deploy/seed-targets.test.sh \
	    setup/ubuntu.sh setup/fedora.sh compose-check.sh
	@bash $(PROJECT_DIR)/scripts/deploy/seed-targets.test.sh

check-images: ## Сборка prod-образов web, bot, cms
	@docker build -q -f $(PROJECT_DIR)/@docker/web.prod -t a-sharapov-check/web $(PROJECT_DIR)/web >/dev/null
	@docker build -q -f $(PROJECT_DIR)/@docker/bot.prod -t a-sharapov-check/bot $(PROJECT_DIR) >/dev/null
	@docker build -q -f $(PROJECT_DIR)/@docker/cms.prod -t a-sharapov-check/cms $(PROJECT_DIR)/cms >/dev/null
	@echo "check-images: OK (web, bot, cms)"
