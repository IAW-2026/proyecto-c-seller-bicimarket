# Explicación completa del Seller App — BiciMarket

Este archivo explica **qué es**, **por qué está hecho así** y **cómo funciona cada parte** del proyecto.

---

## 1. Contexto del sistema: ¿qué es BiciMarket?

BiciMarket es un marketplace de bicicletas dividido en **cuatro aplicaciones independientes**:

| App | Responsable | Qué hace |
|-----|-------------|----------|
| **Seller App** (este repo) | Pierino Spina | Gestiona vendedores, catálogo y pedidos de venta |
| Buyer App | Camila Rojas | Carrito y órdenes del comprador |
| Payments App | Rocco Paoloni | Pagos con Mercado Pago |
| Shipping App | Enrique Seitz | Envíos y tracking |

Cada app tiene su **propia base de datos** y su **propio sistema de usuarios**. Se comunican entre sí únicamente por llamadas HTTP (API REST). Esto se llama **arquitectura de microservicios**.

**¿Por qué microservicios?** Cada equipo puede desplegar, escalar y modificar su app sin romper las demás. El costo es que hay que coordinar contratos de API entre apps.

---

## 2. Tecnologías elegidas y por qué

### Next.js 16 (App Router)
**Qué es:** framework de React que permite hacer tanto el frontend (las páginas que ve el usuario) como el backend (las APIs) en el mismo proyecto.

**Por qué:** En lugar de tener un proyecto React separado y un servidor Express separado, Next.js los unifica. Esto reduce la complejidad y el deploy. El **App Router** (la carpeta `src/app/`) es la versión moderna de Next.js que usa Server Components por defecto.

**Clave:** En este proyecto, los archivos `route.ts` dentro de `src/app/api/` son las APIs del backend. Los archivos `page.tsx` son las páginas del frontend.

### TypeScript
**Qué es:** JavaScript con tipos. Si una variable debería ser un `string` y le pasás un `number`, TypeScript te avisa antes de ejecutar el código.

**Por qué:** En un sistema con múltiples apps que se comunican por HTTP, los tipos actúan como documentación viva y detectan errores en tiempo de compilación, no en producción.

### PostgreSQL + Supabase
**Qué es:** PostgreSQL es la base de datos relacional. Supabase es un servicio que la hostea en la nube.

**Por qué PostgreSQL:** es robusta, soporta transacciones ACID (si algo falla a la mitad, se deshace todo), y tiene tipos y relaciones que garantizan integridad de datos.

**Dos URLs (DATABASE_URL y DIRECT_URL):** Supabase usa un *connection pooler* (PgBouncer) para reutilizar conexiones en producción (DATABASE_URL). Las migraciones necesitan conexión directa porque usan transacciones especiales que el pooler no soporta (DIRECT_URL).

### Prisma
**Qué es:** ORM (Object-Relational Mapper). Permite interactuar con la base de datos usando TypeScript en vez de SQL crudo.

**Por qué:** El schema en `prisma/schema.prisma` define los modelos (tablas) una sola vez y genera automáticamente:
- El cliente TypeScript con autocompletado
- Las migraciones SQL
- Los tipos de las entidades

**Ejemplo:** En vez de `SELECT * FROM products WHERE status = 'active'`, escribís `prisma.product.findMany({ where: { status: 'active' } })` con tipado completo.

**Singleton pattern en `src/lib/prisma.ts`:**
```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```
En desarrollo, Next.js recarga el código con cada cambio (hot reload). Sin este patrón, se crearían miles de conexiones a la BD. El singleton guarda la instancia en `globalThis` para reutilizarla.

### Clerk
**Qué es:** servicio externo de autenticación. Maneja registro, login, sesiones y JWT.

**Por qué:** Implementar auth desde cero (hash de contraseñas, tokens, sesiones, OAuth) es complejo y propenso a vulnerabilidades de seguridad. Clerk lo hace por vos.

**Cómo funciona:** Cuando el usuario inicia sesión, Clerk genera un **JWT** (JSON Web Token) que el browser envía en cada request. El middleware de Next.js valida ese token antes de que llegue a los handlers.

**Lazy provisioning:** Los usuarios existen en Clerk primero. Un registro local (`User` en la BD) se crea recién en el primer request autenticado. Esto evita inconsistencias si el usuario se registra pero nunca usa la app.

### TanStack Query (React Query)
**Qué es:** librería para manejar datos del servidor en el cliente (browser).

**Por qué:** Sin React Query, para cargar datos desde una API tendrías que manejar manualmente: el estado de carga, el estado de error, el cache, la re-fetch cuando cambian los datos, etc. React Query lo hace automáticamente.

**Cómo se usa:** Los hooks en `src/hooks/` (como `useMyProducts`, `useSalesOrders`) encapsulan la lógica. Cuando llamás `useMyProducts()` en un componente, React Query:
1. Hace el fetch la primera vez
2. Guarda el resultado en cache con la key `["my-products"]`
3. Devuelve `{ data, isLoading, error }`
4. Cuando hacés una mutación (crear producto), invalida el cache y re-fetchea automáticamente

**`queryKey`:** Es el identificador del cache. Si dos componentes distintos piden `["my-products"]`, comparten el mismo cache y no se hacen dos fetches.

### Axios
**Qué es:** librería HTTP para el cliente (browser).

**Por qué sobre `fetch` nativo:** Axios intercepta automáticamente los errores HTTP (status >= 400), tiene mejor manejo de JSON, y permite configurar una `baseURL` global. En `src/lib/axios.ts`:
```ts
export const api = axios.create({ baseURL: "/api" });
```
Esto significa que `api.get("/v1/products")` llama a `/api/v1/products` — la propia API de Next.js en el mismo proyecto.

### Tailwind CSS v4
**Qué es:** framework de CSS utility-first. En vez de escribir clases CSS propias, usás clases predefinidas directamente en el HTML.

**Por qué:** Productividad. `className="flex items-center gap-2 text-sm font-medium"` es directo y no requiere crear archivos CSS separados. Con v4, la configuración se hace en CSS en vez de `tailwind.config.js`.

### shadcn/ui
**Qué es:** colección de componentes UI (botones, diálogos, formularios, etc.) construidos sobre Radix UI y Tailwind.

**Por qué:** Los componentes de shadcn se copian directo al proyecto (están en `src/components/ui/`), no son una dependencia externa. Eso significa que podés modificarlos sin restricciones. Están bien accesibles (teclado, screen readers) porque Radix UI maneja eso.

### Zustand
**Qué es:** librería de estado global del cliente.

**Por qué sobre Redux:** Zustand es mucho más simple. No requiere reducers, actions ni boilerplate. Para este proyecto, el estado global del cliente es mínimo (React Query maneja el estado del servidor), así que Zustand es suficiente.

---

## 3. Estructura de carpetas

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # Backend — rutas HTTP
│   │   └── v1/             # Endpoints públicos/inter-app
│   │       ├── products/   # Catálogo
│   │       ├── sales-orders/ # Pedidos
│   │       └── seller-profile/ # Perfil vendedor
│   ├── dashboard/          # Página principal del vendedor (protegida)
│   │   └── _components/    # Componentes privados del dashboard
│   ├── sign-in/            # Página de login (Clerk)
│   └── layout.tsx          # Layout raíz — providers globales
├── components/ui/          # shadcn/ui components
├── hooks/                  # Custom hooks (TanStack Query)
├── lib/                    # Utilidades compartidas
│   ├── api-utils.ts        # Helpers de auth y respuestas HTTP
│   ├── axios.ts            # Cliente HTTP configurado
│   ├── inter-app.ts        # Llamadas entre apps con retry
│   └── prisma.ts           # Singleton de Prisma
├── providers/              # Context providers de React
└── middleware.ts           # Auth middleware de Clerk
```

**Convención `_components/`:** El underscore al principio es una convención de Next.js. Las carpetas con underscore no se convierten en rutas URL; son privadas del componente padre.

---

## 4. El flujo de autenticación

```
Browser → Clerk (login) → JWT token
Browser → request con JWT → middleware.ts → válida con Clerk
Middleware → si ruta protegida y no hay JWT → redirect /sign-in
Middleware → si ok → handler de la ruta
Handler → auth() → obtiene userId de Clerk
Handler → requireSellerProfile() → busca perfil en BD por clerkUserId
```

**Dos tipos de auth:**

1. **JWT de Clerk** (`Authorization: Bearer <token>`): para requests del browser al propio backend. La función `requireSellerProfile()` en `api-utils.ts` extrae el `userId` del token, busca el `SellerProfile` en la BD y lo devuelve.

2. **Service Token** (`X-Service-Token: <secret>`): para llamadas server-to-server entre apps (ej: Payments App llama al Seller App). Es un secreto compartido en variables de entorno. La función `requireServiceToken()` simplemente compara el header con `process.env.INCOMING_SERVICE_TOKEN`.

**¿Por qué no usar JWT para las llamadas server-to-server?** Las otras apps no tienen usuarios de Clerk del Seller App. El service token es un secreto compartido más simple para autenticar máquina-a-máquina. ESTO HAY Q CAMBIARLO.

---

## 5. El middleware

`src/middleware.ts` corre **antes de cada request**, incluso antes de que llegue a las páginas o APIs.

```ts
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/api/v1/products(.*)", ...]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect(); // si no hay JWT válido → 401 o redirect
  }
});
```

**Rutas públicas** (sin auth requerida):
- El catálogo de productos (`/api/v1/products`) — cualquier app puede consultarlo
- Las rutas server-to-server (sales-orders, payment-status, shipping-status) — se autentican dentro del handler con el service token, no con Clerk

**El config del matcher** excluye archivos estáticos (CSS, imágenes) del middleware para no agregarlo a cada asset innecesariamente.

---

## 6. La capa de API (backend)

### Formato de errores estandarizado

Todos los errores siguen el mismo formato JSON para que las otras apps puedan procesarlos de manera uniforme:
```json
{ "error": { "code": "SCREAMING_SNAKE_CASE", "message": "...", "details": {} } }
```

Esto está centralizado en `src/lib/api-utils.ts`:
```ts
export const Errors = {
  unauthorized: () => errorResponse("UNAUTHORIZED", "...", 401),
  notFound: (resource) => errorResponse("NOT_FOUND", `${resource} not found`, 404),
  ...
};
```

### Paginación consistente

Todos los endpoints GET de listas devuelven el mismo envelope:
```json
{ "data": [...], "pagination": { "total": 50, "page": 1, "limit": 20, "has_more": true } }
```

La función `getPaginationParams(request)` lee `?page=&limit=` del query string, con validación (límite máximo 100).

### Idempotencia

El endpoint `POST /api/v1/products` acepta un header `Idempotency-Key`. Si enviás la misma key dos veces, en vez de crear dos productos iguales, devuelve el producto ya creado.

**¿Por qué?** Si hay un error de red y el cliente no sabe si su request llegó, puede reenviarlo con la misma key sin riesgo de duplicados. Esto es crítico en sistemas distribuidos.

Implementación: la key se guarda como campo único en la BD. Si ya existe, se devuelve el registro existente.

---

## 7. Server Components vs Client Components

Esta es la distinción más importante de Next.js App Router.

### Server Components (default)
- Archivos sin `"use client"` al principio
- Se ejecutan **solo en el servidor**
- Pueden usar Prisma directo, leer variables de entorno, hacer queries a la BD
- No tienen acceso a `useState`, `useEffect`, eventos del browser
- Ejemplo: `src/app/dashboard/page.tsx` — carga el usuario y el perfil directo desde Prisma antes de renderizar la página

**Ventaja:** La data llega ya renderizada al browser. No hay flash de contenido vacío, no hay request extra.

### Client Components
- Archivos con `"use client"` al principio
- Se ejecutan en el browser
- Pueden usar React hooks (`useState`, `useEffect`), TanStack Query, eventos
- No pueden usar Prisma ni variables de entorno del servidor
- Ejemplo: `src/app/dashboard/_components/products-tab.tsx`

**El patrón del proyecto:** El `page.tsx` es Server Component (carga datos iniciales, redirige si el perfil está suspendido). Los tabs del dashboard son Client Components porque necesitan interactividad (formularios, botones, estado local).

---

## 8. El modelo de datos

### SellerProfile
El vendedor tiene un perfil separado de su usuario de Clerk. Guarda datos legales (CUIT, condición impositiva, cuenta bancaria) y una dirección de retiro en formato JSON (`pickupAddress`).

**`verificationStatus`** puede ser:
- `pending_review`: recién registrado, no puede activar productos
- `verified`: puede publicar productos
- `suspended`: bloqueado, redirigido a `/suspended`

**¿Por qué verificación?** Para evitar que cualquiera suba productos fraudulentos. Un admin debe revisar los datos legales antes de dar acceso.

### Product
Campos clave:
- `priceCents` (Int): el precio se guarda en **centavos** para evitar errores de punto flotante. `$1.50` se guarda como `150`. Todas las operaciones son con enteros.
- `weightGrams` (Int): el peso en gramos, necesario para que el Shipping App calcule el costo de envío.
- `status`: `draft → active → paused → archived`. El flujo normal es: crear en draft, agregar imágenes, activar.
- `deletedAt` (DateTime?): **soft delete**. En vez de borrar el registro de la BD, se guarda la fecha de borrado. Así, las `SalesOrderItems` que ya referenciaban ese producto no quedan huérfanas.
- `idempotencyKey` (String? @unique): para la creación idempotente.

**Índices en la BD:**
```prisma
@@index([status, category])  // para el catálogo filtrado
@@index([sellerProfileId])    // para "mis productos"
@@index([brand, model])       // para búsquedas
```
Los índices aceleran las consultas. Sin ellos, PostgreSQL haría un *full table scan* por cada query.

### SalesOrder
Creado por el Payments App después de que el pago es aprobado. Contiene:

- `orderId`: ID de la orden en el Buyer App (fuente de verdad)
- `orderSellerGroupId`: agrupa los sub-pedidos del mismo vendedor en una orden
- `paymentStatus`: actualizado por Payments App via `PATCH /payment-status`
- `fulfillmentStatus`: manejado por el vendedor (ver sección 9)
- `shippingStatus`: actualizado por Shipping App via `PATCH /shipping-status`
- `shippingAddressSnapshot` (Json): **snapshot** de la dirección al momento del pedido. Si el comprador cambia su dirección después, el pedido ya creado no cambia.
- `items` → `SalesOrderItem` con `productNameSnapshot` y `unitPriceCents`: mismo principio de snapshot. Si el vendedor cambia el precio del producto, los pedidos anteriores conservan el precio original.

### SalesOrderStatusHistory
Cada cambio de estado del pedido queda registrado:
```prisma
fromStatus → toStatus, source (quién lo cambió), occurredAt
```
Esto es un **audit trail**: sirve para debugging, para resolver disputas ("¿cuándo aceptaste este pedido?") y para análisis.

---

## 9. La máquina de estados del pedido

`fulfillmentStatus` sigue un flujo estricto:

```
pending → accepted → preparing → ready_to_ship → handed_over → delivered
   ↓
rejected
```

El código en `prepare/route.ts` lo enforce explícitamente:
```ts
const validTransitions: Record<string, string[]> = {
  accepted: ["preparing"],
  preparing: ["ready_to_ship"],
};
```

Si intentás ir de `pending` a `ready_to_ship` directo, recibís un error `409 INVALID_STATUS_TRANSITION`.

**¿Por qué una máquina de estados?** Evita inconsistencias. Sin esto, el frontend podría enviar cualquier estado y la BD quedaría en un estado imposible (ej: `delivered` antes de `handed_over`).

**Trigger del Shipping App:** Cuando el vendedor cambia a `ready_to_ship`, automáticamente se llama al Shipping App para crear el envío:
```ts
if (newStatus === "ready_to_ship") {
  await notifyShipping(salesOrderId, order, profile!.id);
}
```
Importante: si la llamada al Shipping App falla, **no se revierte el cambio de estado del vendedor**. El error se loguea pero el vendedor ve su pedido como "listo para envío". El Shipping App puede crear el envío manualmente después. Esto sigue el principio de **disponibilidad sobre consistencia perfecta**.

---

## 10. Comunicación inter-app: `src/lib/inter-app.ts`

Cuando el Seller App llama al Shipping App, usa la función `interAppCall`. Implementa:

**Retry con backoff lineal:** 4 intentos totales, con esperas de 1s, 3s, 9s entre intentos. Solo reintenta en errores 5xx (del servidor) o de red. Los errores 4xx (de cliente) **no se reintentan** porque significan que enviamos algo incorrecto.

**Timeout de 5 segundos:** Usa `AbortController` para cancelar el fetch si tarda más de 5s. Sin esto, una app lenta podría bloquear el handler del vendedor indefinidamente.

**Headers estandarizados:**
- `X-Service-Token`: autenticación
- `X-Request-Id`: UUID único por request, para correlacionar logs entre apps
- `User-Agent`: identifica qué app hizo la llamada

---

## 11. El dashboard (frontend)

`src/app/dashboard/page.tsx` es un **Server Component** que:
1. Verifica que el usuario esté logueado (si no → redirect a `/sign-in`)
2. Verifica que no esté suspendido (si sí → redirect a `/suspended`)
3. Renderiza el header con datos del usuario
4. Renderiza 4 tabs: Pedidos, Catálogo, Liquidaciones, Mi perfil

Cada tab es un **Client Component** que usa hooks de TanStack Query para cargar sus datos:

### ProductsTab
- `useMyProducts()` → `GET /api/v1/seller-profile/me/products`
- `useCreateProduct()` → `POST /api/v1/products` + invalida cache
- `usePatchProduct()` → `PATCH /api/v1/products/:id` + invalida cache
- `useArchiveProduct()` → `DELETE /api/v1/products/:id` + invalida cache

Un vendedor sin verificar ve el botón deshabilitado con el mensaje "Verificá tu perfil para publicar productos". La verificación se chequea con `profile?.verification_status === "verified"`.

### OrdersTab
Separa los pedidos en "activos" y "historial". Los botones disponibles cambian según el `fulfillmentStatus`:
- `pending` → Aceptar / Rechazar
- `accepted` → Iniciar preparación
- `preparing` → Listo para envío

Este patrón refleja la máquina de estados del backend directamente en la UI.

---

## 12. Skeleton loading

En `OrdersTab`:
```tsx
if (isLoading) return <OrdersSkeletonGrid />;
```

Los Skeletons son placeholders grises que tienen la misma forma que las cards reales. El usuario ve contenido inmediatamente en vez de una pantalla en blanco. Es mejor UX que un spinner.

---

## 13. Toast notifications

La librería `sonner` muestra mensajes flotantes:
```ts
toast.success("Producto creado en borrador");
toast.error("No se pudo crear el producto");
```

Se configuran en `layout.tsx` con `<Toaster />` una sola vez para toda la app.

---

## 14. Precios en centavos

El input de precio en el formulario muestra pesos (ej: 15000), pero lo convierte a centavos al guardar:
```tsx
onChange={(e) => set("price_cents", Math.round(parseFloat(e.target.value) * 100))}
```

Y para mostrar, `src/lib/format.ts` convierte de vuelta:
```ts
export function formatCents(cents: number) { ... } // → "$15.000,00"
```

**¿Por qué centavos?** `0.1 + 0.2 = 0.30000000000000004` en punto flotante. Con enteros (centavos), `10 + 20 = 30`. En sistemas financieros, los errores de redondeo son inaceptables.

---

## 15. Variables de entorno importantes

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Conexión poolada a PostgreSQL (Supabase) |
| `DIRECT_URL` | Conexión directa a PostgreSQL (migraciones) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave pública de Clerk (va al browser) |
| `CLERK_SECRET_KEY` | Clave privada de Clerk (solo servidor) |
| `INCOMING_SERVICE_TOKEN` | Token que otras apps deben enviar para llamar a este app |
| `SHIPPING_API_URL` | URL del Shipping App |
| `SHIPPING_SERVICE_TOKEN` | Token para llamar al Shipping App |

Las variables con `NEXT_PUBLIC_` prefix son expuestas al browser. Las demás son solo del servidor.

---

## 16. Panel de administración (`/admin`)

### El problema que resuelve

Para que un vendedor pueda activar productos, su `verificationStatus` debe ser `verified`. Esa verificación la tiene que hacer un **administrador** revisando los datos legales del vendedor. No puede hacerlo cualquier usuario registrado.

### Cómo se determina quién es admin

No hay una tabla de admins en la BD. El flag vive directamente en Clerk, en el campo `publicMetadata` del usuario:

```json
{ "admin": true }
```

Para asignar ese flag hay que entrar al dashboard de Clerk → usuario → *Public metadata* → agregar `{ "admin": true }`. Eso hace que el JWT que Clerk emite para ese usuario incluya ese dato.

**¿Por qué en Clerk y no en la BD?** Porque la validación de auth ya pasa por Clerk. Agregar una segunda tabla de admins implicaría dos consultas (una a Clerk + una a la BD) en cada request. Además, si la BD tuviera un bug que borra el flag de admin, se perdería el acceso. En Clerk el dato es más estable.

### Seguridad en dos capas

**Capa 1 — La página** (`src/app/admin/page.tsx`): es un Server Component. Lo primero que hace es:
```ts
const user = await currentUser();
if (!user) redirect("/sign-in");
if (user.publicMetadata?.admin !== true) redirect("/dashboard");
```
Si el usuario no está logueado o no es admin, nunca ve la UI.

**Capa 2 — La API**: el endpoint `GET /api/v1/admin/seller-profiles` y el `PATCH /api/v1/admin/seller-profiles/:id/verification` llaman a `requireAdmin()` antes de hacer cualquier cosa. Aunque alguien llame a la API directamente sin pasar por la UI, recibe `403 FORBIDDEN`.

**¿Por qué dos capas y no una sola?** La UI puede proteger la vista, pero no la API. Cualquiera puede hacer un `curl` directo a la URL de la API. La validación en la API es la que realmente importa; la de la UI es solo UX (evitar que el usuario llegue a una página de error).

### Archivos del panel admin

```
src/app/admin/
├── page.tsx                    # Server Component — chequea admin, renderiza la página
└── _components/
    └── sellers-list.tsx        # Client Component — tabla con botones de acción

src/app/api/v1/admin/
└── seller-profiles/
    ├── route.ts                # GET — lista todos los perfiles (nuevo)
    └── [sellerProfileId]/
        └── verification/
            └── route.ts        # PATCH — cambia verificationStatus (ya existía)

src/hooks/
└── use-admin-sellers.ts        # useAdminSellers() + useAdminVerify()
```

### Qué puede hacer el admin desde la tabla

Cada fila muestra: nombre del vendedor, CUIT, condición fiscal, estado actual y botones. Los botones cambian según el estado actual del perfil:

| Estado actual | Botones disponibles |
|---------------|---------------------|
| `pending_review` | Verificar + Suspender |
| `verified` | Suspender |
| `suspended` | Reactivar (vuelve a `pending_review`) |

Esta lógica está en el componente `SellerRow` de `sellers-list.tsx`. No se muestra el botón del estado en que ya está (no tiene sentido "verificar" a alguien que ya está verificado).

### El hook `useAdminVerify`

```ts
export function useAdminVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/v1/admin/seller-profiles/${id}/verification`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sellers"] }),
  });
}
```

Cuando la mutación tiene éxito, invalida el cache `["admin-sellers"]`. Eso hace que TanStack Query re-fetchee la lista automáticamente, mostrando el nuevo estado sin que el admin tenga que recargar la página.

---

## 17. Resumen: flujo completo de un pedido

```
1. Comprador paga en Buyer App → Payments App procesa el pago
2. Payments App → POST /api/v1/sales-orders (con X-Service-Token)
   → Seller App crea SalesOrder con fulfillmentStatus=pending
3. Vendedor ve el pedido en dashboard → hace click "Aceptar"
   → PATCH /api/v1/sales-orders/:id/accept → status=accepted
4. Vendedor hace click "Iniciar preparación"
   → PATCH /api/v1/sales-orders/:id/prepare → status=preparing
5. Vendedor hace click "Listo para envío"
   → PATCH /api/v1/sales-orders/:id/prepare → status=ready_to_ship
   → Seller App llama automáticamente a POST /api/v1/shipments (Shipping App)
6. Shipping App retira el paquete → PATCH /shipping-status → status=handed_over
7. Paquete entregado → PATCH /shipping-status → status=delivered
8. Payments App liquida al vendedor → GET /api/v1/settlements
```
