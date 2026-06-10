# 1.1 — Descripcion del Sistema

## Problema que resuelve

<!-- Describir el problema que resuelve el marketplace -->

## Actores del sistema

| Actor | Descripcion | App |
|-------|-------------|-----|
| Comprador | Usuario que busca, compra y recibe productos | Buyer App |
| Vendedor | Usuario que publica, gestiona y vende productos | Seller App |
| Operador logistico | Gestiona envios y entregas | Shipping App |
| Administrador de pagos | Gestiona cobros, acreditaciones y disputas | Payments App |

## Flujo principal de uso

1. El **vendedor** publica un producto con precio, descripcion y stock.
2. El **comprador** busca productos, agrega al carrito y confirma la compra.
3. La **Payments App** procesa el cobro al comprador (Mercado Pago sandbox).
4. La **Seller App** recibe la notificacion de venta y actualiza el stock.
5. La **Shipping App** genera el envio y permite al operador actualizar el estado.
6. El **comprador** puede hacer seguimiento del envio desde la Buyer App.
7. Una vez entregado, la **Payments App** acredita el monto al vendedor.
