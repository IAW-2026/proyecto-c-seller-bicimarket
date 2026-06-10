# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # prisma generate + next build
npm run lint         # ESLint

npx prisma generate  # Regenerate client after schema changes or npm install
npx prisma migrate dev  # Run pending migrations
npx prisma studio    # Browse DB in browser
```

> After every `npm install` or `schema.prisma` change, run `npx prisma generate` before starting the server.

No test framework is configured.

## What this app is

**Seller App** — one of four isolated Next.js apps forming **BiciMarket**, a bicycle marketplace. Each app has its own PostgreSQL database, its own Clerk instance, and communicates with the others exclusively via REST over HTTP.

| App | Owner | Role |
|-----|-------|------|
| Buyer App | Camila Rojas | Cart, orders — `order_id` source of truth |
| **Seller App** | **Pierino Spina** | Catalog, sales orders — `product_id` source of truth |
| Shipping App | Enrique Seitz | Shipments, tracking |
| Payments App | Rocco Paoloni | Payments, settlements, Mercado Pago integration |

**Key constraint:** No stock management. Every `active` product has unlimited availability. No `stock` field, no `INSUFFICIENT_STOCK` error.

## Seller App responsibilities

**Owns:**
- `seller_profiles` (with `verification_status`; product activation requires `verified`)
- `products` (source of truth for price and `weight_grams`)
- `product_images`
- `sales_orders` (sub-orders created by Payments App after payment approval)
- `sales_order_items` (with price snapshot)

**Exposes to other apps:**
- `GET /api/v1/products` — filterable, paginated catalog
- `GET /api/v1/products/{id}/availability` — confirms `active` status, returns price + weight
- `POST /api/v1/sales-orders` — receives from Payments App after payment
- `PATCH /api/v1/sales-orders/{id}/payment-status` — receives from Payments App
- `PATCH /api/v1/sales-orders/{id}/shipping-status` — receives from Shipping App
- `GET /api/v1/seller-profile/{id}/pickup-address` — consumed by Shipping App

**Calls out to:**
- `POST /api/v1/shipments` (Shipping App) — when vendor marks `ready_to_ship`
- `GET /api/v1/settlements?sellerId=X` (Payments App)

## API conventions (must follow for inter-app compatibility)

All endpoints under `/api/v1/...`.

**Auth:**
- UI → own backend: `Authorization: Bearer <JWT>` (validated against this app's Clerk)
- Server → server: `X-Service-Token: <secret>` + `X-Request-Id: <uuid>`

**Error format:**
```json
{ "error": { "code": "SCREAMING_SNAKE_CASE", "message": "...", "details": {} } }
```

**Pagination** (all GET list endpoints):
```json
{ "data": [...], "pagination": { "total": N, "page": 1, "limit": 20, "has_more": true } }
```
Default `limit=20`, max `limit=100`.

**Idempotency:** All `POST` endpoints accept `Idempotency-Key` header.

**Retry on outgoing calls:** 3 attempts, linear backoff 1s/3s/9s, 5s timeout.

## Authentication

Clerk handles auth. The middleware (`src/middleware.ts`) uses `clerkMiddleware`:
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhooks`, and the catalog endpoints
- Protected routes (e.g. `/dashboard`): call `auth.protect()`

**Auth flow:** `requireAuth()` in `src/lib/api-utils.ts` upserts the user's email into the legacy `User` table on every authenticated request (intentional: keeps a local session record). The real seller data lives in `SellerProfile`, which is **not** auto-created — the vendor must call `PUT /api/v1/seller-profile/me` explicitly. `requireSellerProfile()` returns `404 SELLER_PROFILE_NOT_FOUND` if no profile exists yet.

JWT requires `sub` (Clerk user ID), `email`, `email_verified=true`. Admin endpoints check `publicMetadata.admin=true`.

## Database

PostgreSQL via Supabase. Two connection strings required:
- `DATABASE_URL` — pooled connection (runtime)
- `DIRECT_URL` — direct connection (migrations only)

Current models: `User` (with `Role` enum: `USER | ADMIN`) and `Product` (demo). Production schema per `docs/04-modelo-de-datos.md`.

Prisma client is generated into `src/generated/prisma/` (gitignored). Import from there or via the singleton in `src/lib/prisma.ts`.

## Key patterns

- **Server Components** use Prisma directly; **Client Components** (`"use client"`) use TanStack Query + Axios (`src/lib/axios.ts` baseURL: `/api`)
- Path alias: `@/*` → `src/*`
- UI components live in `src/components/ui/` (shadcn/ui)
- Zustand for client-only state (`src/store/`)
- `cn()` utility in `src/lib/utils.ts` for merging Tailwind classes

## Documentation

Full system specs in `docs/`:
- `01-descripcion.md` — system overview and main flows (sequence diagrams)
- `02-responsabilidades.md` — inter-app API contract table and transversal rules
- `03-apis.md` — endpoint specifications
- `04-modelo-de-datos.md` — complete DB schema for all four apps
- `05-usuarios.md` — Clerk setup and user provisioning
- `06-estados-y-diagramas.md` — state machines
