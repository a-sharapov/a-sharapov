#!/usr/bin/env bash
set -euo pipefail

BUN_VERSION=1.4.3
DOCKER_MIN=25
DOCKER_KEY=060A61C51B558A7F742B77AAC52FEB6B621E9F35
DOCKER_CONFLICTS=(moby-engine podman-docker)
KEY_MARK=a-sharapov-deploy
LOCAL=""
USER_NAME=deploy
PUBLIC_KEY=""
HOST=""
DOMAIN=a-sharapov.com
APP_PATH=""
SECRET=""
PRIVATE=""

usage() {
  cat <<'EOF'
Подготовка сервера Fedora для a-sharapov: git, make, curl, Docker Engine с Compose,
Bun, пользователь деплоя с ключом GitHub Actions, порты 80/443 в firewalld. В конце — таблица
для окружения production в GitHub. Файл самодостаточен: репозиторий на сервере не нужен.

  scp fedora.sh root@host: && ssh root@host bash fedora.sh
  ssh root@host 'bash -s' < fedora.sh
  ssh -t admin@host 'sudo bash fedora.sh --key "ssh-ed25519 AAAA… github-actions"'

  --user NAME     пользователь деплоя (deploy); создаётся, если его нет
  --key KEY       открытый ключ GitHub Actions; без него пара создаётся здесь,
                  закрытый ключ печатается один раз и на сервере не остаётся
  --host ADDR     DEPLOY_HOST — адрес, по которому GitHub ходит по SSH (по умолчанию IP сервера)
  --domain NAME   домен сайта для DEPLOY_URL (a-sharapov.com)
  --path DIR      DEPLOY_PATH (~NAME/a-sharapov)
  --local         рабочая машина: только пакеты, Docker и Bun; пользователь sudo — в группу docker

Повторный запуск безопасен: готовое пропускается.
EOF
}

log() { printf '[setup] %s\n' "$*"; }
warn() { printf '[setup] внимание: %s\n' "$*" >&2; }
die() {
  printf '[setup] ошибка: %s\n' "$*" >&2
  exit 1
}
quiet() {
  local out
  out="$("$@" 2>&1)" || {
    printf '%s\n' "$out" >&2
    die "не удалось: $*"
  }
}

while (($#)); do
  case "$1" in
    --user) USER_NAME="${2:?--user: нужно имя}" && shift 2 ;;
    --key) PUBLIC_KEY="${2:?--key: нужен открытый ключ}" && shift 2 ;;
    --host) HOST="${2:?--host: нужен адрес}" && shift 2 ;;
    --domain) DOMAIN="${2:?--domain: нужен домен}" && shift 2 ;;
    --path) APP_PATH="${2:?--path: нужен каталог}" && shift 2 ;;
    --local) LOCAL=1 && shift ;;
    -h | --help) usage && exit 0 ;;
    *) usage >&2 && die "неизвестный аргумент: $1" ;;
  esac
done

((EUID == 0)) || die "нужен root: sudo bash fedora.sh"
# shellcheck source=/dev/null
. /etc/os-release
[[ "${ID:-}" == fedora ]] || die "скрипт для Fedora, а здесь ${PRETTY_NAME:-неизвестная система}"

case "$(uname -m)" in
  x86_64) BUN_ASSET=bun-linux-x64 && { grep -qw avx2 /proc/cpuinfo || BUN_ASSET=bun-linux-x64-baseline; } ;;
  aarch64) BUN_ASSET=bun-linux-aarch64 ;;
  *) die "архитектура $(uname -m) не поддерживается" ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

packages() {
  log "пакеты: git, make, curl, unzip, gnupg2, iproute, openssh-clients"
  quiet dnf install -y ca-certificates curl git gnupg2 iproute make openssh-clients unzip
}

docker_repo() {
  local fingerprint
  curl -fsSL --retry 3 -o "$TMP/docker.asc" https://download.docker.com/linux/fedora/gpg
  fingerprint="$(gpg --homedir "$TMP" --show-keys --with-colons "$TMP/docker.asc" 2>/dev/null | awk -F: '$1 == "fpr" && !found { print $10; found = 1 }')"
  [[ "$fingerprint" == "$DOCKER_KEY" ]] || die "ключ репозитория Docker не совпал: ${fingerprint:-пусто}"
  rpm --import "$TMP/docker.asc"
  curl -fsSL --retry 3 -o /etc/yum.repos.d/docker-ce.repo https://download.docker.com/linux/fedora/docker-ce.repo
}

docker_install() {
  local installed="" package
  for package in "${DOCKER_CONFLICTS[@]}"; do
    rpm -q "$package" >/dev/null 2>&1 && installed+="$package "
  done
  [[ -z "$installed" ]] || die "мешают пакеты Fedora: ${installed% } — dnf remove ${installed% } и запустить снова"
  log "docker: репозиторий download.docker.com (Fedora $VERSION_ID)"
  docker_repo
  quiet dnf install -y iptables-nft docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

docker_check() {
  local major
  [[ "$(docker --version)" != *[Pp]odman* ]] || die "docker здесь — обёртка podman: dnf remove podman-docker и запустить снова"
  docker compose version >/dev/null 2>&1 || die "нет docker compose: поставьте плагин compose для своего Docker"
  major="$(docker --version | sed -E 's/^Docker version ([0-9]+).*/\1/')"
  ((major >= DOCKER_MIN)) || die "$(docker --version): нужна версия $DOCKER_MIN или новее (prod.yml: healthcheck start_interval) — обновите из download.docker.com"
}

docker_setup() {
  if command -v docker >/dev/null; then
    log "docker: уже есть"
  else
    docker_install
  fi
  docker_check
  if [[ -d /run/systemd/system ]]; then
    systemctl enable --now docker.service >/dev/null 2>&1 || die "systemctl enable --now docker не удался"
  else
    warn "systemd не запущен (контейнер?) — dockerd не включён, запустите его сами"
  fi
}

bun_setup() {
  local base="https://github.com/oven-sh/bun/releases/download/bun-v$BUN_VERSION"
  [[ "$(/usr/local/bin/bun --version 2>/dev/null)" == "$BUN_VERSION" ]] && log "bun $BUN_VERSION: уже есть" && return 0
  log "bun $BUN_VERSION: $BUN_ASSET → /usr/local/bin"
  curl -fsSL --retry 3 -o "$TMP/$BUN_ASSET.zip" "$base/$BUN_ASSET.zip"
  curl -fsSL --retry 3 -o "$TMP/SHASUMS256.txt" "$base/SHASUMS256.txt"
  (cd "$TMP" && awk -v file="$BUN_ASSET.zip" '$2 == file' SHASUMS256.txt | sha256sum -c --quiet --strict) ||
    die "контрольная сумма $BUN_ASSET.zip не совпала"
  unzip -q -o "$TMP/$BUN_ASSET.zip" -d "$TMP"
  install -m 0755 "$TMP/$BUN_ASSET/bun" /usr/local/bin/bun
  ln -sf bun /usr/local/bin/bunx
}

user_setup() {
  local user="$1"
  id "$user" >/dev/null 2>&1 || {
    useradd -m -s /bin/bash -p '*' "$user"
    log "пользователь $user создан (вход только по ключу)"
  }
  [[ " $(id -nG "$user") " == *" docker "* ]] && log "$user: уже в группе docker" && return 0
  usermod -aG docker "$user"
  log "$user: добавлен в группу docker (действует со следующего входа)"
}

key_add() {
  local user="$1" key="$2" home group file
  ssh-keygen -l -f <(printf '%s\n' "$key") >/dev/null 2>&1 || die "--key: это не открытый ключ SSH"
  home="$(getent passwd "$user" | cut -d: -f6)"
  group="$(id -gn "$user")"
  file="$home/.ssh/authorized_keys"
  install -d -m 700 -o "$user" -g "$group" "$home/.ssh"
  [[ ! -L "$file" ]] || die "$file — символическая ссылка, не трогаю"
  touch "$file"
  grep -qxF "$key" "$file" || printf '%s\n' "$key" >>"$file"
  chown "$user:$group" "$file"
  chmod 600 "$file"
  if command -v restorecon >/dev/null; then
    restorecon -R "$home/.ssh"
  fi
  log "$user: ключ в ~/.ssh/authorized_keys"
}

key_setup() {
  local user="$1" home
  home="$(getent passwd "$user" | cut -d: -f6)"
  if [[ -n "$PUBLIC_KEY" ]]; then
    key_add "$user" "$PUBLIC_KEY"
    SECRET="закрытый ключ пары, открытый передан в --key"
  elif grep -qs " $KEY_MARK@" "$home/.ssh/authorized_keys"; then
    log "$user: ключ GitHub Actions выдан при прошлом запуске"
    SECRET="выдан при прошлом запуске; новый — удалить строку $KEY_MARK@… из ~$user/.ssh/authorized_keys и запустить снова"
  else
    ssh-keygen -q -t ed25519 -N '' -C "$KEY_MARK@$(uname -n)" -f "$TMP/deploy"
    key_add "$user" "$(cat "$TMP/deploy.pub")"
    SECRET="закрытый ключ ниже, весь блок от BEGIN до END"
    PRIVATE="$TMP/deploy"
  fi
}

firewall_setup() {
  if command -v firewall-cmd >/dev/null && firewall-cmd --state >/dev/null 2>&1; then
    firewall-cmd -q --permanent --add-service=http --add-service=https --add-port=443/udp
    firewall-cmd -q --reload
    log "firewalld: открыты http, https и 443/udp"
  else
    log "firewalld не запущен — порты не трогаю"
  fi
}

ports_check() {
  local busy
  busy="$(ss -Hltnup 'sport = :80 or sport = :443' 2>/dev/null | grep -v docker-proxy || true)"
  [[ -z "$busy" ]] || warn "порты 80/443 заняты — остановите старый стек (nginx, certbot) до деплоя:"$'\n'"$busy"
}

memory_check() {
  local total
  total="$(awk '/^(MemTotal|SwapTotal):/ { sum += $2 } END { print int(sum / 1024) }' /proc/meminfo)"
  ((total >= 2048)) || warn "памяти с подкачкой ${total} МБ, а сборке web нужно ~1.5 ГБ — добавьте swap"
}

server_address() {
  local address
  address="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{ for (i = 1; i < NF; i++) if ($i == "src" && !found) { print $(i + 1); found = 1 } }')"
  printf '%s' "${address:-$(uname -n)}"
}

ssh_port() {
  local port
  port="$(sshd -T 2>/dev/null | awk '$1 == "port" && !found { print $2; found = 1 }')"
  printf '%s' "${port:-22}"
}

row() { printf '  │ %-16s │ %s │ %s\n' "$1" "$2" "$3"; }

table() {
  local user="$1" home host path pub=/etc/ssh/ssh_host_ed25519_key.pub
  local hostkey="нет $pub — взять из ssh-keyscan -t ed25519 <host>"
  home="$(getent passwd "$user" | cut -d: -f6)"
  host="${HOST:-$(server_address)}"
  path="${APP_PATH:-$home/a-sharapov}"
  [[ ! -r "$pub" ]] || hostkey="$(cut -d' ' -f1-2 "$pub")"
  printf '\nGitHub → Settings → Environments → production\n\n'
  printf '  ┌──────────────────┬────────────┬──────────────────────────────────────────\n'
  printf '  │ Имя              │ Вид        │ Значение\n'
  printf '  ├──────────────────┼────────────┼──────────────────────────────────────────\n'
  row DEPLOY_HOST "переменная" "$host"
  row DEPLOY_PORT "переменная" "$(ssh_port)"
  row DEPLOY_USER "переменная" "$user"
  row DEPLOY_PATH "переменная" "$path"
  row DEPLOY_URL "переменная" "https://$DOMAIN"
  row DEPLOY_HOST_KEY "переменная" "$hostkey"
  row DEPLOY_SSH_KEY "секрет    " "$SECRET"
  printf '  └──────────────────┴────────────┴──────────────────────────────────────────\n'
  [[ ! -r "$pub" ]] || printf '\n  отпечаток ключа хоста: %s\n' "$(ssh-keygen -lf "$pub" | awk '{ print $2 }')"
  if [[ -z "$HOST" && "$host" =~ ^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.) ]]; then
    printf '  %s — частный адрес: укажите публичный IP или имя сервера (--host)\n' "$host"
  fi
  if [[ -n "$PRIVATE" ]]; then
    printf '\nDEPLOY_SSH_KEY — скопировать целиком, на сервере его не останется:\n\n'
    cat "$PRIVATE"
  fi
  printf '\nДальше: Actions → Deploy. Первый запуск остановится на «нет .env»; тогда здесь\n'
  printf '  sudo -iu %s, cd %s, make dot-env ENV=prod, вписать TG_TOKEN — и снова Deploy.\n' "$user" "$path"
}

packages
docker_setup
bun_setup

if [[ -n "$LOCAL" ]]; then
  [[ -z "${SUDO_USER:-}" || "$SUDO_USER" == root ]] || user_setup "$SUDO_USER"
else
  user_setup "$USER_NAME"
  key_setup "$USER_NAME"
  firewall_setup
  ports_check
fi

memory_check
log "готово: $(docker --version | cut -d, -f1), compose $(docker compose version --short), bun $(/usr/local/bin/bun --version), $(git --version), $(make --version | sed -n 1p)"
[[ -n "$LOCAL" ]] || table "$USER_NAME"
