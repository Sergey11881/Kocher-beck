#!/usr/bin/env bash

set -euo pipefail

APP="/home/runner/workspace/artifacts/print-fixture-orders"
cd "$APP"

export PORT=25034
export EXPO_PUBLIC_DOMAIN="${REPLIT_DEV_DOMAIN:-}"
export EXPO_PUBLIC_REPL_ID="${REPL_ID:-}"
export EXPO_PACKAGER_PROXY_URL="https://${REPLIT_EXPO_DEV_DOMAIN:?REPLIT_EXPO_DEV_DOMAIN is required}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${REPLIT_EXPO_DEV_DOMAIN}"

exec pnpm exec expo start \
  --go \
  --localhost \
  --port "$PORT"
