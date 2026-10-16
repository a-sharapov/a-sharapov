-include ../.env
export $(shell sed 's/=.*//' ../.env 2>/dev/null)

CMS_PORT ?= 5703
PB_VERSION ?= 0.40.5
PB_OS := $(shell uname -s | tr '[:upper:]' '[:lower:]')
PB_ARCH := $(shell uname -m | sed -e 's/x86_64/amd64/' -e 's/aarch64/arm64/')

.PHONY: start reg init

pocketbase:
	@echo "Downloading PocketBase $(PB_VERSION) ($(PB_OS)_$(PB_ARCH))"
	@curl -fsSL -o pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v$(PB_VERSION)/pocketbase_$(PB_VERSION)_$(PB_OS)_$(PB_ARCH).zip
	@unzip -oq pocketbase.zip pocketbase && rm pocketbase.zip

start: pocketbase
	@echo "Starting CMS"
	./pocketbase serve --http=0.0.0.0:$(CMS_PORT)

reg: pocketbase
	@echo "Registering CMS superuser"
	@./pocketbase superuser upsert $(CMS_LOGIN) $(CMS_PASSWORD)

init: reg start
