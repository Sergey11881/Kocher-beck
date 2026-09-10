# Replit Expo runtime

The mobile artifact is routed through the Expo domain router:

- artifact: `artifacts/print-fixture-orders`
- router: `expo-domain`
- port: `25034`
- preview path: `/print-fixture-orders/`
- health check: `/status`

Start the development runtime from the repository root with:

    PORT=25034 pnpm -C artifacts/print-fixture-orders run dev

The Replit artifact workflow runs the same command automatically. The Expo
command uses `--host lan`; do not replace it with `--host 0.0.0.0`.

The helper command is:

    pnpm -C artifacts/print-fixture-orders run replit:expo

It defaults to port `25034` when `PORT` is not supplied. A healthy packager
responds to:

    curl http://127.0.0.1:25034/status

with:

    packager-status:running

The `libglib-2.0.so.0` message from React Native DevTools may appear in the
Replit environment. It is non-blocking when Metro remains running and the
status endpoint responds.
