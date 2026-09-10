#!/usr/bin/env bash

set -euo pipefail

APP="/home/runner/workspace/artifacts/print-fixture-orders"
cd "$APP"

export PORT=25034
export EXPO_PUBLIC_DOMAIN="${REPLIT_DEV_DOMAIN:-}"
export EXPO_PUBLIC_REPL_ID="${REPL_ID:-}"

exec pnpm exec expo start \
  --go \
  --tunnel \
  --port "$PORT"
