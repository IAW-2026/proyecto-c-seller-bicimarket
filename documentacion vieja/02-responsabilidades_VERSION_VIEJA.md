# 1.2 — Asignacion de Responsabilidades

## Asignacion por integrante

| Integrante | Webapp | Repositorio |
|------------|--------|-------------|
| <!-- Nombre --> | Buyer App | <!-- link --> |
| <!-- Nombre --> | Seller App | <!-- link --> |
| <!-- Nombre --> | Shipping App | <!-- link --> |
| <!-- Nombre --> | Payments App | <!-- link --> |

## Datos propios por aplicacion

| App | Entidades propias | Base de datos |
|-----|-------------------|---------------|
| Buyer App | Orders, CartItems, Reviews, Addresses | Supabase (instancia propia) |
| Seller App | Products, Categories, Inventory, Sales | Supabase (instancia propia) |
| Shipping App | Shipments, TrackingEvents, DeliveryRoutes | Supabase (instancia propia) |
| Payments App | Transactions, Payouts, Disputes, PaymentMethods | Supabase (instancia propia) |

## Comunicacion entre apps

| Origen | Destino | Accion | Metodo |
|--------|---------|--------|--------|
| Buyer App | Seller App | Consultar productos disponibles | GET /api/products |
| Buyer App | Payments App | Iniciar pago de una orden | POST /api/payments/charge |
| Buyer App | Shipping App | Consultar estado de envio | GET /api/shipments/:id |
| Seller App | Shipping App | Crear envio para una venta | POST /api/shipments |
| Payments App | Seller App | Notificar pago confirmado | POST /api/webhooks/payment-confirmed |
| Shipping App | Buyer App | Notificar entrega completada | POST /api/webhooks/delivery-completed |
