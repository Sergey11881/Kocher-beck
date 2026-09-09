# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- The API uses the existing SQLite database at `artifacts/api-server/data/toolorder.db`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Python Flask
- DB: SQLite
- Validation: request validation in `server.py`, OpenAPI-generated clients and schemas
- API codegen: Orval (from OpenAPI spec)
- Build: Python bytecode compilation

## Where things live

The supported API implementation is `artifacts/api-server/server.py`. Replit development and
production both run this file. `lib/api-spec/openapi.yaml` is the HTTP contract; generated
clients and Zod schemas are derived from it.

## Architecture decisions

The legacy TypeScript/Express scaffold was removed because it was not used by Replit,
did not implement the product or order endpoints, and could diverge from the Flask API.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
