# Seeds finales de BiciMarket

Este directorio contiene las cuatro seeds coordinadas del escenario
`bicimarket-demo-v3`:

| Aplicación | Archivo | Filas principales esperadas |
|---|---|---|
| Buyer | `seed-buyer-final.ts` | 500 buyers, 2.400 orders, 3.172 seller groups, 6.334 items |
| Seller | `seed-seller-final.ts` | 40 sellers, 320 publicaciones, 896 imágenes, 2.947 sales orders |
| Shipping | `seed-shipping-final.ts` | 24 operadores, 150 tarifas, 2.228 grupos, 2.938 shipments |
| Payments | `seed-payments-final.ts` | 2.400 payments y 2.326 settlements, además de intentos, reintegros, payouts, webhooks y errores |

Las cuatro usan los mismos IDs opacos (`byp_`, `slp_`, `prd_`, `ord_`,
`osg_`, `sor_`, `pay_`, `qte_` y `shp_`) y la misma generación determinista.
Siempre deben ejecutarse con el mismo `SEED_ANCHOR_DATE`.

## Catálogo

Hay 80 productos base, 10 por cada categoría. Cada uno se reutiliza en cuatro
publicaciones de sellers diferentes, dando 320 publicaciones reales en Seller.
Cada seller tiene una publicación por categoría.

Las 224 fotos de los productos base y los 80 enlaces de búsqueda de Mercado
Libre están en [`supabase-product-images/README.md`](supabase-product-images/README.md).
Seller genera una fila `ProductImage` por cada foto de cada publicación y apunta a:

```text
<SUPABASE_URL>/storage/v1/object/public/<PRODUCT_IMAGE_BUCKET>/catalog-v3/<categoria>/<producto>/<archivo>
```

Los nombres y extensiones de los archivos forman parte del inventario determinista
de `seed-seller-final.ts`.

## Ejecución y Reset de Bases de Datos

Para vaciar la información actual de tus bases de datos y cargar estos seeds finales, tenés que seguir estos pasos para **cada uno de los proyectos** (Buyer, Seller, Shipping, Payments):

### 1. Reemplazar el archivo de Seed
Copiá el archivo final correspondiente a la carpeta `prisma` del proyecto destino y renombralo a `seed.ts` (sobrescribiendo el que ya exista).
- **Buyer**: Copiar `seed-buyer-final.ts` como `prisma/seed.ts`
- **Seller**: Copiar `seed-seller-final.ts` como `prisma/seed.ts`
- **Shipping**: Copiar `seed-shipping-final.ts` como `prisma/seed.ts`
- **Payments**: Copiar `seed-payments-final.ts` como `prisma/seed.ts`

### 2. Reiniciar la Base de Datos y correr el Seed
Ubicado en la raíz de cada proyecto, usá tu terminal (PowerShell) para definir las variables necesarias y ejecutar el borrado y sembrado. 

> **Nota importante:** El script del seed ya se encarga de vaciar las tablas relevantes (hace un reset de datos) si le pasás la variable `SEED_ALLOW_RESET`. Si además querés destruir y recrear todo el esquema de la base de datos desde cero, podés correr `npx prisma db push --force-reset` antes del seed.

**En las aplicaciones Buyer, Shipping y Payments:**
```powershell
$env:SEED_ANCHOR_DATE = "2026-06-24"
$env:SEED_ALLOW_RESET = "BICIMARKET_DEMO"
npx prisma db seed
```

**Exclusivo para la aplicación Seller:**
En Seller es obligatorio definir la URL de Supabase para que las imágenes funcionen:
```powershell
$env:SEED_ANCHOR_DATE = "2026-06-24"
$env:SEED_ALLOW_RESET = "BICIMARKET_DEMO"
$env:SUPABASE_URL = "https://jjwfuyoybuhutkvdbilf.supabase.co" 
$env:PRODUCT_IMAGE_BUCKET = "product-images"
npx prisma db seed
```
*(El bucket es opcional si se llama `product-images`, pero debe ser público).*

### 3. Verificar cantidades sin escribir (Dry Run)
Si antes de borrar tus datos querés revisar las cantidades que se van a generar:
```powershell
$env:SEED_ANCHOR_DATE = "2026-06-24"
$env:SEED_DRY_RUN = "1"
npx prisma db seed
```

## Advertencia

Estas seeds vacían las tablas administradas por cada aplicación antes de
insertar el escenario. La escritura solo se habilita con
`SEED_ALLOW_RESET=BICIMARKET_DEMO`.

La validación local con anchor `2026-06-24` cubre desde `2024-06-24` hasta
`2026-06-23`, los 25 meses calendario tocados, y confirmó el mismo hash de
proyección en las cuatro seeds.
