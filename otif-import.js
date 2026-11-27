/* ============================================================
 * otif-import.js — Importador del export SAP de pedidos (OTIF)
 * ------------------------------------------------------------
 * Lee el Excel tal cual sale de SAP (1 fila = pedido + posición)
 * y arma las filas de: otif_pedidos, otif_entregas, otif_lineas,
 * otif_materiales. Funciona en el navegador (window.OtifImport)
 * y en Node (module.exports) — así se prueba con el Excel real.
 *
 * Reglas (verificadas contra "proyecto 1.XLSX", 17.069 filas):
 *  - La última fila es de TOTALES (sin Doc.vtas.) → se ignora.
 *  - Entrega = '0' → la línea nunca se entregó (entrega = null).
 *  - Fechas/horas: seriales de Excel en hora de Paraguay (UTC-3).
 *    Se convierten SIN pasar por Date local (SheetJS corre las
 *    horas 3:50:40 en fechas de 1899 por el huso histórico).
 *  - SAP exporta la Ñ como '･' (U+FF65) → se corrige.
 * ============================================================ */
(function (root) {
  'use strict';

  var REQUERIDAS = ['Doc.vtas.', 'Pos', 'Entrega', 'Fecha Carga', 'Hora Carga', 'Ctd.ped.', 'Cant.Fact.'];
  // Todas las columnas del export que lee el importador (el lector por partes descarta el resto)
  var COLUMNAS = REQUERIDAS.concat(['%Desc', 'Almacén', 'Cant.Bultos', 'Cant.Entreg.', 'ClDoc', 'Cond.Real', 'Cond.exp.', 'Cond.pago', 'Creado',
    'Denomin.', 'Denominación', 'Desc.Gr.Cli.', 'Descr. Etapa', 'Descr. Mot. Rech.', 'Factura', 'Fech.Creac.Entrega', 'Fech.Manif', 'Fech.Ult.Etapa',
    'Fecha Control', 'Fecha Empaque', 'Fecha Entrega', 'Fecha Factura', 'Fecha Prep', 'Fecha Transp', 'GrVendedor', 'Hora Control', 'Hora Creac.Entrega',
    'Hora Empaque', 'Hora Entrega', 'Hora Factura', 'Hora Manif', 'Hora Prep', 'Hora Transp', 'Hora Ult.Etapa', 'JquíaProd', 'Material', 'Mot.Ped',
    'Motivo Etapa', 'Nombre', 'Nombre_1', 'Nro.Manif', 'Nº pers.', 'Ofic.vta.', 'Ped.Cliente', 'Precio', 'PuestExped', 'Region', 'Sector', 'Solic.',
    'Transporte', 'Ult.Etapa', 'Unidad', 'Usuario Control', 'Usuario Empaque', 'Usuario Entrega', 'Usuario Transp']);
  var TZ = '-03:00';

  function txt(v) {
    if (v === null || v === undefined) return null;
    var s = String(v).replace(/･/g, 'Ñ').trim();
    return s === '' ? null : s;
  }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (v === null || v === undefined || v === '') return 0;
    var s = String(v).trim().replace(/\./g, '').replace(',', '.');
    var neg = /-$/.test(s); s = s.replace(/-$/, '');
    var n = parseFloat(s); return isFinite(n) ? (neg ? -n : n) : 0;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Serial de Excel (días desde 1899-12-30) → 'YYYY-MM-DD' sin zona horaria
  function serialADia(serial) {
    var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  // Fecha (serial entero) + hora (fracción de día) → ISO con offset de Paraguay
  function ts(fecha, hora) {
    if (typeof fecha !== 'number' || fecha < 20000) return null;
    var dia = serialADia(fecha);
    var seg = 0;
    if (typeof hora === 'number' && hora > 0) seg = Math.round((hora % 1) * 86400);
    else if (fecha % 1) seg = Math.round((fecha % 1) * 86400);
    if (seg >= 86400) seg = 86399;
    return dia + 'T' + pad(Math.floor(seg / 3600)) + ':' + pad(Math.floor(seg % 3600 / 60)) + ':' + pad(seg % 60) + TZ;
  }
  function minTs(a, b) { if (!a) return b; if (!b) return a; return a < b ? a : b; }
  function entregaDe(v) { var s = txt(v); return (!s || /^0+$/.test(s)) ? null : s; }
  // Letra del código SAP → departamento y zona (misma regla que la carga inicial de otif_regiones)
  var DEPTOS = { A: ['Asuncion', 'Capital'], S: ['Central', 'Capital'], B: ['Concepcion', 'Interior'], C: ['Amambay', 'Interior'], D: ['San Pedro', 'Interior'],
    E: ['Canindeyu', 'Interior'], F: ['Alto Parana', 'Interior'], G: ['Caaguazu', 'Interior'], H: ['Cordillera', 'Interior'], I: ['Paraguari', 'Interior'],
    J: ['Guaira', 'Interior'], K: ['Caazapa', 'Interior'], L: ['Itapua', 'Interior'], M: ['Misiones', 'Interior'], N: ['Neembucu', 'Interior'], R: ['Chaco', 'Interior'] };
  // 'S11 -LUQUE' → { region_cod:'S11', nombre:'LUQUE', departamento, zona }  (null si la letra no es conocida)
  function regionFila(v) {
    var s = txt(v); if (!s) return null;
    var m = s.match(/^([A-Z])(\d+)\s*-?\s*(.*)$/); if (!m || !DEPTOS[m[1]]) return null;
    var d = DEPTOS[m[1]];
    return { region_cod: m[1] + m[2], nombre: (m[3] || '').trim() || m[1] + m[2], departamento: d[0], zona: d[1] };
  }
  function regionDe(v) { var s = txt(v); if (!s) return null; var m = s.match(/^([A-Z]\d+)/); return m ? m[1] : s.slice(0, 10); }

  /**
   * Parsea el workbook. Devuelve { ok, error?, pedidos, entregas, lineas, materiales, meta }.
   * XLSX = SheetJS (window.XLSX o require('xlsx')).
   */
  function parsear(XLSX, wb) {
    var ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return { ok: false, error: wb.SheetNames.length ? 'El Excel es demasiado grande para leerlo de una vez.' : 'El archivo no tiene hojas.' };
    return parsearFilas(XLSX.utils.sheet_to_json(ws, { defval: null, raw: true }));
  }

  /** Igual que parsear, pero desde filas ya leídas (formato sheet_to_json raw). */
  function parsearFilas(filas, columnas) {
    if (!filas.length) return { ok: false, error: 'La hoja está vacía.' };
    var cols = columnas || Object.keys(filas[0]);
    var faltan = REQUERIDAS.filter(function (c) { return cols.indexOf(c) < 0; });
    if (faltan.length) return { ok: false, error: 'No es el export de pedidos de SAP. Faltan las columnas: ' + faltan.join(', ') + '.' };

    var P = new Map(), E = new Map(), L = new Map(), M = new Map(), RG = new Map();
    var desde = null, hasta = null, validas = 0, repetidas = 0;

    filas.forEach(function (r) {
      var doc = txt(r['Doc.vtas.']);
      if (!doc) return;                       // fila de totales / vacía
      validas++;
      var fc = ts(r['Fecha Carga'], r['Hora Carga']);
      if (!fc) return;
      var dia = fc.slice(0, 10);
      if (!desde || dia < desde) desde = dia;
      if (!hasta || dia > hasta) hasta = dia;

      var rg = regionFila(r['Region']); if (rg && !RG.has(rg.region_cod)) RG.set(rg.region_cod, rg);

      // ── Pedido (constante en todas sus líneas)
      if (!P.has(doc)) P.set(doc, {
        doc_vtas: doc, fecha_carga: fc,
        clase_doc: txt(r['ClDoc']), cond_exp: txt(r['Cond.exp.']), cond_pago: txt(r['Cond.pago']),
        region_cod: regionDe(r['Region']),
        cliente_cod: txt(r['Solic.']), cliente_nombre: txt(r['Nombre']), grupo_cliente: txt(r['Desc.Gr.Cli.']),
        vendedor_cod: txt(r['Nº pers.']), vendedor_nombre: txt(r['Nombre_1']), grupo_vendedor: txt(r['GrVendedor']),
        oficina_venta: txt(r['Ofic.vta.']), sector: txt(r['Sector']), creado_por: txt(r['Creado']),
        motivo_pedido: txt(r['Mot.Ped']), ped_cliente: txt(r['Ped.Cliente']), estado: txt(r['Denominación'])
      });

      // ── Entrega (las etapas son constantes por entrega)
      var ent = entregaDe(r['Entrega']);
      if (ent) {
        var e = E.get(ent);
        if (!e) {
          e = {
            entrega: ent, doc_vtas: doc, almacen: txt(r['Almacén']), puesto_exped: txt(r['PuestExped']), cond_real: txt(r['Cond.Real']),
            ts_creacion: ts(r['Fech.Creac.Entrega'], r['Hora Creac.Entrega']),
            ts_preparacion: ts(r['Fecha Prep'], r['Hora Prep']),
            ts_control: ts(r['Fecha Control'], r['Hora Control']),
            ts_empaque: ts(r['Fecha Empaque'], r['Hora Empaque']),
            ts_factura: null, nro_factura: null,
            ts_transporte: ts(r['Fecha Transp'], r['Hora Transp']),
            ts_manifiesto: null, nro_manifiesto: null, transporte: null,
            ts_entrega: ts(r['Fecha Entrega'], r['Hora Entrega']),
            ts_ult_etapa: ts(r['Fech.Ult.Etapa'], r['Hora Ult.Etapa']),
            ult_etapa: num(r['Ult.Etapa']) || null, etapa_desc: txt(r['Descr. Etapa']), motivo_etapa: txt(r['Motivo Etapa']),
            usuario_control: txt(r['Usuario Control']), usuario_empaque: txt(r['Usuario Empaque']),
            usuario_transp: txt(r['Usuario Transp']), usuario_entrega: txt(r['Usuario Entrega']),
            bultos: 0
          };
          E.set(ent, e);
        }
        // Lo que varía por línea dentro de la entrega
        var tf = ts(r['Fecha Factura'], r['Hora Factura']);
        if (tf && (!e.ts_factura || tf < e.ts_factura)) { e.ts_factura = tf; e.nro_factura = entregaDe(r['Factura']); }
        if (!e.nro_factura) e.nro_factura = entregaDe(r['Factura']);
        var tm = ts(r['Fech.Manif'], r['Hora Manif']);
        if (tm) e.ts_manifiesto = minTs(e.ts_manifiesto, tm);
        if (!e.nro_manifiesto) e.nro_manifiesto = txt(r['Nro.Manif']);
        if (!e.transporte) e.transporte = txt(r['Transporte']);
        e.bultos += Math.round(num(r['Cant.Bultos']));
      }

      // ── Línea (pedido + posición)
      var pos = parseInt(num(r['Pos']), 10);
      var mat = txt(r['Material']);
      if (L.has(doc + '|' + pos)) repetidas++;     // fila repetida en el Excel: se toma una sola vez
      L.set(doc + '|' + pos, {
        doc_vtas: doc, pos: pos, entrega: ent, material: mat, unidad: txt(r['Unidad']),
        cant_pedida: num(r['Ctd.ped.']), cant_entregada: num(r['Cant.Entreg.']), cant_facturada: num(r['Cant.Fact.']),
        precio: num(r['Precio']), desc_pct: num(r['%Desc']), motivo_rechazo: txt(r['Descr. Mot. Rech.'])
      });
      if (mat && !M.has(mat)) M.set(mat, { material: mat, descripcion: txt(r['Denomin.']), jerarquia: txt(r['JquíaProd']) });
    });

    if (!P.size) return { ok: false, error: 'No encontré pedidos con fecha de carga en el archivo.' };
    var entregas = Array.from(E.values());
    entregas.forEach(function (e) { if (!e.bultos) e.bultos = null; });
    return {
      ok: true,
      pedidos: Array.from(P.values()), entregas: entregas,
      lineas: Array.from(L.values()), materiales: Array.from(M.values()), regiones: Array.from(RG.values()),
      meta: { filas: validas, repetidas: repetidas, pedidos: P.size, entregas: E.size, lineas: L.size, materiales: M.size, carga_desde: desde, carga_hasta: hasta }
    };
  }

  /**
   * Sube el resultado de parsear() usando un adaptador:
   *   db.insertImport(row) → Promise<{id}>
   *   db.existentes(table, keyCol, keys[]) → Promise<string[]>
   *   db.upsert(table, rows, onConflict) → Promise
   * onProgress(pct, texto) opcional.
   */
  // Cuántos pedidos del Excel ya están en la base (para avisar si se repite una carga)
  async function contarExistentes(db, res) {
    var ids = res.pedidos.map(function (p) { return p.doc_vtas; }), ya = 0;
    for (var i = 0; i < ids.length; i += 500) ya += (await db.existentes('otif_pedidos', 'doc_vtas', ids.slice(i, i + 500))).length;
    return ya;
  }

  async function subir(db, res, info, onProgress) {
    var prog = onProgress || function () {};
    var LOTE = 500;
    prog(2, 'Revisando pedidos existentes…');
    var ya = info.ya != null ? info.ya : await contarExistentes(db, res);
    var imp = await db.insertImport({
      archivo: info.archivo || null, cargado_por: info.usuario || null,
      filas: res.meta.filas, pedidos: res.meta.pedidos, entregas: res.meta.entregas,
      pedidos_nuevos: res.meta.pedidos - ya, carga_desde: res.meta.carga_desde, carga_hasta: res.meta.carga_hasta
    });
    var conId = function (arr) { return arr.map(function (x) { var o = Object.assign({}, x); o.importacion_id = imp.id; return o; }); };
    if (res.regiones && res.regiones.length) {
      prog(3, 'Registrando localidades…');
      await db.upsert('otif_regiones', res.regiones, 'region_cod', true);
    }
    var pasos = [
      ['otif_pedidos', conId(res.pedidos).map(function (p) { p.actualizado_en = new Date().toISOString(); return p; }), 'doc_vtas', 'pedidos'],
      ['otif_materiales', res.materiales, 'material', 'materiales'],
      ['otif_entregas', conId(res.entregas).map(function (e) { e.actualizado_en = new Date().toISOString(); return e; }), 'entrega', 'entregas'],
      ['otif_lineas', conId(res.lineas), 'doc_vtas,pos', 'líneas']
    ];
    var total = pasos.reduce(function (a, p) { return a + p[1].length; }, 0), hechos = 0;
    for (var k = 0; k < pasos.length; k++) {
      var t = pasos[k], rows = t[1];
      for (var j = 0; j < rows.length; j += LOTE) {
        await db.upsert(t[0], rows.slice(j, j + LOTE), t[2]);
        hechos += Math.min(LOTE, rows.length - j);
        prog(5 + Math.round(hechos / total * 93), 'Guardando ' + t[3] + '…');
      }
    }
    prog(100, 'Listo');
    return { importacion_id: imp.id, nuevos: res.meta.pedidos - ya, actualizados: ya };
  }

  var api = { parsear: parsear, parsearFilas: parsearFilas, regionFila: regionFila, COLUMNAS: COLUMNAS, subir: subir, contarExistentes: contarExistentes, ts: ts, REQUERIDAS: REQUERIDAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OtifImport = api;
})(typeof window !== 'undefined' ? window : this);
