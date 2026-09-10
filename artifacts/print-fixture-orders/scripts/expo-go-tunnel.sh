#!/usr/bin/env bash

set -euo pipefail

APP="/home/runner/workspace/artifacts/print-fixture-orders"
cd "$APP"

export PORT=25034

exec pnpm exec expo start \
  --go \
  --tunnel \
  --port "$PORT"
