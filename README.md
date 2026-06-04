# iComanda

iComanda es una aplicación móvil y web para la gestión operativa de restaurantes.
Permite administrar mesas, menú, pedidos, cocina, pagos, gastos, inventario y
reportes usando React Native, Expo y Supabase.

## Tecnologías

- React Native + Expo SDK 54
- Expo Router 6
- TypeScript
- Supabase Auth, PostgreSQL, Storage y Realtime
- PostgreSQL functions/RPC y Row Level Security
- Componentes UI propios inspirados en Material Design 3

## Roles

- `admin`: gestiona usuarios, restaurante, mesas, menú, pagos QR, gastos, inventario y reportes.
- `mesero`: visualiza mesas, registra pedidos, entrega/cancela órdenes y atiende llamadas de clientes.
- `chef`: visualiza pedidos de cocina, marca pedidos listos y gestiona platos agotados.
- Cliente público: accede a la carta y sesión de mesa por QR sin instalar app.

## Módulos Principales

- Login y control de acceso por rol.
- Gestión de usuarios, restaurante y mesas.
- Menú con imágenes, categorías, disponibilidad y platos agotados.
- Toma de pedidos y seguimiento de órdenes.
- Panel de cocina en tiempo real.
- Carta digital pública por URL/QR.
- Sesión de cliente por mesa con llamada al mesero.
- Confirmación de pagos QR.
- Gastos operativos e inventario de materiales.
- Reportes financieros, ranking de platos y ventas por mesero.

## Estructura Relevante

```text
app/
  login.tsx
  (admin)/
  (mesero)/
  (chef)/
  menu/[slug].tsx
  table/[slug]/[tableId].tsx
components/
context/auth.tsx
lib/
supabase/migrations/
supabase/functions/crear-usuario/
report/
```

## Requisitos

- Node.js instalado.
- npm instalado.
- Proyecto Supabase configurado.
- Variables de entorno públicas de Supabase.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

No se debe subir `.env` al repositorio.

## Instalación

```bash
npm install
```

## Ejecutar en Desarrollo

```bash
npm run start
```

Para Android:

```bash
npm run android
```

Para web:

```bash
npm run web
```

## Verificación

```bash
npm run lint
```

## Informe

El informe final se encuentra en `report/`.

Archivos relevantes:

- `report/main.tex`: documento principal.
- `report/erd_mermaid.md`: diagrama ER en Mermaid para regenerar `report/img/erd_database.png`.
- `report/referencias.bib`: referencias bibliográficas en formato BibTeX.

Para compilar manualmente el informe desde `report/`:

```bash
pdflatex -interaction=nonstopmode main.tex
```

Se recomienda compilar dos veces para actualizar índice y referencias.
