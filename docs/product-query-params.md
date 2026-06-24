# GET /api/v1/products — Query Parameters

## Endpoint de filtros disponibles

Antes de construir cualquier query, consultá este endpoint para obtener todos los valores válidos:

```
GET /api/v1/products/filters
```

No requiere autenticación. Devuelve solo valores de productos `active`.

### Respuesta

```json
{
  "brands": ["Abus", "Aurora", "Bianchi", ...],
  "categories": [{ "value": "mtb", "count": 34 }, ...],
  "conditions": [{ "value": "new", "count": 193 }, ...],
  "price_range_cents": { "min": 3175000, "max": 138425000 },
  "sellers": [{ "id": "slp_demo_001", "display_name": "BiciSur" }, ...]
}
```

---

## Filtros de GET /api/v1/products

Todos los parámetros que aceptan múltiples valores usan **coma como separador** (`valor1,valor2`). Si pasás un solo valor funciona igual que antes.

| Parámetro | Múltiple | Descripción |
|---|---|---|
| `ids` | ✅ | IDs de productos separados por coma |
| `q` | — | Busca en `title` (contiene, case-insensitive) |
| `category` | ✅ | Uno o más valores de `categories` del endpoint de filtros |
| `brand` | ✅ | Una o más marcas de `brands` del endpoint de filtros |
| `condition` | ✅ | Una o más condiciones de `conditions` del endpoint de filtros |
| `seller_id` | ✅ | Uno o más IDs de `sellers` del endpoint de filtros |
| `min_price_cents` | — | Precio mínimo en centavos |
| `max_price_cents` | — | Precio máximo en centavos |

## Paginación

| Parámetro | Tipo | Default | Máximo |
|---|---|---|---|
| `page` | integer | `1` | — |
| `limit` | integer | `50` | `100` |

## Ordenamiento

| `sort` | Descripción |
|---|---|
| `-created_at` | Más nuevo primero **(default)** |
| `created_at` | Más antiguo primero |
| `-price_cents` | Precio descendente |
| `price_cents` | Precio ascendente |
| `-title` | Título Z→A |
| `title` | Título A→Z |

> El prefijo `-` invierte el orden. Cualquier campo de producto es válido como sort key.

---

## Valores actuales (snapshot de la BD)

### Marcas (`brand`)

```
Abus, Aurora, Bianchi, CamelBak, Cannondale, Castelli, Continental, Craft,
Cult, DT, Endura, Fidlock, Firebird, Fit, Fizik, Fox, Garmin, Giant, Giro,
GT, Haro, Kink, Lezyne, Merida, Mongoose, Oakley, Olmo, Orbea, Park,
Raleigh, Scott, Shimano, Specialized, SRAM, Subrosa, Sunday, Thule,
Topeak, Trek, Vairo, Venzo, Volta, WeThePeople, Wilier, Zenith
```

### Categorías (`category`)

| Valor | Count |
|---|---|
| `accessories` | 32 |
| `bmx` | 33 |
| `indumentaria` | 34 |
| `kids` | 36 |
| `mtb` | 34 |
| `parts` | 36 |
| `road` | 36 |
| `urban` | 34 |

### Condiciones (`condition`)

| Valor | Count |
|---|---|
| `new` | 193 |
| `used_like_new` | 35 |
| `used_good` | 33 |
| `used_fair` | 14 |

### Rango de precios

| | Centavos | Pesos (ARS) |
|---|---|---|
| Mínimo | `3.175.000` | $31.750 |
| Máximo | `138.425.000` | $1.384.250 |

### Vendedores (`seller_id`)

| ID | Nombre |
|---|---|
| `slp_demo_001` | BiciSur |
| `slp_demo_002` | Rodados BA |
| `slp_demo_003` | Bikes MG |
| `slp_demo_004` | MTB Argentina |
| `slp_demo_005` | Urban Ride |
| `slp_demo_006` | JP Bikes |
| `slp_demo_007` | Acc Bici |
| `slp_demo_008` | Taller CD |
| `slp_demo_009` | Pedalear |
| `slp_demo_010` | Elena Cycles |
| `slp_demo_011` | Ciclo Norte |
| `slp_demo_012` | Ruta 29 |
| `slp_demo_013` | La Cadena |
| `slp_demo_014` | Viento Sur |
| `slp_demo_015` | Bike House |
| `slp_demo_016` | Rosario Pedalea |
| `slp_demo_017` | Córdoba Bike |
| `slp_demo_018` | Mendoza Ride |
| `slp_demo_019` | Patagonia Cycles |
| `slp_demo_020` | Pampa Bici |
| `slp_demo_021` | Tucumán Rodados |
| `slp_demo_022` | Salta Trail |
| `slp_demo_023` | Litoral Bikes |
| `slp_demo_024` | Neuquén MTB |
| `slp_demo_025` | Bahía Rodados |
| `slp_demo_026` | Costa Pedal |
| `slp_demo_027` | Andes Cycling |
| `slp_demo_028` | Río Bike |
| `slp_demo_029` | BMX Federal |
| `slp_demo_030` | Bici Urbana |
| `slp_demo_031` | Carbon Lab |
| `slp_demo_032` | Todo Shimano |
| `slp_demo_033` | Sur Cycling |
| `slp_demo_034` | Rio Pedal |
| `slp_demo_035` | Bahia Cyciling |
| `slp_demo_036` | Altos del Sur |
| `slp_demo_037` | Ciclo Bikes |
| `slp_demo_038` | Norte Bikes |
| `slp_demo_039` | Sur Bicis |
| `slp_demo_040` | Centro Bikes |

---

## Ejemplos de uso

```
# MTB nuevas ordenadas por precio descendente
GET /api/v1/products?category=mtb&condition=new&sort=-price_cents

# Productos Trek entre $50.000 y $200.000 ARS
GET /api/v1/products?brand=Trek&min_price_cents=5000000&max_price_cents=20000000

# Todos los productos de BiciSur, página 2
GET /api/v1/products?seller_id=slp_demo_001&page=2&limit=20

# Buscar "shimano" en cualquier categoría
GET /api/v1/products?q=shimano

# Traer varios productos por ID específico
GET /api/v1/products?ids=prd_demo_001_01,prd_demo_002_03,prd_demo_005_07

# Varias categorías a la vez
GET /api/v1/products?category=mtb,road,bmx

# Varias marcas
GET /api/v1/products?brand=Trek,Giant,Specialized

# Varias condiciones
GET /api/v1/products?condition=new,used_like_new

# Varios vendedores
GET /api/v1/products?seller_id=slp_demo_001,slp_demo_002,slp_demo_003

# Combinado: MTB o Road, Trek o Giant, solo nuevas
GET /api/v1/products?category=mtb,road&brand=Trek,Giant&condition=new&sort=-price_cents
```
