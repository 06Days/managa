#!/usr/bin/env bash
set -euo pipefail

# Pull the latest managa commit and rebuild the Docker stack. Intended to run
# from cron on a self-hosted host. Local runtime state lives in data/ and the
# Docker volume, both of which are left alone by git.
REPO_DIR="${MANAGA_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BRANCH="${MANAGA_UPDATE_BRANCH:-main}"
LOCK_FILE="${TMPDIR:-/tmp}/managa-auto-update.lock"

log() {
  printf '[managa-update %s] %s\n' "$(date -Is)" "$*"
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another update is already running"
  exit 0
fi

cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "$REPO_DIR is not a git checkout"
  exit 1
fi

log "fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"

# Fast-forward when possible. If this checkout has local commits (for example
# because it was seeded by rsync while GitHub was unavailable), rebase them on
# top of the remote instead of discarding them.
if git merge-base --is-ancestor HEAD "origin/$BRANCH"; then
  git reset --hard "origin/$BRANCH"
else
  if ! git pull --rebase --autostash origin "$BRANCH"; then
    git rebase --abort >/dev/null 2>&1 || true
    log "rebase failed; leaving the checkout untouched"
    exit 1
  fi
fi

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
else
  log "docker compose is not installed"
  exit 1
fi

log "rebuilding and restarting containers"
"${compose[@]}" up -d --build --remove-orphans

log "done at $(git rev-parse --short HEAD)"
