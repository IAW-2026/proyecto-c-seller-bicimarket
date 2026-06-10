# 1.3 — Diseno de APIs Inter-Servicios

## Seller App API

### GET /api/products
- **Descripcion**: Lista de productos disponibles
- **Quien llama**: Buyer App
- **Request**: Query params: `?search=&category=&page=&limit=`
- **Response**:
```json
{
  "products": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": "number",
      "stock": "number",
      "images": ["string"],
      "category": "string",
      "sellerId": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

### GET /api/products/:id
- **Descripcion**: Detalle de un producto
- **Quien llama**: Buyer App
- **Response**:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "stock": "number",
  "images": ["string"],
  "category": "string",
  "sellerId": "string",
  "sellerName": "string"
}
```

### POST /api/webhooks/payment-confirmed
- **Descripcion**: Webhook para recibir confirmacion de pago
- **Quien llama**: Payments App
- **Request**:
```json
{
  "orderId": "string",
  "transactionId": "string",
  "amount": "number",
  "status": "confirmed"
}
```
- **Response**: `{ "received": true }`

---

## Payments App API

### POST /api/payments/charge
- **Descripcion**: Iniciar un cobro
- **Quien llama**: Buyer App
- **Request**:
```json
{
  "orderId": "string",
  "buyerId": "string",
  "sellerId": "string",
  "amount": "number",
  "items": [
    {
      "productId": "string",
      "title": "string",
      "quantity": "number",
      "unitPrice": "number"
    }
  ]
}
```
- **Response**:
```json
{
  "transactionId": "string",
  "status": "pending",
  "paymentUrl": "string"
}
```

### GET /api/payments/transactions/:id
- **Descripcion**: Estado de una transaccion
- **Quien llama**: Buyer App, Seller App
- **Response**:
```json
{
  "id": "string",
  "orderId": "string",
  "status": "pending | confirmed | refunded | disputed",
  "amount": "number",
  "createdAt": "string"
}
```

---

## Shipping App API

### POST /api/shipments
- **Descripcion**: Crear un nuevo envio
- **Quien llama**: Seller App
- **Request**:
```json
{
  "orderId": "string",
  "sellerId": "string",
  "buyerId": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "items": [
    {
      "productId": "string",
      "title": "string",
      "quantity": "number"
    }
  ]
}
```
- **Response**:
```json
{
  "shipmentId": "string",
  "trackingCode": "string",
  "status": "created",
  "estimatedDelivery": "string"
}
```

### GET /api/shipments/:id
- **Descripcion**: Estado de un envio
- **Quien llama**: Buyer App
- **Response**:
```json
{
  "id": "string",
  "trackingCode": "string",
  "status": "created | picked_up | in_transit | delivered",
  "events": [
    {
      "status": "string",
      "timestamp": "string",
      "description": "string"
    }
  ],
  "estimatedDelivery": "string"
}
```

---

## Buyer App API

### POST /api/webhooks/delivery-completed
- **Descripcion**: Webhook para recibir notificacion de entrega
- **Quien llama**: Shipping App
- **Request**:
```json
{
  "orderId": "string",
  "shipmentId": "string",
  "deliveredAt": "string"
}
```
- **Response**: `{ "received": true }`
