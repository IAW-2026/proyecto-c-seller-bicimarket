# 1.4 — Modelo de Datos por Aplicacion

## Modelo compartido (todas las apps)

```
User
├── id          (String, PK — Clerk user ID)
├── email       (String, unique)
├── firstName   (String?)
├── lastName    (String?)
├── imageUrl    (String?)
├── role        (Enum: USER, ADMIN)
├── createdAt   (DateTime)
└── updatedAt   (DateTime)
```

---

## Buyer App

```
Order
├── id          (String, PK)
├── buyerId     (String, FK → User)
├── status      (Enum: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
├── total       (Decimal)
├── createdAt   (DateTime)
└── updatedAt   (DateTime)

OrderItem
├── id          (String, PK)
├── orderId     (String, FK → Order)
├── productId   (String — ref externa a Seller App)
├── title       (String — copia local)
├── quantity    (Int)
├── unitPrice   (Decimal)
└── createdAt   (DateTime)

CartItem
├── id          (String, PK)
├── userId      (String, FK → User)
├── productId   (String — ref externa)
├── quantity    (Int)
└── createdAt   (DateTime)

Address
├── id          (String, PK)
├── userId      (String, FK → User)
├── street      (String)
├── city        (String)
├── state       (String)
├── zipCode     (String)
└── isDefault   (Boolean)

Review
├── id          (String, PK)
├── buyerId     (String, FK → User)
├── productId   (String — ref externa)
├── rating      (Int, 1-5)
├── comment     (String?)
└── createdAt   (DateTime)
```

---

## Seller App

```
Product
├── id          (String, PK)
├── sellerId    (String, FK → User)
├── title       (String)
├── description (String)
├── price       (Decimal)
├── stock       (Int)
├── images      (String[])
├── categoryId  (String, FK → Category)
├── status      (Enum: ACTIVE, PAUSED, SOLD_OUT)
├── createdAt   (DateTime)
└── updatedAt   (DateTime)

Category
├── id          (String, PK)
├── name        (String)
├── slug        (String, unique)
└── description (String?)

Sale
├── id          (String, PK)
├── sellerId    (String, FK → User)
├── orderId     (String — ref externa a Buyer App)
├── productId   (String, FK → Product)
├── quantity    (Int)
├── total       (Decimal)
├── status      (Enum: PENDING, CONFIRMED, SHIPPED, COMPLETED)
└── createdAt   (DateTime)
```

---

## Shipping App

```
Shipment
├── id              (String, PK)
├── orderId         (String — ref externa)
├── sellerId        (String)
├── buyerId         (String)
├── trackingCode    (String, unique)
├── status          (Enum: CREATED, PICKED_UP, IN_TRANSIT, DELIVERED)
├── estimatedDelivery (DateTime?)
├── address         (JSON)
├── createdAt       (DateTime)
└── updatedAt       (DateTime)

TrackingEvent
├── id          (String, PK)
├── shipmentId  (String, FK → Shipment)
├── status      (String)
├── description (String)
└── timestamp   (DateTime)
```

---

## Payments App

```
Transaction
├── id              (String, PK)
├── orderId         (String — ref externa)
├── buyerId         (String)
├── sellerId        (String)
├── amount          (Decimal)
├── status          (Enum: PENDING, CONFIRMED, REFUNDED, DISPUTED)
├── mpPaymentId     (String? — Mercado Pago ID)
├── createdAt       (DateTime)
└── updatedAt       (DateTime)

Payout
├── id              (String, PK)
├── sellerId        (String)
├── transactionId   (String, FK → Transaction)
├── amount          (Decimal)
├── status          (Enum: PENDING, COMPLETED)
└── createdAt       (DateTime)

Dispute
├── id              (String, PK)
├── transactionId   (String, FK → Transaction)
├── reason          (String)
├── status          (Enum: OPEN, RESOLVED, REJECTED)
├── resolution      (String?)
├── createdAt       (DateTime)
└── updatedAt       (DateTime)
```

---

## Estrategia para inconsistencias de datos duplicados

Los datos de **User** se duplican en cada app (synced desde Clerk via webhook). Para mantener consistencia:

1. **Clerk es la fuente de verdad** para datos de usuario (email, nombre, imagen).
2. Cada app sincroniza usuarios via el webhook `user.created` / `user.updated` de Clerk.
3. Los datos de negocio (orderId, productId, etc.) que se referencian entre apps se almacenan como **IDs externos** — no se hace JOIN entre bases de datos.
4. Si un dato cambia en la app origen (ej: precio de un producto), las copias locales en otras apps **no se actualizan automaticamente** — representan el valor al momento de la transaccion.
