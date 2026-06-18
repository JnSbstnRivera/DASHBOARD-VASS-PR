# Dashboard VASS PR

Dashboard ejecutivo del área VASS del call center de **Windmar Home Puerto Rico**. Visualiza los pipelines de seguimiento de leads, ventas cerradas y post-venta a partir del Excel maestro, con KPIs, embudo de conversión, ranking de asesores y alertas automáticas.

## ✨ Características

- KPIs de los pipelines del área (seguimiento, ventas, post-venta)
- Embudo de conversión Gestiones → Ventas → Instalado
- Ranking de asesores
- Vistas por sección: Resumen 360°, Seguimiento, Ventas
- Alertas automáticas (conversión baja, post-ventas estancadas)
- Subida web del Excel maestro desde `/admin` (reemplazo de datos en Supabase)
- Descarga de Excel filtrado por rango de fechas
- Modo oscuro (default) / claro

## 🛠️ Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4 + tema glass custom
- **Base de datos:** Supabase (PostgreSQL)
- **Gráficos:** Recharts 3
- **Calendario:** react-day-picker
- **Animaciones:** Framer Motion
- **Excel:** xlsx (SheetJS)
- **Deploy:** Vercel

## 🚀 Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
# http://localhost:3000
```

## 🔑 Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de service role (solo servidor; nunca exponer al cliente) |
| `ADMIN_USERNAME` | Usuario para el HTTP Basic Auth de `/admin` |
| `ADMIN_PASSWORD` | Contraseña para el HTTP Basic Auth de `/admin` |

> Solo placeholders: nunca incluyas valores reales de claves o tokens en el repositorio.

## 📜 Scripts

- `npm run dev` — servidor de desarrollo (http://localhost:3000)
- `npm run build` — build de producción
- `npm run start` — sirve el build de producción
- `npm run lint` — ESLint

## 🌐 Deploy

Despliegue en **Vercel**. Cada push a la rama de producción dispara un deploy automático; también admite deploy manual con `vercel deploy --prod`.

## 📄 Licencia

Propietario — Windmar Home PR. Uso interno.
