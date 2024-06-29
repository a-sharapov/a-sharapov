-include .env
export $(shell sed 's/=.*//' .env)

PROJECT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

PHONY: run rerun restore recreate-app stop clean certbot-init nginx-reload

check-env:
	@if [ ! -f $(PROJECT_DIR)/.env ]; then $(MAKE) dot-env; fi

dot-env:
	@cp $(PROJECT_DIR)/.env.example $(PROJECT_DIR)/.env
	@sed -i -e "s/TG_ACCESS_KEY=.*/TG_ACCESS_KEY=\"$$(tr -dc '[:alnum:]' < /dev/urandom | fold -w 32 | head -n 1)\"/" $(PROJECT_DIR)/.env
	@sed -i -e "s/TG_MANAGER_TOKEN=.*/TG_MANAGER_TOKEN=\"$$(tr -dc '[:alnum:]' < /dev/urandom | fold -w 32 | head -n 1)\"/" $(PROJECT_DIR)/.env

run:
	@echo "Starting containers for $(ENV) environment"
	@make check-env
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml up -d
	@docker logs -f $(WEB_SERVICE_NAME)

rerun:
	@echo "Restarting containers for $(ENV) environment"
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml up --build -d
	@docker logs -f $(WEB_SERVICE_NAME)

recreate-app:
	@echo "Recreating app for $(ENV) environment"
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml up --build --force-recreate --no-deps -d $(WEB_SERVICE_NAME) 

stop:
	@echo "Stopping containers"
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml down

clean:
	@echo "Cleaning"
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml down -v --remove-orphans
	@rm -rf @logs/*

init:
	@echo "Initializing SSL certificate for ${MAIN_DOMAIN_NAME}"
	@cp $(PROJECT_DIR)/proxy/init.conf.tpl $(PROJECT_DIR)/proxy/init.conf
	@sed -i -e "s/\[+MAIN_DOMAIN_NAME+\]/$(MAIN_DOMAIN_NAME)/g" $(PROJECT_DIR)/proxy/init.conf
	@cp $(PROJECT_DIR)/proxy/prod.conf.tpl $(PROJECT_DIR)/proxy/prod.conf
	@sed -i -e "s/\[+MAIN_DOMAIN_NAME+\]/$(MAIN_DOMAIN_NAME)/g" $(PROJECT_DIR)/proxy/prod.conf
	@docker compose -f $(PROJECT_DIR)/compose.init.yml up --build

nginx-recreate:
	@echo "Recreating NGINX"
	@docker compose -f $(PROJECT_DIR)/compose.$(ENV).yml up --build -d $(NGINX_SERVICE_NAME)

nginx-reload:
	@echo "Reloading NGINX"
	@docker exec -it $(NGINX_SERVICE_NAME) nginx -s reload
