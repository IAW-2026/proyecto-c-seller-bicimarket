# GET /api/v1/products — Query Parameters

## Filtros

| Parámetro | Tipo | Descripción |
|---|---|---|
| `q` | string | Busca en `title` (contiene, case-insensitive) |
| `category` | enum | Categoría exacta (ver valores abajo) |
| `brand` | string | Marca exacta (case-insensitive) |
| `condition` | enum | Condición exacta (ver valores abajo) |
| `seller_id` | string | ID del seller profile |
| `min_price_cents` | integer | Precio mínimo en centavos (inclusive) |
| `max_price_cents` | integer | Precio máximo en centavos (inclusive) |

## Paginación

| Parámetro | Tipo | Default | Máximo |
|---|---|---|---|
| `page` | integer | `1` | — |
| `limit` | integer | `50` | `100` |

## Ordenamiento

| Parámetro | Valor | Descripción |
|---|---|---|
| `sort` | `created_at` | Más antiguo primero |
| `sort` | `-created_at` | Más nuevo primero (default) |
| `sort` | `price_cents` | Precio ascendente |
| `sort` | `-price_cents` | Precio descendente |
| `sort` | `title` | Título A→Z |
| `sort` | `-title` | Título Z→A |

> El prefijo `-` invierte el orden. Cualquier campo de producto es válido como sort key.

## Enum: `category`

```
mtb
road
urban
kids
bmx
parts
accessories
indumentaria
```

## Enum: `condition`

```
new
used_like_new
used_good
used_fair
```

## Ejemplo

```
GET /api/v1/products?category=mtb&condition=new&min_price_cents=50000&sort=-price_cents&page=1&limit=20
```