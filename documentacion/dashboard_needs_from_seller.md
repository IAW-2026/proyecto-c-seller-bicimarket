# Dashboard → Seller App: qué necesita el dashboard

> Todo lo que el Manager Dashboard necesita que la **Seller App** exponga, organizado por prioridad. Fuente: análisis de `manager-dashboard/01-system-analysis/`, `03-metrics/`, `04-ui/` y `03-apis.md`.

---

## Resumen ejecutivo

El dashboard no tiene DB propia — consume todo por REST con `X-Service-Token`. De la Seller App necesita básicamente tres cosas:
1. **Listado de sellers** (hoy no existe como endpoint admin).
2. **Listado de productos** a nivel marketplace (ya existe parcialmente).
3. **Sales orders** para métricas de fulfillment (ya existe pero solo por seller autenticado).

---

## Auth requerida

La Seller App debe aceptar el token del dashboard en sus endpoints administrativos:

```env
# Variable a agregar en Seller App
DASHBOARD_TO_SELLER_SERVICE_TOKEN=<mismo valor configurado en el dashboard>
```

El header de todas las llamadas del dashboard será:
```
X-Service-Token: <token>
X-Request-Id: <uuid>
Content-Type: application/json
```

---

## Endpoints existentes que el dashboard va a consumir

Estos ya están documentados en `03-apis.md` — solo hay que asegurarse de que acepten el service token del dashboard.

### Productos (catálogo completo)

| Método | Path | Parámetros útiles | Para qué KPI |
|--------|------|--------------------|--------------|
| `GET` | `/api/v1/products` | `status`, `category`, `seller_id`, `limit`, `offset` | P1 Active Products Count, P2 Category Distribution, P5 Avg Price |
| `GET` | `/api/v1/products/{id}` | — | Enriquecer nombres de productos desde `items_summary` de Payments |

**Campos que el dashboard necesita de cada producto:**
- `id`, `title`, `category`, `condition`, `price_cents`, `status`, `seller_profile_id`, `created_at`

**Categorías esperadas:** `mtb`, `road`, `urban`, `kids`, `bmx`, `parts`, `accessories`, `indumentaria`

**Condiciones esperadas:** `new`, `used_like_new`, `used_good`, `used_fair`

---

### Sales Orders (sub-órdenes por vendedor)

| Método | Path | Parámetros útiles | Para qué KPI |
|--------|------|--------------------|--------------|
| `GET` | `/api/v1/sales-orders` | `seller_id`, `status`, `from`, `to`, `limit`, `offset` | OP4 Seller Acceptance Rate |

**Campos que el dashboard necesita de cada sales order:**
- `id`, `fulfillment_status`, `payment_status`, `total_cents`, `created_at`, `seller_profile_id`

**Estados de `fulfillment_status`:** `pending_acceptance`, `accepted`, `rejected`, `preparing`, `ready_to_ship`, `shipped`

---

## Endpoints que NO existen y el dashboard necesita

Estos son los **gaps** identificados en `02-system-data-map.md`. El dashboard no puede mostrar analytics de sellers sin ellos.

### 1. Listado admin de sellers — CRÍTICO

**Endpoint propuesto:**
```
GET /api/internal/sellers
```

**Query params sugeridos:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `verification_status` | string | `pending_review`, `verified`, `suspended` |
| `limit` | int | paginación (sugerir default 50) |
| `offset` | int | paginación |
| `created_from` | ISO 8601 | filtrar por fecha de registro |
| `created_to` | ISO 8601 | filtrar por fecha de registro |

**Respuesta mínima esperada:**
```json
{
  "data": [
    {
      "id": "slp_...",
      "display_name": "BiciSur",
      "verification_status": "verified",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 24,
    "limit": 50,
    "offset": 0
  }
}
```

**KPIs que desbloquea:**
- S1 — Active Sellers (`COUNT WHERE verification_status=verified`)
- S2 — Revenue per Seller (necesita la lista de IDs para iterar settlements)
- S4 — Seller Product Count (necesita lista de IDs para filtrar productos)
- Seller Analytics UI: cards "Active Sellers", donut de Verification Status, tabla de ranking

**Por qué no alcanza el endpoint existente:** `GET /api/v1/seller-profile/me` solo devuelve el seller autenticado. No hay forma de listar todos los sellers desde el dashboard sin este endpoint.

---

### 2. Productos con paginación robusta y filtro `seller_id` — MODERADO

El endpoint `GET /api/v1/products` ya existe pero el dashboard necesita confirmar que:

- Soporta `seller_id` como query param para agrupar productos por seller.
- Devuelve paginación estándar `{ data, pagination: { total, limit, offset } }`.
- No requiere autenticación de buyer (solo service token).

Si estos tres puntos ya funcionan, este endpoint no necesita cambios.

---

### 3. Sales orders a nivel admin (todos los sellers) — MODERADO

**Endpoint propuesto:**
```
GET /api/internal/sales-orders
```

**Query params sugeridos:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `seller_id` | string | filtrar por seller |
| `fulfillment_status` | string | filtrar por estado |
| `from` | ISO 8601 | rango de fecha |
| `to` | ISO 8601 | rango de fecha |
| `limit` | int | paginación |
| `offset` | int | paginación |

**KPIs que desbloquea:**
- OP4 — Seller Acceptance Rate por seller
- Vista "Seller Detail Panel" en la UI (accept rate de cada seller)

**Alternativa si no se implementa:** El dashboard puede aproximar la acceptance rate consultando `GET /api/v1/settlements?sellerId=X` en Payments — pero pierde el detalle de órdenes rechazadas que nunca generaron pago.

---

## Tabla resumen de necesidades

| Endpoint | Estado | Prioridad Dashboard | KPIs |
|----------|--------|---------------------|------|
| `GET /api/v1/products` | ✅ Existe | P0 | P1, P2, P5, P6 (catalog) |
| `GET /api/v1/products/{id}` | ✅ Existe | P1 | P4 Top Products por Revenue |
| `GET /api/v1/sales-orders` (con `seller_id`) | ⚠️ Existe (verificar acceso admin) | P1 | OP4 |
| `GET /api/internal/sellers` | ❌ No existe | **P0** | S1, S2, S4, Seller Analytics UI |
| `GET /api/internal/sales-orders` | ❌ No existe | P1 | OP4 desglosado por seller |

---

## Campos mínimos por entidad

### `seller_profile`
```
id, display_name, verification_status, created_at
```

### `product`
```
id, title, category, condition, price_cents, status, seller_profile_id, created_at
```

### `sales_order`
```
id, fulfillment_status, payment_status, total_cents, created_at, seller_profile_id
```

---

## Convenciones que el dashboard espera

- IDs con prefijo `slp_` para sellers, `prd_` para productos, `sor_` para sales orders.
- Montos en centavos (`int`), sin decimales.
- Timestamps en ISO 8601 UTC.
- Paginación con forma `{ data: [...], pagination: { total, limit, offset } }`.
- Error format: `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- Auth: header `X-Service-Token` con el token `DASHBOARD_TO_SELLER_SERVICE_TOKEN`.

---

## Impacto si Seller App no responde

Por diseño (`00-arquitectura-dashboard.md` regla 6), un fallo en Seller App no impide mostrar el resto del dashboard. El fallback documentado en la UI es:

> "Seller data unavailable. The Seller App may be down."
> Show settlement-derived data (revenue by seller from Payments App) as fallback.

O sea: el revenue ranking se puede mostrar igual usando settlements de Payments, pero los nombres de sellers y la verification status quedan en blanco.
