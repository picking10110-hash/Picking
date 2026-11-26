-- ============================================================
-- REPORTE OTIF — Vista por pedido (lo que lee la pantalla)
-- Proyecto: picking10110-hash (yvwslygebxuiivlzscpq)
-- Ejecutar en Supabase Studio → SQL Editor DESPUÉS de otif_schema.sql.
-- Idempotente (create or replace).
--
-- Una fila por pedido con todo lo necesario para el OTIF POR PEDIDO:
--  · completo  = todas sus líneas entregadas y facturadas (cant_facturada >= cant_pedida)
--  · a tiempo  = la ÚLTIMA entrega llegó dentro del plazo (se calcula en la pantalla,
--                en horas hábiles, con el SLA de la configuración)
-- ============================================================
create or replace view public.otif_v_pedidos
with (security_invoker = true) as
select
  p.doc_vtas,
  p.fecha_carga,
  p.clase_doc,
  p.cond_exp,
  p.region_cod,
  r.nombre                                    as region_nombre,
  coalesce(r.departamento, 'Sin departamento') as departamento,
  coalesce(r.zona, 'Sin zona')                 as zona,
  p.cliente_cod,
  p.cliente_nombre,
  p.grupo_cliente,
  p.vendedor_cod,
  p.vendedor_nombre,
  p.estado,
  -- líneas
  l.n_lineas,
  l.n_completas,
  l.n_sin_entrega,
  l.monto_pedido,
  l.n_prod,
  -- entregas
  e.n_entregas,
  e.n_entregadas,
  e.n_no_entregado,
  e.almacen,
  e.ts_factura,       -- primera factura
  e.ts_creacion,      -- primera entrega creada
  e.ts_control,       -- primer control
  e.ts_empaque,
  e.ts_transporte,    -- primera asignación de transporte
  e.ts_entrega,       -- ÚLTIMA entrega al cliente (cierra el pedido)
  e.ult_etapa
from public.otif_pedidos p
left join public.otif_regiones r on r.region_cod = p.region_cod
left join lateral (
  select
    count(*)::int                                                              as n_lineas,
    count(*) filter (where x.entrega is not null
                       and x.cant_facturada >= x.cant_pedida)::int             as n_completas,
    count(*) filter (where x.entrega is null)::int                             as n_sin_entrega,
    round(sum(x.cant_pedida * x.precio * (1 - x.desc_pct / 100)))::bigint      as monto_pedido,
    count(*) filter (where x.material ~* '^LA.*FAA?$')::int                    as n_prod
  from public.otif_lineas x
  where x.doc_vtas = p.doc_vtas
) l on true
left join lateral (
  select
    count(*)::int                                   as n_entregas,
    count(y.ts_entrega)::int                        as n_entregadas,
    count(*) filter (where y.ult_etapa = 6)::int    as n_no_entregado,
    mode() within group (order by y.almacen)        as almacen,
    min(y.ts_factura)                               as ts_factura,
    min(y.ts_creacion)                              as ts_creacion,
    min(y.ts_control)                               as ts_control,
    min(y.ts_empaque)                               as ts_empaque,
    min(y.ts_transporte)                            as ts_transporte,
    max(y.ts_entrega)                               as ts_entrega,
    min(y.ult_etapa)                                as ult_etapa
  from public.otif_entregas y
  where y.doc_vtas = p.doc_vtas
) e on true;

grant select on public.otif_v_pedidos to anon, authenticated;
