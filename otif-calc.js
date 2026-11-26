/* ============================================================
 * otif-calc.js — Motor del OTIF POR PEDIDO
 * ------------------------------------------------------------
 * Recibe las filas de la vista otif_v_pedidos + la configuración
 * (otif_config.data) y calcula a tiempo / completo / OTIF, tiempos
 * por tramo y agrupaciones. Navegador (window.OtifCalc) y Node.
 *
 * Reglas:
 *  - Solo cuentan las clases de documento incluidas (ZCRE, ZCOS).
 *  - Pedido EVALUADO = todas sus entregas tienen fecha de entrega.
 *  - A tiempo  = horas hábiles (carga → ÚLTIMA entrega) <= SLA.
 *  - Completo  = todas sus líneas entregadas y facturadas.
 *  - Sin despacho = ninguna entrega (todas las líneas rechazadas).
 *  - Entrega en etapa 06 (no entregado) = evaluado como FUERA DE PLAZO.
 *  - Sin registro = salió (o está en curso) pero alguna entrega no llegó a la
 *    etapa 5 (culminado y entregado). No se evalúa: va a "Entregas sin cerrar".
 *  - Horas hábiles: calendario de la config, en hora de Paraguay (UTC-3).
 * ============================================================ */
(function (root) {
  'use strict';

  var PY_OFFSET = -3 * 60;   // minutos
  var DIA = 1440;

  function crear(cfg) {
    cfg = cfg || {};
    var dias = (cfg.calendario && cfg.calendario.dias) || [null, [435, 1020], [435, 1020], [435, 1020], [435, 1020], [435, 1020], [435, 690]];
    var fer = new Set(cfg.feriados || []);
    var jornada = 0;   // jornada de referencia = la más larga (L-V)
    dias.forEach(function (d) { if (d && d[1] - d[0] > jornada) jornada = d[1] - d[0]; });
    if (!jornada) jornada = 585;
    var habiles = cfg.horas_habiles !== false;
    var clases = new Set(cfg.clases_doc_incluidas || ['ZCRE', 'ZCOS']);

    // ISO → minutos "locales de Paraguay" desde epoch
    function aMin(iso) { if (!iso) return null; var t = Date.parse(iso); return isNaN(t) ? null : Math.floor(t / 60000) + PY_OFFSET; }
    function claveDia(dayIdx) { var d = new Date(dayIdx * 86400000); return d.toISOString().slice(0, 10); }
    function ventana(dayIdx) {
      if (fer.has(claveDia(dayIdx))) return null;
      var dow = new Date(dayIdx * 86400000).getUTCDay();
      return dias[dow] || null;
    }
    // minutos hábiles entre a y b (minutos locales)
    function minHabiles(a, b) {
      if (a == null || b == null) return null;
      if (!habiles) return b - a;
      if (b <= a) return 0;
      var da = Math.floor(a / DIA), db = Math.floor(b / DIA), tot = 0;
      if (db - da > 400) return (b - a) * jornada / DIA;     // salvaguarda
      for (var d = da; d <= db; d++) {
        var w = ventana(d); if (!w) continue;
        var s = d * DIA + w[0], e = d * DIA + w[1];
        var x = Math.max(s, a), y = Math.min(e, b);
        if (y > x) tot += y - x;
      }
      return tot;
    }
    function jornadas(a, b) { var m = minHabiles(a, b); return m == null ? null : (habiles ? m / jornada : m / DIA); }

    function slaDe(p) {
      var c = cfg.sla_condicion || {}, d = cfg.sla_departamento || {}, z = cfg.sla_zona || {};
      var v = parseFloat(c[p.cond_exp]); if (v > 0) return v;
      v = parseFloat(d[p.departamento]); if (v > 0) return v;
      v = parseFloat(z[p.zona]); if (v > 0) return v;
      return parseFloat(cfg.sla_default) || 7;
    }

    // Clasifica un pedido (devuelve null si su clase no cuenta)
    function evaluar(p) {
      if (p.clase_doc && !clases.has(p.clase_doc)) return null;
      var car = aMin(p.fecha_carga);
      var o = { p: p, sla: slaDe(p), estado: '', ot: false, inf: false, otif: false, ciclo: null, tramos: {} };
      if (!p.n_entregas) { o.estado = 'sin_despacho'; return o; }
      o.inf = p.n_lineas > 0 && p.n_completas === p.n_lineas;
      // Alguna entrega en "06 - NO ENTREGADO": el reparto falló → se evalúa como FUERA DE PLAZO
      if (p.n_no_entregado > 0) { o.estado = 'evaluado'; o.noEnt = true; o.ot = false; o.otif = false; return o; }
      var ent = aMin(p.ts_entrega);
      if (p.n_entregadas < p.n_entregas || ent == null) { o.estado = 'sin_registro'; return o; }
      o.estado = 'evaluado';
      o.ciclo = jornadas(car, ent);
      o.ot = o.ciclo <= o.sla + 1e-9;
      o.otif = o.ot && o.inf;
      // Tramos en el orden real de SAP (medido sobre 4.218 entregas):
      // carga → entrega creada → control → factura → transporte → entrega al cliente.
      // Si falta una etapa (ej. retira el cliente, sin transporte) el tramo siguiente
      // arranca desde la última etapa disponible.
      var marcas = [['car', car], ['lib', aMin(p.ts_creacion)], ['pre', aMin(p.ts_control)], ['fac', aMin(p.ts_factura)], ['tra', aMin(p.ts_transporte)], ['rep', ent]];
      var prev = car;
      for (var i = 1; i < marcas.length; i++) {
        var t = marcas[i][1];
        if (t == null || t < prev) continue;
        o.tramos[marcas[i][0]] = jornadas(prev, t);
        prev = t;
      }
      return o;
    }

    function med(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
    function prom(a) { if (!a.length) return null; var s = 0; a.forEach(function (x) { s += x; }); return s / a.length; }

    function resumen(evs) {
      var g = { total: 0, evaluados: 0, ot: 0, inf: 0, otif: 0, sin_despacho: 0, sin_registro: 0, no_entregado: 0, ciclos: [], monto: 0, tramos: { lib: [], pre: [], fac: [], tra: [], rep: [] } };
      evs.forEach(function (o) {
        g.total++; g.monto += +o.p.monto_pedido || 0;
        if (o.estado === 'sin_despacho') { g.sin_despacho++; return; }
        if (o.estado === 'sin_registro') { g.sin_registro++; return; }
        g.evaluados++; if (o.ot) g.ot++; if (o.inf) g.inf++; if (o.otif) g.otif++;
        if (o.noEnt) { g.no_entregado++; return; }   // sin fecha real de llegada: no suma al ciclo
        g.ciclos.push(o.ciclo);
        for (var k in o.tramos) if (o.tramos[k] != null) g.tramos[k].push(o.tramos[k]);
      });
      var pc = function (n) { return g.evaluados ? n / g.evaluados * 100 : null; };
      g.pOt = pc(g.ot); g.pIn = pc(g.inf); g.pOtif = pc(g.otif);
      g.cicloMed = med(g.ciclos); g.cicloProm = prom(g.ciclos);
      g.tramosMed = {}; for (var k in g.tramos) g.tramosMed[k] = med(g.tramos[k]);
      return g;
    }

    function agrupar(evs, keyFn) {
      var m = new Map();
      evs.forEach(function (o) { var k = keyFn(o.p) || '—'; if (!m.has(k)) m.set(k, []); m.get(k).push(o); });
      return Array.from(m.entries()).map(function (e) { var r = resumen(e[1]); r.clave = e[0]; return r; });
    }

    return { evaluar: evaluar, resumen: resumen, agrupar: agrupar, slaDe: slaDe, jornadas: jornadas, minHabiles: minHabiles, aMin: aMin, jornada: jornada };
  }

  var api = { crear: crear };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OtifCalc = api;
})(typeof window !== 'undefined' ? window : this);
