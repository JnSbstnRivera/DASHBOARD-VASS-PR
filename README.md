# 📊 Dashboard Área de Ventas PR

Dashboard ejecutivo del **Call Center de Ventas — Windmar Home Puerto Rico** 🌞⚡

Visualiza los 3 pipelines del área (Seguimiento de leads, Ventas cerradas y Post-venta/Instalaciones) a partir del Excel maestro **`2026 SEGUIMIENTO VENTAS.xlsx`**, con KPIs, embudo de conversión, ranking de asesores, línea de tiempo diaria y alertas automáticas.

---

## 🚀 Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| 🧠 Framework | Next.js 16 (App Router + Turbopack) |
| ⚛️ UI | React 19 + TypeScript |
| 🎨 Estilos | Tailwind CSS v4 + tema glass custom |
| 🗄️ Base de datos | Supabase (PostgreSQL 17) |
| 📊 Gráficos | Recharts 3 |
| 📅 Calendario | react-day-picker |
| ✨ Animaciones | Framer Motion |
| 📈 Excel | xlsx (SheetJS) |
| 🚢 Hosting | Vercel |

---

## 🗺️ Dashboards Disponibles

### 1️⃣ Resumen 360° 🎯 — `/dashboard/resumen`
Vista ejecutiva con todo en una sola pantalla:
- 🔢 KPIs de los 3 pipelines
- 🪣 Embudo Gestiones → Ventas → Instalado
- 🏆 Top 5 asesores del mes
- 🚨 Alertas automáticas (asesor con peor conversión, postventas estancadas)
- 📈 Mini-timeline diario

### 2️⃣ Seguimiento 📞 — `/dashboard/seguimiento`
Pipeline de gestiones / leads:
- Estados: En seguimiento, Cita pautada, Venta, No interesa, etc.
- Conversión por asesor
- Origen del lead (Facebook, Referido, Web, …)

### 3️⃣ Ventas 💰 — `/dashboard/ventas`
Ventas cerradas:
- Monto total, ticket promedio, número de contratos
- Distribución por sistema (5kW, 8kW, 10kW, …)
- Ranking de cerradores

### 4️⃣ Post-venta 🛠️ — `/dashboard/postventa`
Pipeline de instalación:
- Estados: Pendiente permiso, En instalación, **IN SERVICE** ✅
- Tiempo promedio desde venta a instalación
- Alertas de proyectos detenidos

---

## 🔄 Flujo de Datos

```
📁 SharePoint
   └── 2026 SEGUIMIENTO VENTAS.xlsx
          ├── Hoja: VENTAS 2026
          ├── Hoja: GESTIONES 2026
          └── Hoja: SEGUIMIENTO POSTVENTA
                      │
                      ▼
              🌐 /admin (subida web)
                      │
                      ▼ POST /api/refresh/upload
              🧹 TRUNCATE + INSERT (batch 100)
                      │
                      ▼
              🗄️ Supabase Postgres
                ├── ventas
                ├── seguimientos
                └── postventa
                      │
                      ▼
              📊 Dashboards (SSR)
```

### 📤 Actualizar datos
1. Abrir `/admin` 🔐
2. Soltar el `.xlsx` en el dropzone
3. Esperar la animación de loading ⏳
4. ✅ Listo — los 3 dashboards reflejan los datos nuevos al instante

### 📥 Descargar Excel filtrado
- Botón en el footer del sidebar 📥
- Respeta el rango de fechas activo y la página actual
- Genera un `.xlsx` con las 3 hojas

---

## 📋 Estructura de Hojas Excel

### 🟦 `VENTAS 2026`
Columnas clave: Fecha, Cliente, Asesor, Sistema, Monto, Estado, Origen

### 🟧 `GESTIONES 2026`
Columnas clave: Fecha contacto, Cliente, Asesor, Estado, Origen, Próximo paso

### 🟩 `SEGUIMIENTO POSTVENTA`
Columnas clave: Fecha venta, Cliente, Sistema, Estado instalación, Notas, IN SERVICE

---

## 🎨 Sistema de Diseño

**Paleta Windmar:**
- 🔵 Azul Windmar `#1D429B`
- 🟠 Naranja solar `#F89B24`
- 🟢 Verde IN SERVICE `#10B981`
- 🌌 Fondo dark `#0B1020`

**Tema:** Glass + ambient orbs con `backdrop-filter`, intensidad reducida para no cansar la vista durante turnos largos del call center 👁️

**Modos:** 🌙 Dark (default) · ☀️ Light — toggle en el sidebar

---

## ⚙️ Variables de Entorno

Copiar `.env.example` → `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Zoho CRM (opcional)
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
```

---

## 🛠️ Desarrollo Local

```bash
npm install
npm run dev          # 🚀 http://localhost:3000
npm run build        # 📦 build de producción
npm run lint         # 🔍 ESLint
```

---

## 🚢 Deploy

Cada `git push origin master` dispara un deploy automático en Vercel.
Deploy manual:

```bash
vercel deploy --prod --yes
```

---

## 📁 Estructura del Proyecto

```
dashboard-area-de-ventas-pr/
├── app/
│   ├── dashboard/
│   │   ├── resumen/       🎯 vista 360°
│   │   ├── seguimiento/   📞 leads
│   │   ├── ventas/        💰 ventas
│   │   └── postventa/     🛠️ instalación
│   ├── admin/             🔐 subida de Excel
│   ├── api/
│   │   ├── refresh/upload/    POST .xlsx → Supabase
│   │   └── download/excel/    GET .xlsx filtrado
│   ├── icon.svg           📊 favicon (barras)
│   └── layout.tsx
├── components/
│   ├── resumen/           ResumenDashboard 360°
│   ├── seguimiento/
│   ├── ventas/
│   ├── postventa/
│   ├── dashboard/         Filtros, date-picker, KPIs
│   └── sidebar.tsx
├── lib/
│   ├── queries/           Lecturas Supabase tipadas
│   ├── supabase/          Clientes (server, browser, service)
│   └── database.types.ts
└── public/
```

---

## 🗓️ Roadmap

- ✅ Dashboard PR (este repo)
- ⏳ Dashboard TM (Telemercadeo)
- ⏳ Dashboard VASS

---

## 👥 Equipo

🏢 **Windmar Home Puerto Rico** — Energía solar 🌞
📍 Call Center Bogotá · Área de Ventas PR

---

🤖 _Construido con [Claude Code](https://claude.com/claude-code)_
