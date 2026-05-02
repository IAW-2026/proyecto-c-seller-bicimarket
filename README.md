# Marketplace App — Base Template

Proyecto base para el marketplace de compra-venta entre usuarios. Cada integrante clona este repo y lo adapta para su modulo.

**Tipo de proyecto:** Marketplace

## Integrantes

| Integrante | App asignada |
|------------|-------------|
| <!-- Nombre --> | Buyer App |
| <!-- Nombre --> | Seller App |
| <!-- Nombre --> | Shipping App |
| <!-- Nombre --> | Payments App |

## Documentacion (Etapa 1)

- [Descripcion del sistema](docs/01-descripcion.md)
- [Asignacion de responsabilidades](docs/02-responsabilidades.md)
- [Diseno de APIs inter-servicios](docs/03-apis.md)
- [Modelo de datos por aplicacion](docs/04-modelo-de-datos.md)
- [Usuarios compartidos](docs/05-usuarios.md)

## Stack tecnologico

- **Framework:** Next.js (App Router) + TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Autenticacion:** Clerk
- **Base de datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **State management:** Zustand
- **Data fetching:** TanStack Query + Axios
- **Formularios:** React Hook Form + Zod
- **Deploy:** Vercel

## Setup local

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd marketplace-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar las variables en .env.local

# 4. Generar el cliente de Prisma
npx prisma generate

# 5. Ejecutar migraciones
npx prisma migrate dev

# 6. Iniciar el servidor de desarrollo
npm run dev
```

## Estructura del proyecto

```
src/
├── app/                    # App Router (pages & API routes)
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard protegido
│   ├── sign-in/           # Login (Clerk)
│   └── sign-up/           # Registro (Clerk)
├── components/
│   └── ui/                # Componentes shadcn/ui
├── hooks/                 # Custom hooks
├── lib/                   # Utilidades (prisma, axios, utils)
├── providers/             # Context providers (TanStack Query)
├── store/                 # Zustand stores
└── generated/             # Prisma generated client (gitignored)
prisma/
├── schema.prisma          # Modelo de datos
└── migrations/            # Migraciones
docs/                      # Documentacion Etapa 1
```

## Comandos utiles

```bash
# Regenerar cliente Prisma (necesario despues de cambiar schema.prisma o instalar deps)
npx prisma generate

# Ejecutar migraciones pendientes
npx prisma migrate dev

# Abrir Prisma Studio (explorar la DB en el navegador)
npx prisma studio

# Iniciar el servidor de desarrollo
npm run dev

# Si el servidor no conecta a la DB, para el server (Ctrl+C) y ejecuta:
npx prisma generate && npm run dev

# Si el puerto 3000 esta ocupado, matar el proceso (reemplazar PID):
# taskkill /PID <numero> /F
```

> **Nota:** Cada vez que se instalan dependencias (`npm install`) o se modifica `prisma/schema.prisma`, hay que correr `npx prisma generate` antes de iniciar el servidor.

## Variables de entorno

Ver `.env.example` para la lista completa de variables necesarias.
