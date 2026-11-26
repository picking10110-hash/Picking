/* ============================================================
 * app.js — Pedidos en tiempo y forma (OTIF) · ALAS
 * ------------------------------------------------------------
 * Shell del ecosistema + pantalla Resumen (estilo Facturación /
 * Estadísticas de Flete) con animaciones GSAP.
 * Datos: vista otif_v_pedidos (1 fila por pedido) + config.
 * Carga: el admin sube el Excel de SAP tal cual (otif-import.js).
 * ============================================================ */
(function () {
  'use strict';

  /* ── Helpers ── */
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var nf = function (n, d) { return (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('es-PY', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var pf = function (n, d) { return (n == null || isNaN(n)) ? '—' : nf(n, d == null ? 1 : d) + '%'; };
  var gs = function (n) { var a = Math.abs(n || 0); if (a >= 1e9) return 'Gs. ' + nf(n / 1e9, 2) + ' MM'; if (a >= 1e6) return 'Gs. ' + nf(n / 1e6, 1) + ' M'; return 'Gs. ' + nf(n); };
  var jd = function (n) { return n == null ? '—' : nf(n, 2) + ' j'; };
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var GS = !!window.gsap;

  function animCount(node, to, fmtFn, dur) {
    if (!node) return;
    if (!GS || to == null || isNaN(to)) { node.textContent = fmtFn(to); return; }
    if (node._ct) node._ct.kill();
    var o = { v: 0 };
    node._ct = gsap.to(o, { v: to, duration: dur || 1, ease: 'power2.out', onUpdate: function () { node.textContent = fmtFn(o.v); }, onComplete: function () { node.textContent = fmtFn(to); } });
  }
  function toast(msg, err) {
    var t = el('<div class="toast ' + (err ? 'toast--err' : '') + '">' + esc(msg) + '</div>');
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3000);
  }

  var IC = {
    upload: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
    refresh: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
    grid: '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
    deposito: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V9.5l7-4 7 4V21"/><path d="M9 21v-6h6v6"/><path d="M9 11.5h6"/></svg>',
    fabrica: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V11l5 3V11l5 3V8l5 3v10"/><path d="M8 21v-4h3v4"/></svg>',
    empty: '<svg fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 2 4-6"/></svg>',
    soon: '<svg fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    clock: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>'
  };

  /* ── Estado ── */
  var DB = window.__otifDB;
  var CFG = null, CALC = null, IMPORTS = [], MONTHS = [], CUR = null;
  var ROWS = [], EVS = [], MOTIVOS = [], SIN_CERRAR = [];
  var SCOPE = 'tot', VIEW = 'resumen';
  var TRAMOS = [
    ['lib', 'Liberación del pedido', 'carga → entrega creada', '#9FC9EC'],
    ['pre', 'Preparación', 'entrega creada → control', '#5FA3DD'],
    ['fac', 'Facturación', 'control → factura', '#2F7FC6'],
    ['tra', 'Espera de transporte', 'factura → asignación de transporte', '#0B5F8D'],
    ['rep', 'Reparto', 'transporte → entrega al cliente', '#0A4578']
  ];

  // SAP corta los motivos de rechazo a 20 caracteres
  var MOTIVO_TXT = {
    'Cliente desiste de l': 'Cliente desiste de la compra', 'Facturado en otro Pe': 'Facturado en otro pedido',
    'Error código de clie': 'Error en código de cliente', 'Borrar uno o más ite': 'Borrar uno o más ítems'
  };
  function motivoTxt(m) { return m ? (MOTIVO_TXT[m] || m) : 'Sin motivo en SAP (pendiente)'; }

  function isAdmin() { var c = window.AlasAuthClient, r = c && c.getRole ? String(c.getRole() || '').toLowerCase() : ''; return r === 'admin' || r === 'supervisor'; }
  function userName() { var c = window.AlasAuthClient; return c && c.getCurrentUser ? c.getCurrentUser() : null; }

  /* ── Datos ── */
  function rangoMes(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7), ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
    return [ym + '-01T00:00:00-03:00', ny + '-' + pad(nm) + '-01T00:00:00-03:00'];
  }
  function mesesEntre(d1, d2) {
    var out = [], y = +d1.slice(0, 4), m = +d1.slice(5, 7), y2 = +d2.slice(0, 4), m2 = +d2.slice(5, 7);
    while (y < y2 || (y === y2 && m <= m2)) { out.push(y + '-' + pad(m)); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  async function paginar(build) {
    var out = [], PAGE = 1000;
    for (var off = 0; ; off += PAGE) {
      var r = await build().range(off, off + PAGE - 1);
      if (r.error) throw r.error;
      out = out.concat(r.data || []);
      if (!r.data || r.data.length < PAGE) break;
    }
    return out;
  }
  async function cargarBase() {
    var c = await DB.from('otif_config').select('data').eq('id', 1).maybeSingle();
    if (c.error) throw c.error;
    CFG = (c.data && c.data.data) || {};
    CALC = OtifCalc.crear(CFG);
    var im = await DB.from('otif_importaciones').select('cargado_en,cargado_por,carga_desde,carga_hasta,archivo,pedidos').order('cargado_en', { ascending: false });
    if (im.error) throw im.error;
    IMPORTS = im.data || [];
    var set = new Set();
    IMPORTS.forEach(function (i) { if (i.carga_desde && i.carga_hasta) mesesEntre(i.carga_desde, i.carga_hasta).forEach(function (m) { set.add(m); }); });
    MONTHS = Array.from(set).sort();
    if (!CUR || MONTHS.indexOf(CUR) < 0) CUR = MONTHS[MONTHS.length - 1] || null;
  }
  var COLS = 'doc_vtas,fecha_carga,clase_doc,cond_exp,region_cod,departamento,zona,cliente_cod,cliente_nombre,vendedor_cod,vendedor_nombre,n_lineas,n_completas,n_sin_entrega,monto_pedido,n_entregas,n_entregadas,n_no_entregado,almacen,ts_factura,ts_creacion,ts_control,ts_transporte,ts_entrega,ult_etapa';
  async function cargarMes() {
    if (!CUR) { ROWS = []; MOTIVOS = []; return; }
    var r = rangoMes(CUR);
    var res = await Promise.all([
      paginar(function () { return DB.from('otif_v_pedidos').select(COLS).gte('fecha_carga', r[0]).lt('fecha_carga', r[1]).order('doc_vtas'); }),
      paginar(function () {
        return DB.from('otif_lineas').select('doc_vtas,motivo_rechazo,cant_pedida,precio,desc_pct,otif_pedidos!inner(fecha_carga)')
          .is('entrega', null).gte('otif_pedidos.fecha_carga', r[0]).lt('otif_pedidos.fecha_carga', r[1]).order('doc_vtas').order('pos');
      })
    ]);
    ROWS = res[0]; MOTIVOS = res[1];
    EVS = ROWS.map(CALC.evaluar).filter(Boolean);
  }

  function enScope(o) {
    if (SCOPE === 'fer') return o.p.almacen === 'LDAL';
    if (SCOPE === 'hie') return o.p.almacen === 'LDFA';
    return true;
  }
  function diaPY(iso) { var t = CALC.aMin(iso); return new Date(t * 60000).toISOString().slice(0, 10); }

  /* ── Toolbar ── */
  function mesLbl(ym) { return ym ? MESES[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) : '—'; }
  function toolbarHtml() {
    var idx = MONTHS.indexOf(CUR), last = IMPORTS[0], chip = '';
    if (last && last.cargado_en) {
      var d = new Date(last.cargado_en);
      chip = '<span class="upd-chip" title="Último Excel cargado' + (last.cargado_por ? ' por ' + esc(last.cargado_por) : '') + '">' + IC.clock + '<span>Última actualización</span> <b>' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</b></span>';
    }
    function sb(s, ico, lbl) { return '<button class="scopebtn' + (SCOPE === s ? ' on' : '') + '" data-s="' + s + '">' + ico + lbl + '</button>'; }
    return '<div class="tbd-toolbar">' +
      '<div class="tbd-title"><h2 id="tbTitle">Pedidos en tiempo y forma</h2><span class="sub" id="tbSub"></span></div>' +
      '<div id="scopeSlot"><div class="scopebar" id="scopeSeg">' + sb('tot', IC.grid, 'Total') + sb('fer', IC.deposito, 'Ferretería') + sb('hie', IC.fabrica, 'Hierros') + '</div></div>' +
      '<span class="spacer"></span>' + chip +
      '<div class="mnav"><button class="mnav__btn" id="mnPrev"' + (idx > 0 ? '' : ' disabled') + ' title="Mes anterior">‹</button><span class="mnav__cur" id="mnCur">' + esc(mesLbl(CUR)) + '</span><button class="mnav__btn" id="mnNext"' + (idx >= 0 && idx < MONTHS.length - 1 ? '' : ' disabled') + ' title="Mes siguiente">›</button></div>' +
      '<button class="refresh-btn" id="btnRefresh" type="button" title="Refrescar datos">' + IC.refresh + '</button>' +
      (isAdmin() ? '<button class="btn btn--primary btn--hero" id="btnActualizar">' + IC.upload + ' Actualizar base</button>' : '') +
      '</div>';
  }
  function wireToolbar() {
    var b = q('#btnActualizar'); if (b) b.addEventListener('click', function () { q('#fileBase').click(); });
    q('#btnRefresh').addEventListener('click', refrescar);
    q('#mnPrev').addEventListener('click', function () { var i = MONTHS.indexOf(CUR); if (i > 0) irMes(MONTHS[i - 1], -1); });
    q('#mnNext').addEventListener('click', function () { var i = MONTHS.indexOf(CUR); if (i < MONTHS.length - 1) irMes(MONTHS[i + 1], 1); });
    qa('#scopeSeg .scopebtn').forEach(function (bt) {
      bt.addEventListener('click', function () {
        if (SCOPE === bt.dataset.s) return;
        SCOPE = bt.dataset.s;
        qa('#scopeSeg .scopebtn').forEach(function (x) { x.classList.toggle('on', x === bt); });
        if (GS) { gsap.fromTo(bt, { scale: .92 }, { scale: 1, duration: .4, ease: 'back.out(2.4)', clearProps: 'transform' }); var ic = bt.querySelector('svg'); if (ic) gsap.fromTo(ic, { rotate: -18, scale: .7 }, { rotate: 0, scale: 1, duration: .5, ease: 'back.out(2.6)', clearProps: 'transform' }); }
        renderPagina(false);
      });
    });
  }

  /* ── Shell ── */
  function renderShell() {
    var st = q('#stage');
    if (!MONTHS.length) {
      st.innerHTML = '<div class="tbd-toolbar"><div class="tbd-title"><h2>Pedidos en tiempo y forma</h2><span class="sub">Todavía no hay datos cargados</span></div><span class="spacer"></span>' +
        (isAdmin() ? '<button class="btn btn--primary btn--hero" id="btnActualizar">' + IC.upload + ' Actualizar base</button>' : '') + '</div>' +
        '<div class="empty">' + IC.empty + '<h3>Todavía no hay una base cargada</h3><p>' + (isAdmin() ? 'Usá <b>Actualizar base</b> para subir el Excel de pedidos de SAP tal como sale.' : 'Pedile a un administrador que cargue el Excel de pedidos.') + '</p></div>';
      var b = q('#btnActualizar'); if (b) b.addEventListener('click', function () { q('#fileBase').click(); });
      return;
    }
    st.innerHTML = toolbarHtml() + '<div class="ot" id="otBody"></div>';
    wireToolbar();
    if (GS) {
      gsap.from('#stage .tbd-toolbar', { opacity: 0, y: -8, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('#scopeSeg .scopebtn', { opacity: 0, y: -10, scale: .9, duration: .42, stagger: .07, ease: 'back.out(1.8)', clearProps: 'transform,opacity', delay: .08 });
    }
    renderPagina(true);
  }

  function renderPagina(entrada) {
    var body = q('#otBody'); if (!body) return;
    var scopeSlot = q('#scopeSlot'); if (scopeSlot) scopeSlot.style.display = VIEW === 'parametros' ? 'none' : '';
    if (VIEW === 'resumen') renderResumen(body, entrada);
    else renderPronto(body);
  }

  function renderPronto(body) {
    var nom = { tiempos: 'Tiempos del proceso', zonas: 'Zonas', vendedores: 'Vendedores y clientes', detalle: 'Detalle de pedidos', parametros: 'Plazos y feriados' }[VIEW] || '';
    q('#tbTitle').textContent = nom; q('#tbSub').textContent = '';
    body.innerHTML = '<div class="ot-soon">' + IC.soon + '<h3>' + esc(nom) + '</h3><p>Esta pantalla se arma después de aprobar el Resumen, con el mismo estilo.</p></div>';
    if (GS) gsap.from(body.firstChild, { opacity: 0, y: 12, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  /* ════════════════════════════════════════════════════════════
     RESUMEN
     ════════════════════════════════════════════════════════════ */
  function semColor(p) { var meta = +CFG.meta_otif || 95; return p == null ? '#cbd5e1' : p >= meta ? '#16a34a' : p >= meta - 10 ? '#d97706' : '#dc2626'; }

  function spark(vals, labels, meta) {
    var W = 720, H = 92, n = vals.length, max = 100, min = Math.max(0, Math.min.apply(null, vals.concat([meta])) - 10);
    var X = function (i) { return n < 2 ? W / 2 : 10 + (i / (n - 1)) * (W - 20); };
    var Y = function (v) { return H - 10 - ((v - min) / (max - min || 1)) * (H - 24); };
    var pts = vals.map(function (v, i) { return [X(i), Y(v)]; });
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L ');
    var area = line + ' L ' + X(n - 1).toFixed(1) + ' ' + H + ' L ' + X(0).toFixed(1) + ' ' + H + ' Z';
    var avg = vals.reduce(function (a, v) { return a + v; }, 0) / (n || 1);
    var dots = pts.map(function (p, i) {
      var last = i === n - 1;
      return '<circle class="gspark__dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (last ? 5 : 3.4) + '" fill="' + (last ? '#fff' : 'rgba(255,255,255,.75)') + '"' + (last ? ' stroke="#9FD3FF" stroke-width="3"' : '') + '><title>' + esc(labels[i]) + ' · ' + pf(vals[i]) + '</title></circle>';
    }).join('');
    return '<svg class="gspark" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><linearGradient id="otSpG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3FF" stop-opacity=".42"/><stop offset="1" stop-color="#9FD3FF" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="gspark__area" d="' + area + '" fill="url(#otSpG)"/>' +
      '<line class="gspark__meta" x1="4" y1="' + Y(meta).toFixed(1) + '" x2="' + (W - 4) + '" y2="' + Y(meta).toFixed(1) + '"><title>Meta ' + pf(meta, 0) + '</title></line>' +
      '<line class="gspark__avg" x1="4" y1="' + Y(avg).toFixed(1) + '" x2="' + (W - 4) + '" y2="' + Y(avg).toFixed(1) + '"><title>Promedio · ' + pf(avg) + '</title></line>' +
      '<path class="gspark__line" d="' + line + '" fill="none" stroke="#CFE8FF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' + dots + '</svg>';
  }

  function renderResumen(body, entrada) {
    var evs = EVS.filter(enScope), g = CALC.resumen(evs), meta = +CFG.meta_otif || 95;
    var scopeTxt = { tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE];
    q('#tbTitle').textContent = 'Pedidos en tiempo y forma';
    q('#tbSub').textContent = 'OTIF por pedido · ' + mesLbl(CUR) + ' · ' + scopeTxt;

    // tendencia diaria (por día de carga del pedido)
    var porDia = new Map();
    evs.forEach(function (o) { if (o.estado !== 'evaluado') return; var d = diaPY(o.p.fecha_carga); if (!porDia.has(d)) porDia.set(d, [0, 0]); var x = porDia.get(d); x[0]++; if (o.otif) x[1]++; });
    var dias = Array.from(porDia.entries()).filter(function (e) { return e[1][0] >= 10; }).sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var dv = dias.map(function (e) { return e[1][1] / e[1][0] * 100; }), dl = dias.map(function (e) { return e[0].slice(8) + '/' + e[0].slice(5, 7); });
    var hayTrend = dv.length >= 2, ultimo = hayTrend ? dv[dv.length - 1] : null, prev = hayTrend ? dv[dv.length - 2] : null;
    var delta = hayTrend ? ultimo - prev : null, cls = delta == null ? 'flat' : delta > .5 ? 'up' : delta < -.5 ? 'down' : 'flat';
    var iMax = dv.indexOf(Math.max.apply(null, dv)), iMin = dv.indexOf(Math.min.apply(null, dv));
    var promDias = dv.length ? dv.reduce(function (a, v) { return a + v; }, 0) / dv.length : null;

    // pedidos con chofer pero sin registro (etapa 04)
    var sinCerrar = evs.filter(function (o) { return o.estado === 'sin_registro'; });
    var parciales = sinCerrar.filter(function (o) { return o.p.n_entregadas > 0; }).length;
    var conChofer = sinCerrar.filter(function (o) { return o.p.ult_etapa === 4; }).length;
    SIN_CERRAR = sinCerrar;
    var sinDesp = evs.filter(function (o) { return o.estado === 'sin_despacho'; });
    var montoSinDesp = sinDesp.reduce(function (a, o) { return a + (+o.p.monto_pedido || 0); }, 0);

    // motivos (líneas no entregadas) del scope
    var docs = new Map(); evs.forEach(function (o) { docs.set(o.p.doc_vtas, o); });
    var mot = new Map(), lineasFalt = 0;
    MOTIVOS.forEach(function (l) {
      if (!docs.has(l.doc_vtas)) return;
      lineasFalt++;
      var k = motivoTxt(l.motivo_rechazo);
      if (!mot.has(k)) mot.set(k, { n: 0, monto: 0, ped: new Set() });
      var m = mot.get(k); m.n++; m.monto += (+l.cant_pedida || 0) * (+l.precio || 0) * (1 - (+l.desc_pct || 0) / 100); m.ped.add(l.doc_vtas);
    });
    var motL = Array.from(mot.entries()).map(function (e) { return { k: e[0], n: e[1].n, monto: e[1].monto, ped: e[1].ped.size }; }).sort(function (a, b) { return b.n - a.n; });
    var motTop = sinDesp.length ? (function () { var c = new Map(); MOTIVOS.forEach(function (l) { var o = docs.get(l.doc_vtas); if (o && o.estado === 'sin_despacho') { var k = motivoTxt(l.motivo_rechazo); c.set(k, (c.get(k) || 0) + 1); } }); var b = null; c.forEach(function (v, k) { if (!b || v > b[1]) b = [k, v]; }); return b ? b[0] : '—'; })() : '—';

    // zonas y departamentos
    var zonas = CALC.agrupar(evs, function (p) { return p.zona; }).filter(function (z) { return z.evaluados; }).sort(function (a, b) { return a.clave < b.clave ? -1 : 1; });
    var deps = CALC.agrupar(evs, function (p) { return p.departamento; }).filter(function (d) { return d.evaluados >= 5; }).sort(function (a, b) { return b.evaluados - a.evaluados; }).slice(0, 10);

    // tramos
    var tm = g.tramosMed, tMax = null;
    TRAMOS.forEach(function (t) { var v = tm[t[0]]; if (v != null && (tMax == null || v > tm[tMax])) tMax = t[0]; });
    var tSum = TRAMOS.reduce(function (a, t) { return a + (tm[t[0]] || 0); }, 0) || 1;
    var horasJ = (CALC.jornada || 585) / 60;

    var C = 2 * Math.PI * 74, pOtif = g.pOtif || 0;
    var mkAng = (meta / 100) * 2 * Math.PI, mkX1 = 86 + 64 * Math.cos(mkAng), mkY1 = 86 + 64 * Math.sin(mkAng), mkX2 = 86 + 84 * Math.cos(mkAng), mkY2 = 86 + 84 * Math.sin(mkAng);

    body.innerHTML =
      '<div class="ot-top">' +
        '<div class="ot-blue" id="cardOtif">' +
          '<div class="ot-lbl">Cumplimiento OTIF · ' + esc(mesLbl(CUR)) + '<span class="meta">Meta ' + pf(meta, 0) + '</span></div>' +
          '<div class="ot-hero__body">' +
            '<div class="ot-gauge"><svg viewBox="0 0 172 172"><circle class="bg" cx="86" cy="86" r="74"/><circle class="fg" id="gFg" cx="86" cy="86" r="74" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/>' +
              '<line class="mk" x1="' + mkX1.toFixed(1) + '" y1="' + mkY1.toFixed(1) + '" x2="' + mkX2.toFixed(1) + '" y2="' + mkY2.toFixed(1) + '"><title>Meta ' + pf(meta, 0) + '</title></line></svg>' +
              '<div class="ot-gauge__c"><div class="ot-gauge__v" id="gPct">0%</div><div class="ot-gauge__l">En tiempo y forma</div></div></div>' +
            '<div class="ot-meters">' +
              '<div class="ot-meter"><div class="ot-meter__hd"><span>A tiempo</span><b id="mOt">0%</b></div><div class="ot-meter__bar"><span id="bOt"></span></div><div class="ot-meter__sub">' + nf(g.ot) + ' de ' + nf(g.evaluados) + ' pedidos llegaron dentro del plazo</div></div>' +
              '<div class="ot-meter"><div class="ot-meter__hd"><span>Completos</span><b id="mIn">0%</b></div><div class="ot-meter__bar"><span id="bIn"></span></div><div class="ot-meter__sub">' + nf(g.inf) + ' de ' + nf(g.evaluados) + ' pedidos se entregaron sin faltantes</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="ot-foot">' +
            '<div class="ot-st"><b id="sEv">0</b><span>Pedidos evaluados</span></div>' +
            '<div class="ot-st"><b>' + jd(g.cicloMed) + '</b><span>Ciclo mediano</span></div>' +
            '<div class="ot-st"><b>' + gs(g.monto) + '</b><span>Monto pedido</span></div>' +
            '<div class="ot-st"><b>' + nf(g.total) + '</b><span>Pedidos del mes</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ot-blue alt" id="cardTrend">' +
          '<div class="ot-lbl">Tendencia diaria · ' + esc(mesLbl(CUR)) + '</div>' +
          (hayTrend
            ? '<div class="ot-trend__big"><i class="' + cls + '">' + (cls === 'up' ? '▲' : cls === 'down' ? '▼' : '●') + '</i><span id="tUlt" data-v="' + ultimo + '">0%</span><small>último día (' + esc(dl[dl.length - 1]) + ') · ' + (delta >= 0 ? '+' : '') + nf(delta, 1) + ' pts vs ' + esc(dl[dl.length - 2]) + '</small></div>'
            : '<div class="ot-trend__big"><span style="font-size:20px;letter-spacing:-.2px">Se necesitan al menos 2 días con datos</span></div>') +
          '<div class="ot-trend__ch">' + (hayTrend ? spark(dv, dl, meta) + '<div class="gspark__x">' + dl.map(function (l, i) { return '<span' + (i === dl.length - 1 ? ' class="on"' : '') + '>' + l + '</span>'; }).join('') + '</div>' : '') + '</div>' +
          '<div class="ot-foot">' +
            '<div class="ot-st"><b>' + pf(promDias) + '</b><span>Promedio diario</span></div>' +
            '<div class="ot-st"><b>' + (hayTrend ? esc(dl[iMax]) + ' · ' + pf(dv[iMax]) : '—') + '</b><span>Mejor día</span></div>' +
            '<div class="ot-st"><b>' + (hayTrend ? esc(dl[iMin]) + ' · ' + pf(dv[iMin]) : '—') + '</b><span>Peor día</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ot-tiles">' +
        tile('#0B5F8D', 'A tiempo', '<span id="tOt">0%</span>', [[nf(g.ot), 'Pedidos a tiempo'], [nf(g.evaluados - g.ot), 'Fuera de plazo'], [nf(g.no_entregado), 'No entregados (06)']]) +
        tile('#16a34a', 'Completos', '<span id="tIn">0%</span>', [[nf(g.inf), 'Sin faltantes'], [nf(g.evaluados - g.inf), 'Con faltantes'], [nf(lineasFalt), 'Artículos sin entrega']]) +
        tile('#d97706', 'Entregas sin cerrar', '<span id="tSr">0</span><small>pedidos</small>', [[pf(g.total ? g.sin_registro / g.total * 100 : null), 'Del total'], [nf(conChofer), 'En chofer (04)'], [nf(parciales), 'Entrega parcial']], 'tileSinCerrar', 'Ver lista') +
        tile('#dc2626', 'Sin despachar', '<span id="tSd">0</span><small>pedidos</small>', [[pf(g.total ? g.sin_despacho / g.total * 100 : null), 'Del total'], [gs(montoSinDesp), 'Monto'], [esc(motTop), 'Motivo principal']]) +
      '</div>' +

      '<div class="ot-grid2">' +
        '<div class="ot-card" id="cardTramos"><div class="ot-card__h"><h3>¿Dónde se pierde el tiempo?</h3><small>mediana por tramo · jornadas hábiles</small></div>' +
          '<div class="ot-flow">' + TRAMOS.map(function (t) { var v = tm[t[0]] || 0, p = v / tSum * 100; return '<div class="ot-flow__seg" style="flex:' + Math.max(v, tSum * .015) + ' 1 0;background:' + (t[0] === tMax ? '#dc2626' : t[3]) + '" title="' + esc(t[1]) + ' · ' + jd(tm[t[0]]) + '">' + (p >= 9 ? Math.round(p) + '%' : '') + '</div>'; }).join('') + '</div>' +
          '<div class="ot-steps">' + TRAMOS.map(function (t) { var v = tm[t[0]]; return '<div class="ot-step' + (t[0] === tMax ? ' is-max' : '') + '"><i style="background:' + (t[0] === tMax ? '#dc2626' : t[3]) + '"></i><div class="ot-step__n">' + esc(t[1]) + '<small>' + esc(t[2]) + '</small></div><span class="ot-step__h">' + (v == null ? '' : '≈ ' + nf(v * horasJ, 1) + ' h') + '</span><span class="ot-step__v">' + jd(v) + '</span></div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="ot-card" id="cardZonas"><div class="ot-card__h"><h3>Cumplimiento por zona y departamento</h3><small>% OTIF · línea = meta</small></div>' +
          '<div class="ot-zchips">' + zonas.map(function (z) { return '<div class="ot-zchip"><span>' + esc(z.clave) + '</span><div><b>' + pf(z.pOtif) + '</b><small>' + nf(z.evaluados) + ' ped.</small></div></div>'; }).join('') + '</div>' +
          '<div class="ot-bars">' + deps.map(function (d) { return barRow(d.clave, d.evaluados + ' ped.', d.pOtif, semColor(d.pOtif), pf(d.pOtif), meta); }).join('') + '</div>' +
          '<div class="ot-legend"><span><i style="background:#16a34a"></i>En meta</span><span><i style="background:#d97706"></i>Hasta 10 pts abajo</span><span><i style="background:#dc2626"></i>Más de 10 pts abajo</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="ot-card" id="cardMotivos"><div class="ot-card__h"><h3>¿Por qué no se entregaron artículos?</h3><small>' + nf(lineasFalt) + ' artículos sin entrega · motivo de rechazo cargado en SAP</small></div>' +
        (motL.length ? '<div class="ot-bars">' + motL.slice(0, 10).map(function (m) { var mx = motL[0].n || 1; return barRow(m.k, m.ped + ' ped. · ' + gs(m.monto), m.n / mx * 100, '#0B5F8D', nf(m.n), null); }).join('') + '</div>' : '<div class="ot-soon" style="padding:24px">Sin artículos no entregados en este filtro.</div>') +
      '</div>';

    var ts = q('#tileSinCerrar');
    if (ts) { ts.addEventListener('click', abrirSinCerrar); ts.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirSinCerrar(); } }); }
    animarResumen(g, pOtif, C, hayTrend, entrada);
  }

  function tile(color, lbl, valHtml, foot, id, accion) {
    return '<div class="ot-tile' + (id ? ' is-click' : '') + '"' + (id ? ' id="' + id + '" role="button" tabindex="0"' : '') + ' style="--c:' + color + '"><div class="ot-tile__h"><i></i>' + esc(lbl) + (accion ? '<span class="ot-tile__go">' + esc(accion) + ' →</span>' : '') + '</div><div class="ot-tile__v">' + valHtml + '</div>' +
      '<div class="ot-tile__f">' + foot.map(function (f) { return '<div><b title="' + esc(String(f[0]).replace(/<[^>]+>/g, '')) + '">' + f[0] + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div></div>';
  }
  function barRow(name, sub, pct, color, valTxt, meta) {
    return '<div class="ot-bar"><div class="ot-bar__n" title="' + esc(name) + '">' + esc(name) + '<small>' + esc(sub) + '</small></div>' +
      '<div class="ot-bar__t"><span data-w="' + Math.max(0, Math.min(100, pct || 0)).toFixed(1) + '" style="background:' + color + '"></span>' + (meta != null ? '<em style="left:' + meta + '%"></em>' : '') + '</div>' +
      '<div class="ot-bar__v" style="color:' + color + '">' + valTxt + '</div></div>';
  }

  function animarResumen(g, pOtif, C, hayTrend, entrada) {
    var off = C * (1 - Math.min(pOtif, 100) / 100);
    var setW = function (sel, w) { var n = q(sel); if (n) n.style.width = w + '%'; };
    if (!GS) {
      q('#gFg').setAttribute('stroke-dashoffset', off);
      q('#gPct').textContent = pf(g.pOtif); q('#mOt').textContent = pf(g.pOt); q('#mIn').textContent = pf(g.pIn);
      [['#sEv', nf(g.evaluados)], ['#tOt', pf(g.pOt)], ['#tIn', pf(g.pIn)], ['#tSr', nf(g.sin_registro)], ['#tSd', nf(g.sin_despacho)]].forEach(function (x) { var n = q(x[0]); if (n) n.textContent = x[1]; });
      var u = q('#tUlt'); if (u) u.textContent = pf(parseFloat(u.dataset.v));
      setW('#bOt', g.pOt || 0); setW('#bIn', g.pIn || 0);
      qa('.ot-bar__t span').forEach(function (s) { s.style.width = s.dataset.w + '%'; });
      return;
    }
    var tl = gsap.timeline();
    // entrada de tarjetas (escalonada)
    tl.from('#otBody .ot-blue, #otBody .ot-tile, #otBody .ot-card', { opacity: 0, y: entrada ? 18 : 10, duration: .5, stagger: .06, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);
    // anillo OTIF
    tl.fromTo('#gFg', { attr: { 'stroke-dashoffset': C } }, { attr: { 'stroke-dashoffset': off }, duration: 1.3, ease: 'power2.out' }, .15);
    tl.from('.ot-gauge', { scale: .88, duration: .6, ease: 'back.out(1.6)', clearProps: 'transform' }, .1);
    animCount(q('#gPct'), g.pOtif, function (v) { return pf(v); }, 1.3);
    animCount(q('#mOt'), g.pOt, function (v) { return pf(v); }, 1.1);
    animCount(q('#mIn'), g.pIn, function (v) { return pf(v); }, 1.1);
    animCount(q('#sEv'), g.evaluados, function (v) { return nf(v); }, 1);
    animCount(q('#tOt'), g.pOt, function (v) { return pf(v); }, 1.1);
    animCount(q('#tIn'), g.pIn, function (v) { return pf(v); }, 1.1);
    animCount(q('#tSr'), g.sin_registro, function (v) { return nf(v); }, 1);
    animCount(q('#tSd'), g.sin_despacho, function (v) { return nf(v); }, 1);
    tl.fromTo('#bOt', { width: '0%' }, { width: (g.pOt || 0) + '%', duration: 1.1, ease: 'power2.out' }, .25);
    tl.fromTo('#bIn', { width: '0%' }, { width: (g.pIn || 0) + '%', duration: 1.1, ease: 'power2.out' }, .32);
    // tendencia: dibujar línea + puntos
    if (hayTrend) {
      var line = q('#cardTrend .gspark__line');
      if (line && line.getTotalLength) {
        var L = line.getTotalLength();
        gsap.set(line, { strokeDasharray: L, strokeDashoffset: L });
        tl.to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', onComplete: function () { line.style.strokeDasharray = ''; line.style.strokeDashoffset = ''; } }, .3);
      }
      tl.from('#cardTrend .gspark__area', { opacity: 0, duration: .8, ease: 'power1.out' }, .6);
      tl.from('#cardTrend .gspark__dot', { scale: 0, transformOrigin: '50% 50%', duration: .4, stagger: .07, ease: 'back.out(2.5)' }, .55);
      var ult = q('#tUlt');
      if (ult) animCount(ult, parseFloat(ult.dataset.v), function (x) { return pf(x); }, 1.2);
    }
    // flujo del proceso + barras
    tl.from('#cardTramos .ot-flow__seg', { scaleX: 0, transformOrigin: '0% 50%', duration: .55, stagger: .08, ease: 'power3.out', clearProps: 'transform' }, .35);
    tl.from('#cardTramos .ot-step', { opacity: 0, x: -10, duration: .35, stagger: .06, ease: 'power2.out', clearProps: 'transform,opacity' }, .45);
    qa('.ot-bar__t span').forEach(function (s, i) { gsap.fromTo(s, { width: '0%' }, { width: s.dataset.w + '%', duration: .9, delay: .4 + i * .035, ease: 'power3.out' }); });
    tl.from('#cardZonas .ot-zchip', { opacity: 0, y: 8, scale: .96, duration: .4, stagger: .08, ease: 'back.out(1.8)', clearProps: 'transform,opacity' }, .4);
  }

  /* ════════════════════════════════════════════════════════════
     ENTREGAS SIN CERRAR — pedidos con alguna entrega que no llegó a
     la etapa 5 (culminado y entregado). Lista para que logística
     las cierre en SAP. Se abre desde la tarjeta naranja.
     ════════════════════════════════════════════════════════════ */
  function fechaHora(iso) {
    if (!iso) return '—';
    var t = CALC.aMin(iso), d = new Date(t * 60000);
    return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
  }
  function diasDesde(iso) { if (!iso) return null; return Math.floor((Date.now() - Date.parse(iso)) / 86400000); }
  function etapaChip(e) {
    var n = e.ult_etapa, t = e.etapa_desc || 'Sin etapa';
    var cls = n === 4 ? 'c04' : n === 6 ? 'c06' : 'cxx';
    return '<span class="ot-chip ' + cls + '">' + esc(t.replace(/^0?(\d)\s*-\s*/, '0$1 · ').replace('REGISTRAR ENTRE', 'REGISTRAR ENTREGA').replace('NO ENTREGADO/PE', 'NO ENTREGADO')) + '</span>';
  }
  async function abrirSinCerrar() {
    var peds = SIN_CERRAR.slice(), byDoc = new Map();
    peds.forEach(function (o) { byDoc.set(o.p.doc_vtas, o.p); });
    var bd = el('<div class="modal-bd open ot-modal"><div class="modal-box">' +
      '<div class="modal-hd"><div><h3>Entregas sin cerrar</h3><div class="ot-modal__sub">' + nf(peds.length) + ' pedidos de ' + esc(mesLbl(CUR)) + ' con entregas que no llegaron a la etapa 5 (culminado y entregado)</div></div>' +
        '<button class="modal-x" type="button" aria-label="Cerrar"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="ot-modal__bar"><div class="ot-search"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" placeholder="Buscar pedido, entrega, cliente o chofer…" /></div>' +
        '<span class="ot-count"></span><button class="btn btn--sm" type="button" data-x>' + IC.upload.replace('M17 8l-5-5-5 5M12 3v12', 'M7 10l5 5 5-5M12 15V3') + ' Exportar Excel</button></div>' +
      '<div class="ot-modal__body"><div class="ot-loading" style="padding:50px 20px"><div class="ot-loading__ring"></div><b>Buscando entregas…</b></div></div>' +
      '</div></div>');
    document.body.appendChild(bd);
    var box = q('.modal-box', bd), body = q('.ot-modal__body', bd), inp = q('input', bd), cnt = q('.ot-count', bd), filas = [];
    function cerrar() {
      if (!GS) { bd.remove(); return; }
      gsap.to(box, { opacity: 0, y: 14, scale: .97, duration: .22, ease: 'power2.in' });
      gsap.to(bd, { opacity: 0, duration: .26, delay: .04, onComplete: function () { bd.remove(); } });
    }
    q('.modal-x', bd).addEventListener('click', cerrar);
    bd.addEventListener('click', function (e) { if (e.target === bd) cerrar(); });
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc_); } });
    if (GS) { gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: .25 }); gsap.fromTo(box, { opacity: 0, y: 22, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'back.out(1.5)', clearProps: 'transform,opacity' }); }

    try {
      var docs = Array.from(byDoc.keys()), ents = [];
      for (var i = 0; i < docs.length; i += 150) {
        var r = await DB.from('otif_entregas').select('entrega,doc_vtas,almacen,ult_etapa,etapa_desc,ts_transporte,transporte,usuario_transp,nro_manifiesto,ts_entrega').in('doc_vtas', docs.slice(i, i + 150));
        if (r.error) throw r.error;
        ents = ents.concat(r.data);
      }
      filas = ents.filter(function (e) { return e.ult_etapa !== 5; }).map(function (e) {
        var p = byDoc.get(e.doc_vtas) || {};
        return { e: e, p: p, parcial: p.n_entregadas > 0 };
      }).sort(function (a, b) { return (a.e.ts_transporte || '9') < (b.e.ts_transporte || '9') ? -1 : 1; });
    } catch (err) { console.error(err); body.innerHTML = '<div class="ot-soon" style="padding:40px">No se pudieron traer las entregas.</div>'; return; }

    function pintar(f) {
      var t = (f || '').toLowerCase().trim();
      var vis = !t ? filas : filas.filter(function (x) { return [x.e.entrega, x.e.doc_vtas, x.p.cliente_nombre, x.e.usuario_transp, x.e.transporte].join(' ').toLowerCase().indexOf(t) >= 0; });
      cnt.textContent = nf(vis.length) + ' entregas';
      if (!vis.length) { body.innerHTML = '<div class="ot-soon" style="padding:40px">Sin resultados.</div>'; return; }
      body.innerHTML = '<table class="ot-tbl"><thead><tr><th>Entrega</th><th>Pedido</th><th>Cliente</th><th>Alm.</th><th>Etapa</th><th>Chofer</th><th>Transporte</th><th>Salió</th><th class="r">Hace</th></tr></thead><tbody>' +
        vis.slice(0, 400).map(function (x) {
          var d = diasDesde(x.e.ts_transporte);
          return '<tr><td class="b">' + esc(x.e.entrega) + '</td><td>' + esc(x.e.doc_vtas) + (x.parcial ? ' <span class="ot-chip cpar" title="El pedido tiene otras entregas ya registradas">parcial</span>' : '') + '</td>' +
            '<td class="cli" title="' + esc(x.p.cliente_nombre) + '">' + esc(x.p.cliente_nombre || x.p.cliente_cod || '—') + '</td><td>' + esc(x.e.almacen || '—') + '</td><td>' + etapaChip(x.e) + '</td>' +
            '<td>' + esc(x.e.usuario_transp || '—') + '</td><td class="tr" title="' + esc(x.e.transporte || '') + '">' + esc(x.e.transporte || '—') + '</td><td>' + fechaHora(x.e.ts_transporte) + '</td><td class="r">' + (d == null ? '—' : nf(d) + ' d') + '</td></tr>';
        }).join('') + '</tbody></table>' + (vis.length > 400 ? '<div class="ot-more">Se muestran 400 de ' + nf(vis.length) + '. Usá el buscador o exportá a Excel para ver todo.</div>' : '');
      if (GS) gsap.from(qa('tbody tr', body).slice(0, 22), { opacity: 0, x: -8, duration: .28, stagger: .02, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    pintar('');
    var tmr; inp.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { pintar(inp.value); }, 160); });
    setTimeout(function () { inp.focus(); }, 350);

    q('[data-x]', bd).addEventListener('click', async function () {
      try {
        var X = await cargarXLSX();
        var aoa = [['Entrega', 'Pedido', 'Cliente', 'Almacén', 'Etapa', 'Chofer', 'Transporte', 'Manifiesto', 'Salió (fecha y hora)', 'Días desde que salió', 'Pedido con entrega parcial']];
        filas.forEach(function (x) { aoa.push([x.e.entrega, x.e.doc_vtas, x.p.cliente_nombre || x.p.cliente_cod || '', x.e.almacen || '', x.e.etapa_desc || '', x.e.usuario_transp || '', x.e.transporte || '', x.e.nro_manifiesto || '', fechaHora(x.e.ts_transporte), diasDesde(x.e.ts_transporte), x.parcial ? 'Sí' : 'No']); });
        var wb = X.utils.book_new(), ws = X.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [12, 12, 34, 8, 24, 14, 28, 14, 18, 10, 12].map(function (w) { return { wch: w }; });
        X.utils.book_append_sheet(wb, ws, 'Sin cerrar');
        X.writeFile(wb, 'entregas_sin_cerrar_' + CUR + '.xlsx');
        toast('Excel descargado');
      } catch (err) { console.error(err); toast('No se pudo exportar', true); }
    });
  }

  /* ── Navegación ── */
  function setNav(v) {
    qa('[data-nav]').forEach(function (b) {
      var on = b.dataset.nav === v, was = b.classList.contains('is-active');
      b.classList.toggle('is-active', on);
      if (on && !was && GS) { var ic = b.querySelector('.nav-btn__ico'); if (ic) gsap.fromTo(ic, { scale: .7 }, { scale: 1, duration: .4, ease: 'back.out(2.2)', clearProps: 'transform' }); }
    });
  }
  function ir(v) { VIEW = v; setNav(v); if (!q('#otBody')) { renderShell(); return; } renderPagina(true); }

  async function irMes(ym, dir) {
    CUR = ym;
    var cur = q('#mnCur'); if (cur) { cur.textContent = mesLbl(CUR); if (GS) gsap.fromTo(cur, { y: dir > 0 ? 8 : -8, opacity: .2 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out', clearProps: 'transform,opacity' }); }
    var body = q('#otBody'); if (body) body.classList.add('ot-busy');
    try { await cargarMes(); renderShell(); }
    catch (e) { console.error(e); toast('No se pudo cargar el mes', true); if (body) body.classList.remove('ot-busy'); }
  }

  async function refrescar() {
    var btn = q('#btnRefresh'), icon = btn && btn.querySelector('svg'), spin = null;
    if (btn) btn.classList.add('is-busy');
    if (GS && icon) { gsap.set(icon, { transformOrigin: '50% 50%' }); spin = gsap.to(icon, { rotation: '+=360', duration: .8, ease: 'none', repeat: -1 }); }
    try {
      await Promise.all([cargarBase().then(cargarMes), new Promise(function (r) { setTimeout(r, 600); })]);
      if (spin) spin.kill(); renderShell(); toast('Datos actualizados');
    } catch (e) { console.error(e); if (spin) spin.kill(); if (btn) btn.classList.remove('is-busy'); toast('No se pudo refrescar', true); }
  }

  /* ════════════════════════════════════════════════════════════
     ACTUALIZAR BASE (Excel de SAP)
     Pantalla de carga minimalista azul: anillo fino con brillo,
     % continuo (GSAP persigue el objetivo), pasos que se tildan,
     cierre con check + resumen. El Excel se lee en un Web Worker
     para que la animación no se trabe.
     ════════════════════════════════════════════════════════════ */
  var SVG_OK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  var ICO_XLS = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13l4 5M12 13l-4 5"/></svg>';
  var PASOS = ['Leyendo el Excel', 'Procesando pedidos', 'Guardando en la nube', 'Actualizando el tablero'];

  function pantallaCarga(nombreArchivo) {
    var R = 70, C = 2 * Math.PI * R;
    var ov = el('<div class="ld-ov"><div class="ld-card">' +
      '<div class="ld-file">' + ICO_XLS + '<span>' + esc(nombreArchivo) + '</span></div>' +
      '<div class="ld-ring"><svg viewBox="0 0 156 156"><circle class="halo" cx="78" cy="78" r="76"/><circle class="bg" cx="78" cy="78" r="' + R + '"/><circle class="fg" cx="78" cy="78" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg>' +
        '<div class="ld-pct"><span>0</span><small>%</small></div>' +
        '<svg class="ld-ok" viewBox="0 0 156 156"><circle cx="78" cy="78" r="58"/><path d="M52 80 l18 18 l36 -40"/></svg></div>' +
      '<div class="ld-title">Actualizando la base</div>' +
      '<div class="ld-msg">Preparando…</div>' +
      '<div class="ld-steps">' + PASOS.map(function (p) { return '<div class="ld-step"><span class="ld-step__i">' + SVG_OK + '</span><span class="ld-step__t">' + p + '</span><span class="ld-step__n"></span></div>'; }).join('') + '</div>' +
      '</div></div>');
    document.body.appendChild(ov);
    var card = q('.ld-card', ov), fg = q('.fg', ov), num = q('.ld-pct span', ov), msgEl = q('.ld-msg', ov), steps = qa('.ld-step', ov);
    var st = { v: 0 }, objetivo = 0, tw = null;

    function dibujar() { fg.setAttribute('stroke-dashoffset', (C * (1 - st.v / 100)).toFixed(2)); num.textContent = Math.round(st.v); }
    // Avanza suave hacia el objetivo (nunca retrocede)
    function ir(p, dur, ease) {
      objetivo = Math.max(objetivo, Math.min(100, p));
      if (!GS) { st.v = objetivo; dibujar(); return; }
      if (tw) tw.kill();
      tw = gsap.to(st, { v: objetivo, duration: dur || .7, ease: ease || 'power2.out', onUpdate: dibujar });
    }
    function mensaje(t) {
      if (msgEl.textContent === t) return;
      if (!GS) { msgEl.textContent = t; return; }
      gsap.to(msgEl, { opacity: 0, y: -4, duration: .14, ease: 'power1.in', onComplete: function () { msgEl.textContent = t; gsap.fromTo(msgEl, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: .24, ease: 'power2.out' }); } });
    }
    function paso(i, extra) {
      steps.forEach(function (s, k) {
        var was = s.classList.contains('is-ok');
        s.classList.toggle('is-ok', k < i);
        s.classList.toggle('is-on', k === i);
        if (k < i && !was && GS) {
          var ic = q('.ld-step__i', s), pth = q('path', s), L = 24;
          gsap.fromTo(ic, { scale: .6 }, { scale: 1, duration: .45, ease: 'back.out(2.6)', clearProps: 'transform' });
          gsap.fromTo(pth, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: .35, delay: .08, ease: 'power2.out' });
        }
      });
      if (extra != null && steps[i]) q('.ld-step__n', steps[i]).textContent = extra;
    }

    // Entrada
    if (GS) {
      gsap.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' });
      gsap.fromTo(card, { opacity: 0, y: 26, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
      gsap.from(steps, { opacity: 0, x: -10, duration: .35, stagger: .06, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from(q('.ld-ring', ov), { scale: .85, opacity: 0, duration: .6, delay: .08, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
    }

    function cerrar(cb) {
      if (!GS) { ov.remove(); if (cb) cb(); return; }
      gsap.to(card, { opacity: 0, y: 14, scale: .96, duration: .32, ease: 'power2.in' });
      gsap.to(ov, { opacity: 0, duration: .36, delay: .06, ease: 'power1.in', onComplete: function () { ov.remove(); if (cb) cb(); } });
    }
    function botones(html, onClick) {
      var b = el(html); card.appendChild(b);
      if (GS) gsap.from(b, { opacity: 0, y: 8, duration: .35, delay: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
      b.addEventListener('click', onClick);
    }
    function sello(fail) {
      var okSvg = q('.ld-ok', ov), pth = q('.ld-ok path', ov);
      if (fail) { card.classList.add('is-fail'); pth.setAttribute('d', 'M58 58 L98 98 M98 58 L58 98'); }
      if (!GS) { okSvg.style.opacity = 1; q('.ld-pct', ov).style.opacity = 0; return; }
      var L = pth.getTotalLength ? pth.getTotalLength() : 90;
      gsap.to(q('.ld-pct', ov), { opacity: 0, scale: .7, duration: .25, ease: 'power2.in' });
      gsap.fromTo(okSvg, { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .55, ease: 'back.out(1.9)', delay: .12 });
      gsap.fromTo(pth, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: .45, delay: .4, ease: 'power2.out' });
      gsap.fromTo(card, { scale: 1 }, { scale: 1.025, duration: .18, yoyo: true, repeat: 1, delay: .5, ease: 'power1.inOut', clearProps: 'transform' });
    }

    return {
      ir: ir, mensaje: mensaje, paso: paso,
      // espera "viva": el anillo sigue avanzando despacio mientras se trabaja
      gotear: function (hasta, seg) { ir(hasta, seg, 'power1.out'); },
      ok: function (filas, alCerrar) {
        paso(PASOS.length);
        ir(100, .5, 'power2.inOut');
        setTimeout(function () {
          sello(false);
          q('.ld-title', ov).textContent = 'Base actualizada';
          mensaje('Ya está disponible para todo el equipo');
          var sum = el('<div class="ld-sum">' + filas.map(function (r) { return '<div class="row"><span>' + esc(r[0]) + '</span><b' + (r[2] ? ' class="new"' : '') + '>' + esc(r[1]) + '</b></div>'; }).join('') + '</div>');
          var stepsBox = q('.ld-steps', ov);
          if (GS) {
            gsap.to(stepsBox, { opacity: 0, height: 0, marginTop: 0, duration: .35, ease: 'power2.inOut', onComplete: function () { stepsBox.remove(); } });
            card.appendChild(sum);
            gsap.from(qa('.row', sum), { opacity: 0, y: 8, duration: .32, stagger: .07, delay: .3, ease: 'power2.out', clearProps: 'transform,opacity' });
            gsap.from(sum, { opacity: 0, duration: .3, delay: .25 });
          } else { stepsBox.remove(); card.appendChild(sum); }
          botones('<button class="ld-btn" type="button">Ver el tablero actualizado</button>', function () { cerrar(alCerrar); });
        }, 560);
      },
      fail: function (texto) {
        if (tw) tw.kill();
        steps.forEach(function (s) { s.classList.remove('is-on'); });
        sello(true);
        q('.ld-title', ov).textContent = 'No se pudo cargar';
        mensaje(texto);
        botones('<button class="ld-btn ld-btn--ghost" type="button">Cerrar</button>', function () { cerrar(); });
      }
    };
  }

  function adaptador() {
    return {
      insertImport: async function (row) { var r = await DB.from('otif_importaciones').insert(row).select('id').single(); if (r.error) throw r.error; return r.data; },
      existentes: async function (t, col, keys) { var r = await DB.from(t).select(col).in(col, keys); if (r.error) throw r.error; return r.data.map(function (x) { return x[col]; }); },
      upsert: async function (t, rows, oc) { var r = await DB.from(t).upsert(rows, { onConflict: oc, returning: 'minimal' }); if (r.error) throw r.error; }
    };
  }

  // Lee y procesa el Excel en un Web Worker (fluido). Si el navegador no
  // permite workers, cae a hacerlo en la página.
  function procesarEnWorker(buf, alFase) {
    return new Promise(function (resolve, reject) {
      var w;
      try { w = new Worker('otif-worker.js'); } catch (e) { reject(e); return; }
      w.onmessage = function (e) {
        var m = e.data;
        if (m.t === 'fase') alFase(m.fase);
        else if (m.t === 'fin') { w.terminate(); resolve(m.res); }
        else if (m.t === 'error') { w.terminate(); reject(new Error(m.msg)); }
      };
      w.onerror = function (e) { w.terminate(); reject(new Error(e.message || 'Error leyendo el Excel')); };
      w.postMessage({ buf: buf }, [buf]);
    });
  }
  function cargarXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = function () { res(window.XLSX); }; s.onerror = function () { rej(new Error('No se pudo cargar el lector de Excel')); };
      document.head.appendChild(s);
    });
  }

  async function subirExcel(file) {
    var ui = pantallaCarga(file.name);
    var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    try {
      await espera(420);                                   // que termine la entrada
      ui.paso(0); ui.mensaje('Abriendo ' + (file.size > 1048576 ? nf(file.size / 1048576, 1) + ' MB' : nf(file.size / 1024) + ' KB') + '…');
      var buf = await file.arrayBuffer();
      ui.ir(4);
      var res;
      try {
        res = await procesarEnWorker(buf.slice(0), function (fase) {
          if (fase === 'leer') { ui.mensaje('Leyendo filas del Excel…'); ui.gotear(16, 9); }
          if (fase === 'procesar') { ui.paso(1); ui.mensaje('Agrupando pedidos, entregas y artículos…'); ui.gotear(24, 4); }
        });
      } catch (eW) {
        console.warn('[OTIF] Worker no disponible, proceso en la página:', eW);
        ui.mensaje('Leyendo filas del Excel…');
        var X = await cargarXLSX(); await espera(40);
        var wb = X.read(buf, { type: 'array' });
        ui.paso(1); await espera(40);
        res = OtifImport.parsear(X, wb);
      }
      if (!res.ok) { ui.fail(res.error); return; }
      ui.paso(1, nf(res.meta.pedidos) + ' pedidos');
      ui.ir(26);
      await espera(250);
      ui.paso(2);
      var out = await OtifImport.subir(adaptador(), res, { archivo: file.name, usuario: userName() }, function (p, t) {
        ui.ir(26 + p * .66, .6);
        if (t) ui.mensaje(t);
      });
      ui.paso(3); ui.mensaje('Recalculando indicadores…');
      CUR = res.meta.carga_hasta.slice(0, 7);
      await cargarBase(); CUR = res.meta.carga_hasta.slice(0, 7);
      ui.ir(96, 1.2);
      await cargarMes();
      var f = function (d) { return d ? d.slice(8) + '/' + d.slice(5, 7) : '—'; };
      ui.ok([
        ['Pedidos en el Excel', nf(res.meta.pedidos)],
        ['Pedidos nuevos', nf(out.nuevos), true],
        ['Pedidos actualizados', nf(out.actualizados)],
        ['Período (fecha de carga)', f(res.meta.carga_desde) + ' → ' + f(res.meta.carga_hasta) + '/' + res.meta.carga_hasta.slice(0, 4)]
      ], function () { renderShell(); });
    } catch (e) {
      console.error(e);
      ui.fail('Error al guardar: ' + (e && e.message ? e.message : e) + '. Probá de nuevo: lo que ya se guardó no se duplica.');
    }
  }

  /* ── Init ── */
  window.__initOtif = async function () {
    qa('[data-nav]').forEach(function (b) { b.addEventListener('click', function () { ir(b.dataset.nav); }); });
    q('#fileBase').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) subirExcel(f); });
    if (!DB) { q('#stage').innerHTML = '<div class="empty">' + IC.empty + '<h3>Sin conexión</h3><p>No se pudo conectar con la base de datos.</p></div>'; return; }
    q('#stage').innerHTML = '<div class="ot-loading"><div class="ot-loading__ring"></div><b>Cargando pedidos</b><span>Calculando el cumplimiento del mes…</span></div>';
    if (GS) gsap.from('#stage .ot-loading', { opacity: 0, y: 10, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
    try { await cargarBase(); await cargarMes(); renderShell(); }
    catch (e) { console.error(e); q('#stage').innerHTML = '<div class="empty">' + IC.empty + '<h3>No se pudieron cargar los datos</h3><p>' + esc(e && e.message ? e.message : e) + '</p></div>'; }
  };
})();
