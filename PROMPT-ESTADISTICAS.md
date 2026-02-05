Añade una página de estadísticas al dashboard existente en `/estadisticas`. NO modifiques las páginas existentes (dashboard, informe, chat, pacientes). Solo crea archivos nuevos.

## TECH STACK (ya existente, no cambiar)
- Next.js 14+ App Router con TypeScript
- Tailwind CSS
- Supabase (ya configurado en `src/lib/supabase.ts`)
- **Añadir**: `recharts` para gráficas

## INSTALAR
```bash
npm install recharts
```

## ESTRUCTURA DE ARCHIVOS (solo crear estos)
```
src/app/(dashboard)/estadisticas/page.tsx    ← Página principal
src/app/api/stats/route.ts                   ← API que lee datos de Supabase
```

## API: `/api/stats` (GET)

Parámetros query:
- `from` — fecha inicio (YYYY-MM-DD), default: hace 30 días
- `to` — fecha fin (YYYY-MM-DD), default: hoy

Lee de la tabla `informes_diarios` en Supabase. Columnas disponibles:
```
id (UUID), fecha (DATE unique), total_conversaciones (INT), total_pacientes (INT),
total_confirmados (INT), total_cancelaciones (INT), total_pendientes (INT),
total_urgentes (INT), resumen_ejecutivo (TEXT), puntos_clave (TEXT[]),
datos_raw (JSONB), generado_at (TIMESTAMPTZ)
```

El campo `datos_raw` es un JSON con esta estructura:
```json
{
  "resumen_ejecutivo": "texto",
  "puntos_clave": ["..."],
  "total_conversaciones": 10,
  "total_pacientes": 8,
  "categorias": {
    "urgente": [{"nombre":"X","telefono":"+34X","descripcion":"X","accion_requerida":"X","estado":"X"}],
    "pendiente": [{"nombre":"X","telefono":"+34X","descripcion":"X","accion_requerida":"X"}],
    "confirmado": [{"nombre":"X","telefono":"+34X","hora_cita":"HH:MM","detalle":"X"}],
    "no_acude": [{"nombre":"X","telefono":"+34X","motivo":"X","detalle":"X"}]
  },
  "otros_contactos": ["desc"],
  "tareas_noelia": [{"prioridad":"urgente|alta|media|baja","texto":"X"}]
}
```

La API debe devolver:
```json
{
  "daily": [
    {
      "fecha": "2026-02-04",
      "confirmados": 4,
      "cancelaciones": 1,
      "pendientes": 3,
      "urgentes": 2,
      "no_acude": 1,
      "total_conversaciones": 18,
      "total_pacientes": 15,
      "primeras_visitas": 0,
      "ya_avisaran": 0,
      "sin_atender": 0,
      "tareas_pendientes": 5
    }
  ],
  "totals": {
    "total_dias": 30,
    "total_confirmados": 120,
    "total_cancelaciones": 15,
    "total_pendientes": 45,
    "total_urgentes": 8,
    "tasa_confirmacion": 72.5,
    "tasa_cancelacion": 9.1,
    "promedio_conversaciones_dia": 22.5
  }
}
```

Para `primeras_visitas`, `ya_avisaran` y `sin_atender`: extraer de `datos_raw` contando pacientes cuya descripción/acción contenga patrones relevantes ("primera visita", "ya te aviso", "ya avisará", "sin respuesta", "no responde", "sin atender"). Si no se puede determinar, devolver 0.

Usa Supabase así (ya configurado):
```typescript
import { supabase } from "../../../lib/supabase";
const { data } = await supabase
  .from("informes_diarios")
  .select("*")
  .gte("fecha", fromDate)
  .lte("fecha", toDate)
  .order("fecha", { ascending: true });
```

## PÁGINA: `/estadisticas`

### Header
- Título: "📊 Estadísticas"
- Selector de rango de fechas (desde — hasta) con input type="date"
- Botones rápidos: "7 días", "30 días", "90 días"

### KPI Cards (fila de 6)
- Total confirmados (verde)
- Total cancelaciones (rojo)
- Pendientes acumulados (amarillo)
- Urgentes (rojo intenso)
- Tasa confirmación % (verde)
- Promedio conversaciones/día (azul)

### Gráfica 1: Evolución diaria (LineChart)
- Línea verde: confirmados
- Línea roja: cancelaciones
- Línea amarilla: pendientes
- Línea naranja: "ya avisarán"
- Línea gris: sin atender/no responden
- Eje X: fechas
- Eje Y: cantidad
- Tooltip con detalle al hover
- Leyenda abajo
- Responsive

### Gráfica 2: Primeras visitas por día (BarChart)
- Barras azules: primeras visitas por día
- Línea superpuesta: media móvil 7 días
- Eje X: fechas
- Eje Y: cantidad

### Gráfica 3: Distribución del período (PieChart)
- Confirmados (verde)
- Cancelaciones (rojo)
- Pendientes (amarillo)
- No acude (naranja)
- Urgentes (rojo intenso)
- Etiquetas con porcentaje
- Leyenda

### Gráfica 4: Conversaciones y pacientes por día (AreaChart)
- Área azul: total conversaciones
- Área verde: pacientes únicos
- Eje X: fechas

### Gráfica 5: Tareas pendientes Noelia (BarChart horizontal)
- Barras agrupadas por prioridad: urgente, alta, media, baja
- Acumulado del período

## ESTILO (mantener el existente)
- Dark mode: fondo #0a0a0a, cards #141414, bordes #262626
- Accent: #6366f1 (indigo)
- Success: #22c55e, Warning: #f59e0b, Danger: #ef4444
- Font: Inter o Geist
- Bordes redondeados, sombras suaves
- Responsive (mobile-first)
- Colores gráficas:
  - Confirmados: #22c55e
  - Cancelaciones: #ef4444
  - Pendientes: #f59e0b
  - Urgentes: #dc2626
  - No acude: #f97316
  - "Ya avisarán": #a855f7
  - Sin atender: #6b7280
  - Primeras visitas: #3b82f6
  - Conversaciones: #6366f1
  - Pacientes: #22d3ee

## SIDEBAR
Añadir enlace en el sidebar existente. El sidebar está en `src/components/layout/sidebar.tsx`. Añade un item:
```
{ icon: BarChart3, label: "Estadísticas", href: "/estadisticas" }
```
Ponlo después de "Informes" y antes de "Chat".

## IMPORTANTE
- NO crear layout.tsx (ya existe en `src/app/(dashboard)/layout.tsx`)
- NO modificar archivos existentes excepto sidebar.tsx (solo añadir el enlace)
- Usar `"use client"` en la página de estadísticas
- Manejar estado de carga (skeleton/spinner)
- Manejar datos vacíos con mensaje amigable
- Las gráficas deben ser responsive
- Usar el componente `recharts` con ResponsiveContainer
