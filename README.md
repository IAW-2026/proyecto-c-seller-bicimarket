# BiciMarket — Seller App

**Deploy:** https://proyecto-c-seller-bicimarket.vercel.app/

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Vendedor verificado | seller1clerk_test@iaw.com| iawuser# |
| Vendedor pendiente | seller2clerk_test@iaw.com| iawuser# |
| Admin | sellerclerk_test@iaw.com| iawuser# |

> En la pagina de vendedor verificado se puede ver productos ya creados, algunas ordenes de estos productos y unas liquidaciones. Particularmente las ordenes estan para evidenciar todos los estados de las mismas durante el flujo de la buyer app.  
> La pagina de vendedor pendiente esta para mostrar como es cuando un vendedor entra por primera vez a la app. Necesita rellenar su perfil, ser validado por un admin y recien ahi podra publicar productos.  
> La pagina de Admin simplemente permite el acceso a ..../admin donde se puede gestionar el estado de los vendedores. Ademas, se pueden ver todos los productos que hay en la base de datos.

---

## Cómo evaluar la aplicación

1. **Iniciar sesión** en `/sign-in` con alguno de los usuarios de arriba.
2. **Dashboard del vendedor** (`/dashboard`): desde ahí se navega entre las cuatro secciones.
   - **Catálogo** — crear, editar, activar/pausar y archivar productos. El botón "Nuevo producto" solo aparece si el perfil del vendedor está `verified`; con estado `pending_review` el catálogo queda bloqueado. Al momento de crear un producto deberan ser rellenados todos los campos del formulario, inclusive el de imagen.
   - **Pedidos** — ver órdenes de venta recibidas y ejecutar acciones (aceptar, rechazar, marcar como listo para enviar).
   - **Liquidaciones** — resumen de pagos liquidados por la Payments App (proxy vía REST).
   - **Mi perfil** — completar datos fiscales y dirección de retiro; ver estado de verificación.
3. **Panel de admin** (`/dashboard/admin`): visible solo para usuarios con `publicMetadata.admin=true`. Permite verificar/suspender vendedores y ver el catálogo completo.
4. **API pública** (`/api/v1/products`): el catálogo es accesible sin autenticación. Se puede probar directamente en el navegador o con curl.
5. **API docs** (`/api-docs`): Swagger UI con todos los endpoints documentados.

> Para probar el flujo completo (compra → pago → sub-orden en Seller) se requiere integración con las otras tres apps del sistema (Buyer, Payments, Shipping). Las llamadas server-to-server usan `X-Service-Token` en el header.

---

## Descripción del proyecto

**BiciMarket** es un marketplace de bicicletas y repuestos construido como cuatro aplicaciones Next.js independientes: Buyer App (Camila Rojas), **Seller App (Pierino Spina)**, Shipping App (Enrique Seitz) y Payments App (Rocco Paoloni). Cada app tiene su propia base de datos PostgreSQL, su propio Clerk y se comunica con las demás exclusivamente por REST sobre HTTP, autenticando las llamadas inter-app con `X-Service-Token`.

Esta app es la **Seller App**: es la fuente de verdad del catálogo de productos y de las sub-órdenes de venta (`sales_orders`). Los vendedores se registran, completan su perfil y, una vez verificados por un admin, pueden publicar productos. Cuando un comprador paga, la Payments App notifica a esta app que crea la sub-orden correspondiente; el vendedor la acepta, prepara el pedido y lo marca listo para despacho, momento en que se solicita el envío a la Shipping App.

El stack es Next.js 15 (App Router) con TypeScript, Tailwind CSS + shadcn/ui, Prisma sobre PostgreSQL (Supabase), TanStack Query + Axios para el data fetching del cliente, y Clerk para autenticación. El deploy corre en Vercel.

---

## Notas para la corrección

- **Stub ordenes:** al no haber las conexiones necesarias via api para generar una orden, el stub producido de ese endpoint esperado se activa solo si tenemos productos activados y aun no poseemos ordenes. Al momento de ingresar a productos se chequea si existe una diferencia entre esos dos valores, generando ordenes una unica vez.

- **Sin control de stock**: por decisión de alcance del proyecto, todos los productos `active` tienen disponibilidad ilimitada. No existe el campo `stock` ni el error `INSUFFICIENT_STOCK`. El endpoint `GET /api/v1/products/{id}/availability` solo confirma que el producto sigue activo y devuelve precio y peso.

- **Flujo de verificación**: un vendedor recién registrado queda en `pending_review` y no puede activar productos. Un admin (usuario con `publicMetadata.admin=true` en el Clerk de esta app) lo aprueba desde `/dashboard/admin`. Solo entonces aparece el botón "Nuevo producto" en el catálogo.

- **Idempotencia en POSTs**: `POST /api/v1/products` acepta el header `Idempotency-Key`; reenviar con la misma clave devuelve el recurso existente sin duplicarlo.


- **Documentación completa** del contrato inter-apps, modelo de datos, estados y diagramas de secuencia en la carpeta [`docs/`](docs/).


