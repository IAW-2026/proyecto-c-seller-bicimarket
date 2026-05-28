# BiciMarket — Seller App

App del vendedor dentro de **BiciMarket**, un marketplace de bicicletas construido como sistema de cuatro apps Next.js independientes que se comunican via REST.

**Owner:** Pierino Spina
**Deploy:** 

## Apps del sistema

| App | Owner | Rol |
|-----|-------|-----|
| Buyer App | Camila Rojas | Carrito y órdenes |
| **Seller App** | **Pierino Spina** | Catálogo y ventas |
| Shipping App | Enrique Seitz | Envíos y tracking |
| Payments App | Rocco Paoloni | Pagos y liquidaciones |

## Stack tecnológico

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Autenticación:** Clerk
- **Base de datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Data fetching:** TanStack Query + Axios
- **Deploy:** Vercel

## Setup local

```bash
git clone <url-del-repo>
cd seller-app
npm install
cp .env.example .env.local   # completar las variables
npx prisma migrate deploy
npx prisma generate
npm run dev                  # http://localhost:3000
```

> Después de cada `npm install` o cambio en `schema.prisma`, correr `npx prisma generate`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión pooled a Supabase (runtime) |
| `DIRECT_URL` | Conexión directa a Supabase (migraciones) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk — clave pública |
| `CLERK_SECRET_KEY` | Clerk — clave secreta |
| `INCOMING_SERVICE_TOKEN` | Token que deben enviar las otras apps en `X-Service-Token` |
| `OUTGOING_SERVICE_TOKEN` | Token que esta app usa para llamar a las otras apps |
| `SHIPPING_APP_URL` | URL base de la Shipping App |
| `PAYMENTS_APP_URL` | URL base de la Payments App |

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── admin/seller-profiles/[id]/verification/  # PATCH — admin only
│   │       ├── products/                                 # GET (catálogo público), POST
│   │       ├── products/[productId]/                     # GET, PATCH, DELETE
│   │       ├── products/[productId]/availability/        # GET — server-to-server
│   │       ├── products/[productId]/images/              # POST, DELETE
│   │       ├── sales-orders/                             # GET, POST (recibe de Payments)
│   │       ├── sales-orders/[id]/accept|reject|prepare/  # POST — acciones de estado
│   │       ├── sales-orders/[id]/payment-status/         # PATCH — recibe de Payments
│   │       ├── sales-orders/[id]/shipping-status/        # PATCH — recibe de Shipping
│   │       ├── seller-profile/[id]/                      # GET — server-to-server
│   │       ├── seller-profile/[id]/pickup-address/       # GET — server-to-server
│   │       ├── seller-profile/me/                        # GET, PUT
│   │       ├── seller-profile/me/products/               # GET — todos los estados
│   │       └── settlements/                              # GET — proxy a Payments App
│   ├── dashboard/                                        # Dashboard del vendedor (protegido)
│   │   └── _components/
│   │       ├── orders-tab.tsx
│   │       ├── products-tab.tsx
│   │       ├── profile-tab.tsx
│   │       └── settlements-tab.tsx
│   ├── products/                                         # Catálogo público
│   ├── api-docs/                                         # Swagger UI
│   ├── sign-in/ y sign-up/
│   └── page.tsx                                          # Home pública
├── hooks/                   # useSellerProfile, useSellerProducts, useSalesOrders, useSettlements
├── lib/
│   ├── api-utils.ts         # requireAuth, requireAdmin, requireSellerProfile, requireServiceToken
│   ├── inter-app.ts         # HTTP client con retry 3x (1s/3s/9s) y timeout 5s
│   ├── prisma.ts
│   └── axios.ts
└── generated/               # Prisma client (gitignored)
prisma/
├── schema.prisma
└── migrations/
docs/                        # Especificaciones Etapa 1
```

## API pública (catálogo)

Estos endpoints no requieren autenticación:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/products` | Catálogo filtrable y paginado (solo productos `active`) |
| `GET` | `/api/v1/products/{id}/availability` | Confirma disponibilidad, retorna precio y peso |

Parámetros de filtro en `GET /api/v1/products`: `q`, `category`, `brand`, `condition`, `seller_id`, `min_price_cents`, `max_price_cents`, `sort`, `page`, `limit`.

## API server-to-server

Requieren `X-Service-Token: <INCOMING_SERVICE_TOKEN>` + `X-Request-Id: <uuid>`:

| Método | Ruta | Llamada por |
|--------|------|-------------|
| `POST` | `/api/v1/sales-orders` | Payments App — crea sub-orden tras pago aprobado |
| `PATCH` | `/api/v1/sales-orders/{id}/payment-status` | Payments App |
| `PATCH` | `/api/v1/sales-orders/{id}/shipping-status` | Shipping App |
| `GET` | `/api/v1/seller-profile/{id}` | Cualquier app — perfil completo |
| `GET` | `/api/v1/seller-profile/{id}/pickup-address` | Shipping App |

## API del dashboard (requiere sesión Clerk)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET/PUT` | `/api/v1/seller-profile/me` | Ver/crear/editar perfil propio |
| `GET` | `/api/v1/seller-profile/me/products` | Todos los productos del vendedor (todos los estados) |
| `GET/POST` | `/api/v1/products` | Listar activos / crear producto |
| `GET/PATCH/DELETE` | `/api/v1/products/{id}` | Ver / editar / archivar producto |
| `POST/DELETE` | `/api/v1/products/{id}/images` | Agregar / eliminar imagen |
| `GET` | `/api/v1/sales-orders` | Órdenes de venta del vendedor |
| `POST` | `/api/v1/sales-orders/{id}/accept` | Aceptar orden |
| `POST` | `/api/v1/sales-orders/{id}/reject` | Rechazar orden (dispara reembolso) |
| `POST` | `/api/v1/sales-orders/{id}/prepare` | Marcar como lista para enviar |
| `GET` | `/api/v1/settlements` | Liquidaciones (proxy a Payments App) |

## API de administración (requiere sesión Clerk con `publicMetadata.admin = true`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `PATCH` | `/api/v1/admin/seller-profiles/{id}/verification` | Cambiar estado de verificación |

Body: `{ "status": "verified" | "pending_review" | "suspended" }`

Para dar permisos de admin a un usuario: Clerk Dashboard → Users → usuario → Public metadata → `{ "admin": true }`.

## Convenciones de la API

- Todas las rutas bajo `/api/v1/`
- Errores: `{ "error": { "code": "SCREAMING_SNAKE_CASE", "message": "...", "details": {} } }`
- Paginación: `{ "data": [...], "pagination": { "total", "page", "limit", "has_more" } }` — default `limit=20`, max `limit=100`
- Idempotencia: `POST /api/v1/products` acepta header `Idempotency-Key: <uuid>` — reenviar con la misma clave retorna el producto existente sin crear un duplicado

## Dashboard del vendedor

Acceso en `/dashboard` (requiere login). Tabs disponibles:

- **Pedidos** — órdenes de venta con acciones (aceptar / rechazar / preparar)
- **Catálogo** — lista de productos propios en todos los estados (borrador, activo, pausado, archivado). El botón "Nuevo producto" solo aparece si el perfil está `verified`
- **Liquidaciones** — resumen de pagos liquidados por Payments App
- **Mi perfil** — datos fiscales, dirección de retiro, estado de verificación. Los admins ven botones para cambiar el estado directamente desde el dashboard

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # prisma generate + next build
npm run lint         # ESLint

npx prisma generate          # Regenerar cliente (después de npm install o cambio de schema)
npx prisma migrate deploy    # Aplicar migraciones pendientes
npx prisma studio            # Explorar la DB en el navegador
```
