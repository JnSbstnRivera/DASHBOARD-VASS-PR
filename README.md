# 🎯 Dashboard VASS PR

> Dashboard ejecutivo del Call Center de Ventas — Windmar Home Puerto Rico 🌞⚡

![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n-2ea043)
![Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%2B%20React%2019%20%2B%20Supabase-1D429B)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)
![Windmar](https://img.shields.io/badge/Windmar-Home%20PR-F89B24)

---

## 🎯 ¿Qué hace?

Visualiza los 3 pipelines del área (Seguimiento de leads, Ventas cerradas y Post-venta/Instalaciones) a partir del Excel maestro **`2026 SEGUIMIENTO VENTAS.xlsx`**, con KPIs, embudo de conversión, ranking de asesores, línea de tiempo diaria y alertas automáticas.

---

## ✨ Características

- 🔢 KPIs de los 3 pipelines
- 🪣 Embudo de conversión Gestiones → Ventas → Instalado
- 🏆 Ranking de asesores
- 🚨 Alertas automáticas (asesor con peor conversión, postventas estancadas)
- 📈 Línea de tiempo diaria
- 📤 Subida web de Excel y 📥 descarga de Excel filtrado

---

## 🛠️ Stack técnico

| Capa | Tecnología |
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

## 📁 Estructura del repositorio

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

## 🔧 Variables de entorno

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

## 🚀 Setup local

```bash
npm install
npm run dev          # 🚀 http://localhost:3000
npm run build        # 📦 build de producción
npm run lint         # 🔍 ESLint
npm start            # ▶️ servidor de producción
```

---

## 📦 Despliegue

Cada `git push origin master` dispara un deploy automático en Vercel.
Deploy manual:

```bash
vercel deploy --prod --yes
```

---

## 🗺️ Dashboards disponibles

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

## 🔄 Flujo de datos

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

## 📋 Estructura de hojas Excel

### 🟦 `VENTAS 2026`
Columnas clave: Fecha, Cliente, Asesor, Sistema, Monto, Estado, Origen

### 🟧 `GESTIONES 2026`
Columnas clave: Fecha contacto, Cliente, Asesor, Estado, Origen, Próximo paso

### 🟩 `SEGUIMIENTO POSTVENTA`
Columnas clave: Fecha venta, Cliente, Sistema, Estado instalación, Notas, IN SERVICE

---

## 🎨 Sistema de diseño

**Paleta Windmar:**
- 🔵 Azul Windmar `#1D429B`
- 🟠 Naranja solar `#F89B24`
- 🟢 Verde IN SERVICE `#10B981`
- 🌌 Fondo dark `#0B1020`

**Tema:** Glass + ambient orbs con `backdrop-filter`, intensidad reducida para no cansar la vista durante turnos largos del call center 👁️

**Modos:** 🌙 Dark (default) · ☀️ Light — toggle en el sidebar

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

## 🔗 Ecosistema Windmar

Parte del trío del área VASS junto con [WINDMAR-VASS-INBOX](https://github.com/JnSbstnRivera/WINDMAR-VASS-INBOX) y [NOTAS-VENTAS-VASS](https://github.com/JnSbstnRivera/NOTAS-VENTAS-VASS).

**Hub padre (Portal ejecutivo):**
- [WINDMAR-PORTAL-EJECUTIVO](https://github.com/JnSbstnRivera/WINDMAR-PORTAL-EJECUTIVO)

**Dashboards hermanos:**
- [DASHBOARD-AREA-DE-VENTAS-PR](https://github.com/JnSbstnRivera/DASHBOARD-AREA-DE-VENTAS-PR)
- [DASHBOARD-TELEMERCADEO-PR](https://github.com/JnSbstnRivera/DASHBOARD-TELEMERCADEO-PR)

---

## 📄 Créditos

Desarrollado por **JnSbstnRivera** (Juan Sebastián Rivera Joven) para **Windmar Home Puerto Rico**. ☀️

🤖 _Construido con [Claude Code](https://claude.com/claude-code)_
