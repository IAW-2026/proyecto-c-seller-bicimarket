# 1.5 — Usuarios Compartidos

## Autenticacion centralizada con Clerk

Todas las aplicaciones comparten una unica instancia de Clerk. Los usuarios se autentican una sola vez y su identidad se propaga a todas las apps mediante el token JWT emitido por Clerk.

## Apps que comparten usuarios

| Usuario | Apps que puede acceder |
|---------|----------------------|
| Comprador | Buyer App, Payments App (ver sus pagos) |
| Vendedor | Seller App, Payments App (ver sus cobros), Shipping App (ver sus envios) |
| Operador logistico | Shipping App |
| Administrador | Todas las apps (panel admin) |

## Claims del token JWT relevantes por app

```json
{
  "sub": "user_xxxxx",           // ID unico del usuario en Clerk (compartido entre todas las apps)
  "email": "user@example.com",
  "first_name": "Juan",
  "last_name": "Perez",
  "image_url": "https://...",
  "metadata": {
    "role": "buyer | seller | operator | admin"
  }
}
```

### Claims por app

| App | Claims utilizados |
|-----|-------------------|
| Buyer App | `sub`, `email`, `first_name`, `last_name`, `metadata.role` |
| Seller App | `sub`, `email`, `first_name`, `last_name`, `metadata.role` |
| Shipping App | `sub`, `email`, `metadata.role` |
| Payments App | `sub`, `email`, `metadata.role` |

## Estrategia de roles

Los roles se definen en los **public metadata** de Clerk:
- `buyer` — puede comprar productos
- `seller` — puede publicar y vender productos
- `operator` — puede gestionar envios
- `admin` — acceso completo a todas las apps

Un usuario puede tener **multiples roles** (ej: un vendedor tambien puede comprar).

## Sincronizacion de usuarios entre apps

1. Cuando un usuario se registra en cualquier app, Clerk emite un evento `user.created`.
2. Cada app tiene un webhook endpoint (`/api/webhooks/clerk`) que recibe estos eventos.
3. El webhook crea/actualiza el registro de `User` en la base de datos local de la app.
4. Esto permite que cada app tenga una copia local del usuario para hacer queries eficientes sin depender de llamadas a Clerk en cada request.
