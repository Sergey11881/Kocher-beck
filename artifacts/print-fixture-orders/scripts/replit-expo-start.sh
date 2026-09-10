#!/usr/bin/env bash

set -e

APP="/home/runner/workspace/artifacts/print-fixture-orders"
cd "$APP"

PORT="${PORT:-8081}"

echo "============================================================"
echo " KOCHER+BECK SMART ORDER — REPLIT EXPO"
echo "============================================================"
echo "PWD=$PWD"
echo "PORT=$PORT"
echo "REPLIT_DEV_DOMAIN=${REPLIT_DEV_DOMAIN:-<unset>}"
echo "REPLIT_EXPO_DEV_DOMAIN=${REPLIT_EXPO_DEV_DOMAIN:-<unset>}"
echo

# IMPORTANT:
# Expo CLI accepts only:
#   lan
#   tunnel
#   localhost
#
# DO NOT use:
#   0.0.0.0

exec pnpm exec expo start \
  --clear \
  --go \
  --host lan \
  --port "$PORT"
