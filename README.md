# Pedidos en tiempo y forma (OTIF) — ALAS

Módulo del Launcher **"Reporte de pedidos en tiempo y forma"**. Mide el cumplimiento OTIF
(*On Time In Full*) **por pedido**, a partir del export de pedidos/entregas de SAP.

> Este repo antes contenía **Productividad Picking**. Ese módulo ahora vive dentro de
> Items Borrados (`itemsborrados/picking/`). El código viejo quedó en la etiqueta
> `archive/picking-standalone`.

## Cómo se calcula
- **Completo**: todas las líneas del pedido entregadas y facturadas (`Cant.Fact. >= Ctd.ped.`).
- **A tiempo**: horas hábiles desde la carga del pedido hasta la **última** entrega ≤ plazo (SLA).
  El plazo se busca por condición de envío → departamento → zona → valor por defecto.
- **Entregado** = etapa 5 (culminado y entregado). Etapa 06 (no entregado) cuenta como **fuera de plazo**.
- Pedidos con entregas en etapa 04 (chofer) u otras sin cerrar **no se evalúan**: van a la lista
  *Entregas sin cerrar* para que logística las cierre en SAP.
- Calendario laboral, feriados, plazos y meta: tabla `otif_config`.

## Archivos
| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css`, `app.js` | Pantalla (shell del ecosistema + Resumen + animaciones GSAP) |
| `otif-calc.js` | Motor OTIF (horas hábiles en hora de Paraguay, SLA, agrupaciones) |
| `otif-import.js` | Lee el Excel de SAP tal cual sale y lo guarda (upsert, no duplica) |
| `otif-worker.js` | Lee el Excel en segundo plano para que la carga sea fluida |
| `otif_schema.sql` | Tablas en Supabase (pedidos, entregas, líneas, materiales, regiones, config) |
| `otif_views.sql` | Vista `otif_v_pedidos` (una fila por pedido) que lee la pantalla |

Supabase: proyecto `yvwslygebxuiivlzscpq`. Los Excel no se suben al repo (`.gitignore`).
