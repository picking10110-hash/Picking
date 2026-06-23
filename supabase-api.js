/**
 * supabase-api.js — Capa de acceso a datos del módulo Productividad Picking
 *
 * Expone window.PickingAPI con métodos async para:
 *  - Preparadores (perfiles: foto + meta)
 *  - Importaciones (cargas de Excel por mes)
 *  - Productividad (datos por preparador por mes)
 *
 * Si Supabase no está disponible, los métodos devuelven null y la app
 * cae al fallback de localStorage.
 */
(function () {
  'use strict';

  function db() { return window.__pickingDB || null; }
  function ready() { return !!db(); }

  var PickingAPI = {

    isReady: ready,

    // ── PREPARADORES ──────────────────────────────────────────
    async getPreparadores() {
      if (!ready()) return null;
      var res = await db().from('preparadores').select('*').eq('activo', true).order('nombre');
      if (res.error) { console.warn('[PickingAPI] getPreparadores:', res.error.message); return null; }
      return res.data;
    },

    async upsertPreparador(p) {
      if (!ready()) return null;
      var row = {
        codigo:         p.codigo,
        nombre:         p.nombre,
        avatar_type:    p.avatarType || 'preset',
        avatar_value:   p.avatarValue || 'avatar1',
        meta_monto_mes: p.metaMontoMes || 18000000,
        meta_items_mes: p.metaItemsMes || 1600,
        activo:         p.activo !== false
      };
      var res = await db().from('preparadores').upsert(row, { onConflict: 'codigo' }).select().single();
      if (res.error) { console.warn('[PickingAPI] upsertPreparador:', res.error.message); return null; }
      return res.data;
    },

    async updatePreparadorMeta(codigo, field, value) {
      if (!ready()) return null;
      var col = field === 'metaMontoMes' ? 'meta_monto_mes' : 'meta_items_mes';
      var patch = {}; patch[col] = value;
      var res = await db().from('preparadores').update(patch).eq('codigo', codigo);
      if (res.error) { console.warn('[PickingAPI] updateMeta:', res.error.message); return null; }
      return true;
    },

    async updatePreparadorFoto(codigo, avatarType, avatarValue) {
      if (!ready()) return null;
      var res = await db().from('preparadores')
        .update({ avatar_type: avatarType, avatar_value: avatarValue })
        .eq('codigo', codigo);
      if (res.error) { console.warn('[PickingAPI] updateFoto:', res.error.message); return null; }
      return true;
    },

    // Inserta preparadores que NO existan (no pisa foto/meta de los existentes)
    async ensurePreparadores(list) {
      if (!ready() || !list || !list.length) return null;
      var rows = list.map(function (p) {
        return { codigo: p.code, nombre: p.name };
      });
      var res = await db().from('preparadores')
        .upsert(rows, { onConflict: 'codigo', ignoreDuplicates: true });
      if (res.error) { console.warn('[PickingAPI] ensurePreparadores:', res.error.message); return null; }
      return true;
    },

    async deletePreparador(codigo) {
      if (!ready()) return null;
      var res = await db().from('preparadores').update({ activo: false }).eq('codigo', codigo);
      if (res.error) { console.warn('[PickingAPI] deletePreparador:', res.error.message); return null; }
      return true;
    },

    // ── IMPORTACIONES + PRODUCTIVIDAD ─────────────────────────
    async getPeriodos() {
      if (!ready()) return null;
      var res = await db().from('importaciones').select('periodo').order('periodo', { ascending: false });
      if (res.error) { console.warn('[PickingAPI] getPeriodos:', res.error.message); return null; }
      var uniq = [];
      (res.data || []).forEach(function (r) { if (uniq.indexOf(r.periodo) === -1) uniq.push(r.periodo); });
      return uniq;
    },

    async getUltimaImportacion() {
      if (!ready()) return null;
      var res = await db().from('importaciones')
        .select('periodo, fecha_carga, nombre_archivo')
        .order('fecha_carga', { ascending: false })
        .limit(1);
      if (res.error || !res.data || !res.data.length) return null;
      return res.data[0];
    },

    async getProductividad(periodo) {
      if (!ready()) return null;
      var q = db().from('productividad').select('*');
      if (periodo) q = q.eq('periodo', periodo);
      var res = await q.order('monto', { ascending: false });
      if (res.error) { console.warn('[PickingAPI] getProductividad:', res.error.message); return null; }
      return res.data;
    },

    /**
     * Guarda una importación completa (header + filas de productividad).
     * @param {string} periodo  'YYYY-MM'
     * @param {string} nombreArchivo
     * @param {object} totals  { monto, items, lineas, pedidos, preparadores }
     * @param {array}  pickers [{ code, name, lineas, items, monto, pedidos, ticketPromedio, itemsPorPedido }]
     */
    async saveImportacion(periodo, nombreArchivo, totals, pickers) {
      if (!ready()) return null;

      // ¿Ya había datos de este período? (para informar reemplazo vs nuevo)
      var prev = await db().from('importaciones').select('id, total_pedidos').eq('periodo', periodo);
      var replaced = !!(prev.data && prev.data.length);
      var prevPedidos = replaced ? (prev.data[0].total_pedidos || 0) : 0;
      if (replaced) {
        var ids = prev.data.map(function (r) { return r.id; });
        await db().from('importaciones').delete().in('id', ids);
      }

      var imp = await db().from('importaciones').insert({
        periodo:            periodo,
        nombre_archivo:     nombreArchivo,
        total_monto:        totals.monto,
        total_items:        totals.items,
        total_lineas:       totals.lineas,
        total_pedidos:      totals.pedidos,
        total_preparadores: totals.preparadores
      }).select().single();

      if (imp.error) { console.warn('[PickingAPI] saveImportacion header:', imp.error.message); return null; }

      var rows = pickers.map(function (p) {
        return {
          importacion_id:    imp.data.id,
          periodo:           periodo,
          preparador_codigo: p.code,
          preparador_nombre: p.name,
          lineas:            p.lineas,
          items:             p.items,
          monto:             p.monto,
          pedidos:           p.pedidos,
          ticket_promedio:   p.ticketPromedio,
          items_por_pedido:  p.itemsPorPedido
        };
      });

      var prod = await db().from('productividad').insert(rows);
      if (prod.error) { console.warn('[PickingAPI] saveImportacion rows:', prod.error.message); return null; }

      return { id: imp.data.id, replaced: replaced, prevPedidos: prevPedidos };
    }
  };

  window.PickingAPI = PickingAPI;
})();
