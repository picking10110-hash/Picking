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
  var gs = function (n) { return 'Gs. ' + nf(Math.round(n || 0)); };   // montos completos, sin abreviar
  // Tiempo en HORARIO LABORAL, en palabras: 1 día = 1 jornada (L–V 07:15–17:00, sáb 07:15–11:30).
  // 0,03 → '18 min' · 0,43 → '4 h 12 min' · 2,38 → '2 días 4 h'
  function tiempo(j, corto) {
    if (j == null || isNaN(j)) return '—';
    var J = (CALC && CALC.jornada) || 585, m = Math.round(Math.abs(j) * J), sg = j < 0 ? '-' : '';
    if (m < 1) return corto ? '0 min' : 'menos de 1 min';
    if (m < 60) return sg + m + ' min';
    if (m < J) { var h = Math.floor(m / 60), mm = m % 60; return sg + h + ' h' + (mm ? ' ' + mm + ' min' : ''); }
    var d = Math.floor(m / J), r = Math.round((m - d * J) / 60);
    if (r * 60 >= J) { d++; r = 0; }
    return sg + d + (corto ? ' d' : (d === 1 ? ' día' : ' días')) + (r ? ' ' + r + ' h' : '');
  }
  function horarioTxt() {
    var d = (CFG && CFG.calendario && CFG.calendario.dias) || [], hm = function (m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
    var lv = d[1], sa = d[6];
    return (lv ? 'L–V ' + hm(lv[0]) + '–' + hm(lv[1]) : '') + (sa ? ', sáb ' + hm(sa[0]) + '–' + hm(sa[1]) : '');
  }
  function plazo(v) { return v == null ? '—' : nf(v, v % 1 ? 1 : 0) + (v === 1 ? ' día' : ' días'); }
  var jd = function (n) { return tiempo(n); };
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

  /* ── Íconos de etapas, motivos y zonas ── */
  var SV = function (p) { return '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
  var STG_ICO = {
    lib: SV('<rect x="5" y="3.5" width="14" height="18" rx="2"/><path d="M9 3.5h6v3H9zM9 11h6M9 15h4"/>'),
    pre: SV('<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"/>'),
    fac: SV('<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    tra: SV('<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    rep: SV('<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M9.5 15l2 2 3.5-4"/>')
  };
  var ZONA_ICO = {
    Capital: SV('<path d="M3 21h18M5 21V8l5-3v16M10 21V3l9 4v14"/><path d="M13 9h3M13 13h3M13 17h3"/>'),
    Interior: SV('<path d="M4 20L9 4M20 20L15 4M12 6v2M12 11v2M12 16v2"/>')
  };
  function motivoIco(m) {
    var t = String(m || '').toLowerCase();
    if (/cuenta/.test(t)) return SV('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>');
    if (/stock/.test(t)) return SV('<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M9 10l6 6M15 10l-6 6"/>');
    if (/retirad/.test(t)) return SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>');
    if (/facturad/.test(t)) return SV('<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 9h6M9 13h6"/>');
    if (/desiste/.test(t)) return SV('<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16.5 9.5l4 4M20.5 9.5l-4 4"/>');
    if (/mal cargado|error/.test(t)) return SV('<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>');
    if (/borrar/.test(t)) return SV('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>');
    if (/duplicad/.test(t)) return SV('<rect x="8" y="8" width="12.5" height="12.5" rx="2"/><path d="M15.5 8V5a1.5 1.5 0 00-1.5-1.5H5A1.5 1.5 0 003.5 5v9A1.5 1.5 0 005 15.5h3"/>');
    return SV('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>');
  }
  // Estado respecto de la meta: en meta / cerca (hasta 10 pts abajo) / lejos
  function estadoMeta(p, meta) {
    if (p == null || isNaN(p)) return { c: 'na', t: 'Sin datos' };
    if (p >= meta) return { c: 'ok', t: 'Cumple la meta' };
    if (p >= meta - 10) return { c: 'warn', t: 'Cerca de la meta' };
    return { c: 'bad', t: 'Por debajo de la meta' };
  }
  function chipEstado(p, meta) { var e = estadoMeta(p, meta); return '<span class="st-meta ' + e.c + '"><i></i>' + e.t + ' <small>' + pf(meta, 0) + '</small></span>'; }
  var IC_META = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  function chipFaltan(f, meta) { return f === 0 ? '<span class="meta ok">' + IC_META + 'Meta alcanzada</span>' : '<span class="meta gap">' + IC_META + '<b>' + nf(f) + '</b> pedidos para alcanzar el ' + pf(meta, 0) + '</span>'; }

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
    var im = await DB.from('otif_importaciones').select('cargado_en,cargado_por,carga_desde,carga_hasta,archivo,pedidos,pedidos_nuevos,filas').order('cargado_en', { ascending: false });
    if (im.error) throw im.error;
    IMPORTS = im.data || [];
    TCACHE = {};   // datos nuevos: la tendencia vuelve a pedir los meses
    var set = new Set();
    IMPORTS.forEach(function (i) { if (i.carga_desde && i.carga_hasta) mesesEntre(i.carga_desde, i.carga_hasta).forEach(function (m) { set.add(m); }); });
    MONTHS = Array.from(set).sort();
    if (!CUR || MONTHS.indexOf(CUR) < 0) CUR = MONTHS[MONTHS.length - 1] || null;
  }
  var COLS = 'doc_vtas,fecha_carga,clase_doc,cond_exp,region_cod,region_nombre,departamento,zona,cliente_cod,cliente_nombre,vendedor_cod,vendedor_nombre,n_lineas,n_completas,n_sin_entrega,monto_pedido,n_entregas,n_entregadas,n_no_entregado,almacen,ts_factura,ts_creacion,ts_control,ts_transporte,ts_entrega,ult_etapa';
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

  /* ── Toolbar ──
     [título]          [Total · Ferretería · Hierros]          [mes ▾] [última actualización] [↻]  */
  function mesLbl(ym) { return ym ? MESES[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) : '—'; }
  var SCOPES = [['tot', 'Total', 'grid', '#0B4F8A'], ['fer', 'Ferretería', 'deposito', '#0E7490'], ['hie', 'Hierros', 'fabrica', '#475569']];
  var IC_CAL = '<svg fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/></svg>';
  var IC_CHEV = '<svg fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  function toolbarHtml() {
    var last = IMPORTS[0], chip = '';
    if (last && last.cargado_en) {
      var d = new Date(last.cargado_en);
      chip = '<span class="upd-chip" title="Último Excel cargado' + (last.cargado_por ? ' por ' + esc(last.cargado_por) : '') + '">' + IC.clock + '<span>Última actualización</span> <b>' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</b></span>';
    }
    return '<div class="tb3">' +
      '<div class="tbd-title"><h2 id="tbTitle">Pedidos en tiempo y forma</h2><span class="sub" id="tbSub"></span></div>' +
      '<div class="tb3__mid" id="scopeSlot"><div class="seg3" id="scopeSeg" role="tablist" aria-label="Almacén"><span class="seg3__pill"></span>' +
        SCOPES.map(function (s) { return '<button type="button" class="seg3__btn' + (SCOPE === s[0] ? ' on' : '') + '" data-s="' + s[0] + '" style="--c:' + s[3] + '">' + IC[s[2]] + '<span>' + s[1] + '</span></button>'; }).join('') +
      '</div></div>' +
      '<div class="tb3__right">' +
        '<div class="mpick" id="mPick"><button type="button" class="mpick__btn" id="mPickBtn" aria-haspopup="true" aria-expanded="false">' + IC_CAL + '<span id="mnCur">' + esc(mesLbl(CUR)) + '</span>' + IC_CHEV + '</button></div>' +
        chip +
        '<button class="refresh-btn" id="btnRefresh" type="button" title="Refrescar datos">' + IC.refresh + '</button>' +
      '</div></div>';
  }
  function moverPillScope(animar) {
    var seg = q('#scopeSeg'); if (!seg) return;
    var b = q('[data-s="' + SCOPE + '"]', seg), pill = q('.seg3__pill', seg), col = (SCOPES.filter(function (s) { return s[0] === SCOPE; })[0] || SCOPES[0])[3];
    qa('.seg3__btn', seg).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    var to = { x: b.offsetLeft - 4, width: b.offsetWidth, backgroundColor: col };
    if (GS && animar) gsap.to(pill, { x: to.x, width: to.width, backgroundColor: col, duration: .45, ease: 'back.out(1.5)' });
    else { pill.style.transform = 'translateX(' + to.x + 'px)'; pill.style.width = to.width + 'px'; pill.style.backgroundColor = col; }
  }
  function wireToolbar() {
    q('#btnRefresh').addEventListener('click', refrescar);
    q('#mPickBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleMeses(); });
    qa('#scopeSeg .seg3__btn').forEach(function (bt) {
      bt.addEventListener('click', function () {
        if (SCOPE === bt.dataset.s) return;
        SCOPE = bt.dataset.s;
        moverPillScope(true);
        if (GS) { var ic = bt.querySelector('svg'); if (ic) gsap.fromTo(ic, { rotate: -18, scale: .7 }, { rotate: 0, scale: 1, duration: .5, ease: 'back.out(2.6)', clearProps: 'transform' }); }
        renderPagina(false);
      });
    });
    requestAnimationFrame(function () { moverPillScope(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moverPillScope(false); });
  }

  /* ── Selector de mes: grilla con los 12 meses del año ──
     Los meses con datos se pueden elegir; el resto queda apagado. */
  var MP_ANIO = null;
  function cerrarMeses() {
    var pop = q('#mPick .mpick__pop'); if (!pop) return;
    q('#mPickBtn').setAttribute('aria-expanded', 'false'); q('#mPick').classList.remove('open');
    document.removeEventListener('click', fueraMeses); document.removeEventListener('keydown', escMeses);
    if (GS) gsap.to(pop, { opacity: 0, y: -6, scale: .97, duration: .16, ease: 'power1.in', onComplete: function () { pop.remove(); } }); else pop.remove();
  }
  function fueraMeses(e) { var mp = q('#mPick'); if (mp && !mp.contains(e.target)) cerrarMeses(); }
  function escMeses(e) { if (e.key === 'Escape') cerrarMeses(); }
  function toggleMeses() {
    if (q('#mPick .mpick__pop')) { cerrarMeses(); return; }
    MP_ANIO = CUR ? +CUR.slice(0, 4) : new Date().getFullYear();
    var pop = el('<div class="mpick__pop" role="dialog" aria-label="Elegir mes"><div class="mpick__hd"><button type="button" class="mpick__yr" data-d="-1" aria-label="Año anterior">‹</button><b id="mpAnio"></b><button type="button" class="mpick__yr" data-d="1" aria-label="Año siguiente">›</button></div><div class="mpick__grid" id="mpGrid"></div><div class="mpick__ft"><i></i>con datos</div></div>');
    q('#mPick').appendChild(pop); q('#mPick').classList.add('open'); q('#mPickBtn').setAttribute('aria-expanded', 'true');
    qa('.mpick__yr', pop).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); MP_ANIO += +b.dataset.d; pintarMeses(+b.dataset.d); }); });
    pintarMeses(0);
    if (GS) gsap.fromTo(pop, { opacity: 0, y: -8, scale: .96, transformOrigin: '50% 0%' }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'back.out(1.6)' });
    setTimeout(function () { document.addEventListener('click', fueraMeses); document.addEventListener('keydown', escMeses); }, 0);
  }
  function pintarMeses(dir) {
    var grid = q('#mpGrid'); if (!grid) return;
    var anios = MONTHS.map(function (m) { return +m.slice(0, 4); }), aMin = Math.min.apply(null, anios.concat([MP_ANIO])), aMax = Math.max.apply(null, anios.concat([MP_ANIO]));
    q('#mpAnio').textContent = MP_ANIO;
    qa('.mpick__yr').forEach(function (b) { b.disabled = (+b.dataset.d < 0 && MP_ANIO <= aMin) || (+b.dataset.d > 0 && MP_ANIO >= aMax); });
    grid.innerHTML = MESES.map(function (n, i) {
      var ym = MP_ANIO + '-' + pad(i + 1), has = MONTHS.indexOf(ym) >= 0;
      return '<button type="button" class="mpick__m' + (has ? ' has' : '') + (ym === CUR ? ' on' : '') + '" data-ym="' + ym + '"' + (has ? '' : ' disabled') + '>' + n + '</button>';
    }).join('');
    qa('.mpick__m.has', grid).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (b.dataset.ym === CUR) { cerrarMeses(); return; }
        qa('.mpick__m', grid).forEach(function (x) { x.classList.toggle('on', x === b); });
        if (GS) gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .35, ease: 'back.out(2.5)' });
        var ym = b.dataset.ym, d = ym > CUR ? 1 : -1;
        setTimeout(function () { cerrarMeses(); irMes(ym, d); }, 160);
      });
    });
    if (GS) gsap.from(qa('.mpick__m', grid), { opacity: 0, x: dir ? dir * 10 : 0, y: dir ? 0 : 4, duration: .26, stagger: .018, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  /* ── Shell ── */
  function renderShell() {
    var st = q('#stage');
    if (!MONTHS.length && VIEW !== 'cargar') {
      st.innerHTML = '<div class="tb3"><div class="tbd-title"><h2>Pedidos en tiempo y forma</h2><span class="sub">Todavía no hay datos cargados</span></div></div>' +
        '<div class="empty">' + IC.empty + '<h3>Todavía no hay una base cargada</h3><p>' + (isAdmin() ? 'Entrá a <b>Actualizar datos</b> (en la barra lateral) para subir el Excel de pedidos de SAP.' : 'Pedile a un administrador que cargue el Excel de pedidos.') + '</p>' +
        (isAdmin() ? '<button class="btn btn--primary" type="button" id="btnIrCargar" style="margin-top:16px">' + IC.upload + ' Actualizar datos</button>' : '') + '</div>';
      var b = q('#btnIrCargar'); if (b) b.addEventListener('click', function () { ir('cargar'); });
      return;
    }
    st.innerHTML = toolbarHtml() + '<div class="ot" id="otBody"></div>';
    wireToolbar();
    if (GS) {
      gsap.from('#stage .tb3 > *', { opacity: 0, y: -8, duration: .38, stagger: .06, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    renderPagina(true);
  }

  function renderPagina(entrada) {
    var body = q('#otBody'); if (!body) return;
    var sinFiltros = VIEW === 'parametros' || VIEW === 'cargar';
    var scopeSlot = q('#scopeSlot'); if (scopeSlot) scopeSlot.style.visibility = sinFiltros ? 'hidden' : '';
    var mp = q('#mPick'); if (mp) mp.style.display = sinFiltros ? 'none' : '';
    if (VIEW === 'resumen') renderResumen(body, entrada);
    else if (VIEW === 'detalle') renderDetalle(body, entrada);
    else if (VIEW === 'zonas') renderZonas(body, entrada);
    else if (VIEW === 'vendedores') renderVendedores(body, entrada);
    else if (VIEW === 'tiempos') renderTiempos(body, entrada);
    else if (VIEW === 'parametros') renderParametros(body, entrada);
    else if (VIEW === 'cargar') renderCargar(body, entrada);
    else if (VIEW === 'kpi') renderKpi(body, entrada);
    else renderPronto(body);
    setTimeout(function () { mejorarFiltros(body); revelarAlBajar(); }, 60);
  }

  function renderPronto(body) {
    var nom = { tiempos: 'Tiempos de entrega', zonas: 'Zonas', vendedores: 'Vendedores y clientes', detalle: 'Detalle de pedidos', parametros: 'Plazos y calendario' }[VIEW] || '';
    q('#tbTitle').textContent = nom; q('#tbSub').textContent = '';
    body.innerHTML = '<div class="ot-soon">' + IC.soon + '<h3>' + esc(nom) + '</h3><p>Esta pantalla se arma después de aprobar el Resumen, con el mismo estilo.</p></div>';
    if (GS) gsap.from(body.firstChild, { opacity: 0, y: 12, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  /* ════════════════════════════════════════════════════════════
     RESUMEN
     ════════════════════════════════════════════════════════════ */
  function semColor(p) { var meta = +CFG.meta_otif || 85; return p == null ? '#cbd5e1' : p >= meta ? '#16a34a' : p >= meta - 10 ? '#d97706' : '#dc2626'; }

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
    var evs = EVS.filter(enScope), g = CALC.resumen(evs), meta = +CFG.meta_otif || 85;
    var scopeTxt = { tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE];
    q('#tbTitle').textContent = 'Pedidos en tiempo y forma';
    q('#tbSub').textContent = 'Cumplimiento de entregas · ' + mesLbl(CUR) + ' · ' + scopeTxt;

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
        '<div class="ot-blue st-' + estadoMeta(g.pOtif, meta).c + '" id="cardOtif">' +
          '<div class="ot-lbl">Nivel de cumplimiento · ' + esc(mesLbl(CUR)) + chipEstado(g.pOtif, meta) + gapHtml(g, meta) + '</div>' +
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
            '<div class="ot-st"><b>' + jd(g.cicloMed) + '</b><span>Tiempo habitual</span></div>' +
            '<div class="ot-st wide"><b class="num">' + gs(g.monto) + '</b><span>Monto pedido</span></div>' +
            '<div class="ot-st"><b>' + nf(g.total) + '</b><span>Pedidos del mes</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ot-blue alt" id="cardTrend">' +
          '<div class="ot-lbl ot-lbl--row"><span id="trTitle"></span>' +
            '<div class="ot-seg" id="trSeg" role="tablist" aria-label="Agrupar tendencia"><span class="ot-seg__pill"></span>' +
              '<button type="button" data-m="dia">Día</button><button type="button" data-m="semana">Semana</button><button type="button" data-m="mes">Mes</button></div></div>' +
          '<div class="ot-trend__inner" id="trInner"></div>' +
        '</div>' +
      '</div>' +

      '<div class="ot-tiles">' +
        tile('#0B5F8D', 'A tiempo', '<span id="tOt">0%</span>', nf(g.ot) + ' de ' + nf(g.evaluados) + ' pedidos llegaron en plazo', 'kpi-ot', 'Ver pedidos') +
        tile('#16a34a', 'Completos', '<span id="tIn">0%</span>', nf(g.inf) + ' de ' + nf(g.evaluados) + ' pedidos sin faltantes', 'kpi-inf', 'Ver pedidos') +
        tile('#d97706', 'Entregas sin cerrar', '<span id="tSr">0</span><small>pedidos</small>', 'Salieron y falta registrar la entrega', 'kpi-sc', 'Ver pedidos') +
        tile('#dc2626', 'Sin despachar', '<span id="tSd">0</span><small>pedidos</small>', 'Nunca salieron del depósito', 'kpi-sd', 'Ver pedidos') +
      '</div>' +

      '<div class="ot-grid2">' +
        '<div class="ot-card" id="cardTramos"><div class="ot-card__h"><h3>¿Dónde se demora el pedido?</h3><small>tiempo habitual · tocá una etapa para ver sus pedidos</small></div>' +
          '<div class="rt"><div class="rt-line"><span></span></div>' + TRAMOS.map(function (t) { var v = tm[t[0]], mx = t[0] === tMax; return '<div class="rt-n' + (mx ? ' is-max' : '') + '" data-etapa="' + t[0] + '" role="button" tabindex="0" title="Ver los pedidos de ' + esc(t[1].toLowerCase()) + ' (' + esc(t[2]) + ')"><i class="rt-go">' + SV('<path d="M7 17L17 7M9 7h8v8"/>') + '</i><div class="rt-i">' + STG_ICO[t[0]] + '</div><b>' + esc(t[1]) + '</b><span>' + jd(v) + '</span>' + (mx ? '<em>Cuello de botella</em>' : '') + '</div>'; }).join('') + '</div>' +
          '<div class="cfg-wrap">' + btnConfigHorario() + '</div>' +
        '</div>' +
        '<div class="ot-card" id="cardMotivos"><div class="ot-card__h"><h3>Motivos de no entrega</h3><small>los más frecuentes</small></div>' +
          (motL.length ? '<div class="ot-bars ot-bars--mot">' + motL.slice(0, 5).map(function (m) { var mx = motL[0].n || 1; return barRow(m.k, m.ped + ' pedidos', m.n / mx * 100, '#0B5F8D', nf(m.n), null, motivoIco(m.k)); }).join('') + '</div>' : '<div class="ot-soon" style="padding:24px">Sin artículos no entregados en este filtro.</div>') +
        '</div>' +
      '</div>';

    ['ot', 'inf', 'sc', 'sd'].forEach(function (k) {
      var t = q('#kpi-' + k); if (!t) return;
      t.addEventListener('click', function () { abrirKpi(k); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirKpi(k); } });
    });
    wireConfigHorario(body);
    wireEtapas(body, 'resumen');
    animarResumen(g, pOtif, C, false, entrada);
    montarTendencia(meta);
  }

  function tile(color, lbl, valHtml, foot, id, accion) {
    return '<div class="ot-tile' + (id ? ' is-click' : '') + '"' + (id ? ' id="' + id + '" role="button" tabindex="0"' : '') + ' style="--c:' + color + '"><div class="ot-tile__h"><i></i>' + esc(lbl) + (accion ? '<span class="ot-tile__go">' + esc(accion) + '<i>' + SV('<path d="M5 12h14M13 6l6 6-6 6"/>') + '</i></span>' : '') + '</div><div class="ot-tile__v">' + valHtml + '</div>' +
      (typeof foot === 'string' ? '<div class="ot-tile__s">' + esc(foot) + '</div></div>' : '<div class="ot-tile__f">' + foot.map(function (f) { return '<div' + (f[2] ? ' class="wide"' : '') + '><b' + (f[2] ? ' class="num"' : '') + ' title="' + esc(String(f[0]).replace(/<[^>]+>/g, '')) + '">' + f[0] + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div></div>');
  }
  function barRow(name, sub, pct, color, valTxt, meta, ico) {
    return '<div class="ot-bar' + (ico ? ' has-ico' : '') + '"><div class="ot-bar__n" title="' + esc(name) + '">' + (ico ? '<span class="ot-bar__ico">' + ico + '</span>' : '') + '<span class="ot-bar__tx">' + esc(name) + '<small>' + esc(sub) + '</small></span></div>' +
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
    // flujo del proceso + barras
    tl.fromTo('#cardTramos .rt-line span', { width: '0%' }, { width: '100%', duration: 1.1, ease: 'power2.inOut' }, .35);
    tl.from('#cardTramos .rt-i', { scale: 0, rotate: -20, duration: .45, stagger: .16, ease: 'back.out(2.2)', clearProps: 'transform' }, .4);
    tl.from('#cardTramos .rt-n b, #cardTramos .rt-n span, #cardTramos .rt-n em', { opacity: 0, y: 6, duration: .3, stagger: .05, ease: 'power2.out', clearProps: 'transform,opacity' }, .55);
    tl.from('#cardMotivos .ot-bar__ico', { scale: 0, duration: .4, stagger: .06, ease: 'back.out(2.4)', clearProps: 'transform' }, .45);
    // Festejo: si el OTIF llegó a la meta, el anillo late
    if (g.pOtif != null && g.pOtif >= (+CFG.meta_otif || 85)) tl.fromTo('.ot-gauge', { scale: 1 }, { scale: 1.06, duration: .22, yoyo: true, repeat: 3, ease: 'power1.inOut', clearProps: 'transform' }, 1.5);
    qa('.ot-bar__t span').forEach(function (s, i) { gsap.fromTo(s, { width: '0%' }, { width: s.dataset.w + '%', duration: .9, delay: .4 + i * .035, ease: 'power3.out' }); });
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
    mejorarFiltros(bd);
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

  /* ════════════════════════════════════════════════════════════
     TENDENCIA — Día / Semana / Mes (botones en la tarjeta azul)
     Día = días del mes elegido · Semana = últimas 10 semanas ·
     Mes = últimos 6 meses. Agrupa por fecha de carga del pedido.
     Los meses anteriores se traen solo cuando se piden (caché).
     ════════════════════════════════════════════════════════════ */
  var TMODE = 'mes', TCACHE = {};   // por defecto: tendencia mensual (pedido del usuario)
  var MES_AB = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  function lunesDe(dia) {   // 'YYYY-MM-DD' → lunes de esa semana
    var d = new Date(dia + 'T00:00:00Z'), w = (d.getUTCDay() + 6) % 7;
    return new Date(d.getTime() - w * 86400000).toISOString().slice(0, 10);
  }
  function mesMas(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + pad(m + 1); }
  async function evsDeMeses(yms) {
    var out = [];
    for (var i = 0; i < yms.length; i++) {
      var ym = yms[i];
      if (ym === CUR) { out = out.concat(EVS); continue; }
      if (MONTHS.indexOf(ym) < 0) continue;
      if (!TCACHE[ym]) {
        var r = rangoMes(ym);
        var rows = await paginar(function () { return DB.from('otif_v_pedidos').select(COLS).gte('fecha_carga', r[0]).lt('fecha_carga', r[1]).order('doc_vtas'); });
        TCACHE[ym] = rows.map(CALC.evaluar).filter(Boolean);
      }
      out = out.concat(TCACHE[ym]);
    }
    return out;
  }
  function mesesDelModo(m) {
    if (m === 'mes') return [-5, -4, -3, -2, -1, 0].map(function (n) { return mesMas(CUR, n); });
    if (m === 'semana') return [-2, -1, 0].map(function (n) { return mesMas(CUR, n); });
    return [CUR];
  }
  function serie(evs, m) {
    var grp = new Map(), finMes = rangoMes(CUR)[1].slice(0, 10);
    evs.forEach(function (o) {
      if (o.estado !== 'evaluado' || !enScope(o)) return;
      var d = diaPY(o.p.fecha_carga);
      if (d >= finMes) return;
      var k = m === 'mes' ? d.slice(0, 7) : m === 'semana' ? lunesDe(d) : d;
      if (!grp.has(k)) grp.set(k, [0, 0]);
      var x = grp.get(k); x[0]++; if (o.otif) x[1]++;
    });
    var minN = m === 'dia' ? 10 : 20;
    var ks = Array.from(grp.keys()).filter(function (k) { return grp.get(k)[0] >= minN; }).sort();
    if (m === 'semana') ks = ks.slice(-10);
    return ks.map(function (k) {
      var x = grp.get(k), corto, largo;
      if (m === 'mes') { corto = MESES[+k.slice(5, 7) - 1] + (k.slice(0, 4) !== CUR.slice(0, 4) ? ' ' + k.slice(0, 4) : ''); largo = mesLbl(k); }   // nombre completo, sin abreviar
      else if (m === 'semana') { var fin = new Date(Date.parse(k + 'T00:00:00Z') + 6 * 86400000).toISOString().slice(0, 10); corto = k.slice(8) + '/' + k.slice(5, 7); largo = k.slice(8) + '/' + k.slice(5, 7) + '–' + fin.slice(8) + '/' + fin.slice(5, 7); }
      else { corto = k.slice(8) + '/' + k.slice(5, 7); largo = corto; }
      return { k: k, v: x[1] / x[0] * 100, n: x[0], corto: corto, largo: largo };
    });
  }
  var TXT = {
    dia: { tit: 'Evolución diaria', uno: 'día', unos: 'días', prom: 'Promedio diario', mejor: 'Mejor día', peor: 'Peor día' },
    semana: { tit: 'Evolución semanal', uno: 'semana', unos: 'semanas', prom: 'Promedio semanal', mejor: 'Mejor semana', peor: 'Peor semana' },
    mes: { tit: 'Evolución mensual', uno: 'mes', unos: 'meses', prom: 'Promedio mensual', mejor: 'Mejor mes', peor: 'Peor mes' }
  };
  function moverPill(animar) {
    var seg = q('#trSeg'); if (!seg) return;
    var b = q('[data-m="' + TMODE + '"]', seg), pill = q('.ot-seg__pill', seg);
    qa('button', seg).forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    var to = { x: b.offsetLeft - 3, width: b.offsetWidth };
    if (GS && animar) gsap.to(pill, { x: to.x, width: to.width, duration: .42, ease: 'back.out(1.6)' });
    else { pill.style.transform = 'translateX(' + to.x + 'px)'; pill.style.width = to.width + 'px'; }
  }
  function montarTendencia(meta) {
    var seg = q('#trSeg'); if (!seg) return;
    qa('button', seg).forEach(function (b) {
      b.addEventListener('click', function () { if (TMODE === b.dataset.m) return; TMODE = b.dataset.m; moverPill(true); pintarTendencia(meta, true); });
    });
    requestAnimationFrame(function () { moverPill(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moverPill(false); });
    pintarTendencia(meta, false);
  }
  async function pintarTendencia(meta, cambio) {
    var inner = q('#trInner'), tt = TXT[TMODE];
    if (!inner) return;
    q('#trTitle').textContent = tt.tit + ' · ' + (TMODE === 'mes' ? 'últimos 6 meses' : TMODE === 'semana' ? 'últimas semanas' : mesLbl(CUR));
    var yms = mesesDelModo(TMODE), faltan = yms.some(function (ym) { return ym !== CUR && MONTHS.indexOf(ym) >= 0 && !TCACHE[ym]; });
    var token = (pintarTendencia._t = (pintarTendencia._t || 0) + 1);
    if (faltan) {
      if (GS && cambio) gsap.to(inner, { opacity: .35, duration: .2 });
      inner.insertAdjacentHTML('beforeend', '<div class="ot-trend__busy"><span></span></div>');
    } else if (GS && cambio) {
      await new Promise(function (r) { gsap.to(inner, { opacity: 0, y: 6, duration: .16, ease: 'power1.in', onComplete: r }); });
    }
    var evs;
    try { evs = await evsDeMeses(yms); } catch (e) { console.error(e); toast('No se pudo traer la tendencia', true); evs = EVS; }
    if (token !== pintarTendencia._t) return;     // el usuario ya eligió otro modo
    var s = serie(evs, TMODE), n = s.length, vals = s.map(function (x) { return x.v; });
    var hay = n >= 2, ult = n ? s[n - 1] : null, ant = hay ? s[n - 2] : null;
    var delta = hay ? ult.v - ant.v : null, cls = delta == null ? 'flat' : delta > .5 ? 'up' : delta < -.5 ? 'down' : 'flat';
    var iMax = n ? vals.indexOf(Math.max.apply(null, vals)) : -1, iMin = n ? vals.indexOf(Math.min.apply(null, vals)) : -1;
    var prom = n ? vals.reduce(function (a, v) { return a + v; }, 0) / n : null;
    var paso = n > 12 ? Math.ceil(n / 10) : 1;
    var detalle = !ult ? '' : TMODE === 'mes' ? esc(ult.largo) + (hay ? ' · ' + (delta >= 0 ? '+' : '') + nf(delta, 1) + ' pts vs ' + esc(ant.largo) : '')
      : TMODE === 'semana' ? 'semana ' + esc(ult.largo) + (hay ? ' · ' + (delta >= 0 ? '+' : '') + nf(delta, 1) + ' pts vs la anterior' : '')
      : 'último día (' + esc(ult.corto) + ')' + (hay ? ' · ' + (delta >= 0 ? '+' : '') + nf(delta, 1) + ' pts vs ' + esc(ant.corto) : '');
    inner.innerHTML =
      '<div class="ot-trend__big">' + (ult ? '<i class="' + cls + '">' + (cls === 'up' ? '▲' : cls === 'down' ? '▼' : '●') + '</i><span id="tUlt">' + pf(ult.v) + '</span><small>' + detalle + '</small>' : '<span class="ot-trend__none">Sin datos suficientes</span>') + '</div>' +
      '<div class="ot-trend__ch">' + (hay
        ? spark(vals, s.map(function (x) { return x.largo + ' · ' + nf(x.n) + ' ped.'; }), meta) + '<div class="gspark__x">' + s.map(function (x, i) { return '<span' + (i === n - 1 ? ' class="on"' : '') + (i % paso && i !== n - 1 ? ' style="visibility:hidden"' : '') + '>' + esc(x.corto) + '</span>'; }).join('') + '</div>'
        : '<div class="ot-trend__msg">' + (n === 1 ? 'Hay un solo ' + tt.uno + ' con datos. ' : '') + 'Cargá más ' + tt.unos + ' para ver la tendencia.</div>') + '</div>' +
      '<div class="ot-foot">' +
        '<div class="ot-st"><b>' + pf(prom) + '</b><span>' + tt.prom + '</span></div>' +
        '<div class="ot-st"><b>' + (n ? esc(s[iMax].corto) + ' · ' + pf(vals[iMax]) : '—') + '</b><span>' + tt.mejor + '</span></div>' +
        '<div class="ot-st"><b>' + (n ? esc(s[iMin].corto) + ' · ' + pf(vals[iMin]) : '—') + '</b><span>' + tt.peor + '</span></div>' +
      '</div>';
    if (!GS) { inner.style.opacity = 1; return; }
    gsap.fromTo(inner, { opacity: cambio ? 0 : 1, y: cambio ? 6 : 0 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out', clearProps: 'transform' });
    var line = q('.gspark__line', inner);
    if (line && line.getTotalLength) {
      var L = line.getTotalLength();
      gsap.fromTo(line, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: cambio ? .9 : 1.2, delay: cambio ? .05 : .3, ease: 'power2.inOut', onComplete: function () { line.style.strokeDasharray = ''; line.style.strokeDashoffset = ''; } });
      gsap.from(q('.gspark__area', inner), { opacity: 0, duration: .7, delay: cambio ? .2 : .6, ease: 'power1.out' });
      gsap.from(qa('.gspark__dot', inner), { scale: 0, transformOrigin: '50% 50%', duration: .38, stagger: Math.min(.07, .6 / n), delay: cambio ? .2 : .55, ease: 'back.out(2.5)' });
    }
    if (ult) animCount(q('#tUlt'), ult.v, function (x) { return pf(x); }, cambio ? .8 : 1.2);
  }

  /* ════════════════════════════════════════════════════════════
     ZONAS (minimalista) — Capital / Interior + departamentos ordenados por
     los pedidos que les faltan para llegar a la meta.
     ════════════════════════════════════════════════════════════ */
  var ZN = { orden: 'faltan', abierto: null, lente: 'cumpl', sel: null };
  function renderZonas(body, entrada) {
    var evs = EVS.filter(enScope), meta = +CFG.meta_otif || 85, tot = CALC.resumen(evs);
    q('#tbTitle').textContent = 'Cumplimiento por zona';
    q('#tbSub').textContent = 'Entregas según destino · ' + mesLbl(CUR) + ' · ' + ({ tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE]);
    var zonas = CALC.agrupar(evs, function (p) { return p.zona; }).filter(function (z) { return z.evaluados; }).sort(function (a, b) { return a.clave < b.clave ? -1 : 1; });
    var deps = CALC.agrupar(evs, function (p) { return p.departamento; }).filter(function (d) { return d.evaluados; });
    var zonaDe = {}; evs.forEach(function (o) { zonaDe[o.p.departamento] = o.p.zona; });
    deps.forEach(function (d) { d.faltan = faltanParaMeta(d, meta); d.zona = zonaDe[d.clave]; });
    var slaProm = function (lista) { var s = 0, n = 0; lista.forEach(function (o) { if (o.estado === 'evaluado') { s += o.sla; n++; } }); return n ? s / n : null; };
    var mapApi = null;

    function zonaCard(z) {
      var f = faltanParaMeta(z, meta), lista = evs.filter(function (o) { return o.p.zona === z.clave; });
      var cap = z.clave === 'Capital';
      return '<div class="ot-blue zn-card ' + (cap ? 'zn-cap' : 'zn-int') + ' st-' + estadoMeta(z.pOtif, meta).c + '">' +
        '<div class="zn-top"><span class="zn-tag"><span class="zn-ico">' + (ZONA_ICO[z.clave] || ZONA_ICO.Interior) + '</span><b>' + esc(z.clave) + '</b></span>' +
          '<div class="ot-lbl zn-chips">' + chipEstado(z.pOtif, meta) + (f == null ? '' : chipFaltan(f, meta)) + '</div></div>' +
        '<div class="zn-big"><span data-p="' + z.pOtif + '">0%</span><small>en tiempo y forma</small></div>' +
        '<div class="zn-meter"><span data-w="' + Math.min(100, z.pOtif || 0).toFixed(1) + '"></span><em style="left:' + meta + '%"><i>' + pf(meta, 0) + '</i></em></div>' +
        '<div class="ot-foot">' +
          '<div class="ot-st"><b>' + nf(z.evaluados) + '</b><span>Pedidos evaluados</span></div>' +
          '<div class="ot-st"><b>' + tiempo(z.cicloMed) + '</b><span>Tiempo habitual</span></div>' +
          '<div class="ot-st"><b>' + plazo(slaProm(lista)) + '</b><span>Plazo</span></div>' +
        '</div></div>';
    }
    body.innerHTML =
      // Diseño en dos columnas: [Capital · Interior · ranking] | [mapa fijo a la derecha]
      '<div class="zn-layout">' +
        '<div class="zn-left">' +
          '<div class="zn-stack">' + zonas.map(zonaCard).join('') + '</div>' +
          '<div class="ot-card" id="znRank"><div class="ot-card__h"><h3>Ranking por departamento</h3>' +
            '<div class="ord"><span class="ord__l">Ordenar por</span><div class="zn-sort" id="znSort"><button type="button" data-o="faltan" title="Primero los que más pedidos necesitan recuperar para llegar a la meta">Más pedidos faltantes</button><button type="button" data-o="otif" title="Primero los de porcentaje más bajo">Menor cumplimiento</button></div></div></div>' +
            '<div class="zn-head"><span>Departamento</span><span>% en tiempo y forma</span><span class="r">Faltan p/ ' + pf(meta, 0) + '</span><span></span></div>' +
            '<div id="znRows"></div>' +
            '<div class="ot-legend"><span><i style="background:#16a34a"></i>En meta</span><span><i style="background:#d97706"></i>Cerca</span><span><i style="background:#dc2626"></i>Lejos</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="zn-right">' +
          '<div class="ot-card zn-map" id="znMap"><div class="ot-card__h"><h3>Mapa de cumplimiento</h3><div class="zn-sort" id="znLente"><button type="button" data-l="cumpl">Cumplimiento</button><button type="button" data-l="vol">Volumen</button></div></div>' +
            '<div class="zn-map__box" id="znMapBox"></div><div class="pm-scale" id="znMapLeg"></div><div class="md" id="znDet"></div></div>' +
        '</div>' +
      '</div>';

    function fila(d, sub) {
      var c = semColor(d.pOtif);
      return '<div class="zn-row' + (sub ? ' sub' : '') + '"' + (sub ? ' data-city="' + esc(d.clave) + '" role="button" tabindex="0" title="Ver quiénes vendieron en ' + esc(tCase(d.clave)) + '"' : ' data-dep="' + esc(d.clave) + '" role="button" tabindex="0"') + '>' +
        (sub ? '<div class="zn-name zn-name--c"><i class="zn-cico">' + SV('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>') + '</i><span>' + esc(tCase(d.clave)) + '<small>' + nf(d.evaluados) + ' pedidos</small></span></div>'
             : '<div class="zn-name zn-name--d"><i class="zn-dico">' + SV('<path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>') + '</i><span>' + esc(d.clave) + '<small>' + nf(d.evaluados) + ' pedidos</small></span></div>') +
        '<div class="zn-bar"><div class="ot-bar__t"><span data-w="' + Math.min(100, d.pOtif || 0).toFixed(1) + '" style="background:' + c + '"></span><em style="left:' + meta + '%"></em></div><b style="color:' + c + '">' + pf(d.pOtif) + '</b></div>' +
        '<div class="r">' + (d.faltan === 0 ? '<span class="st-chip ok">En meta</span>' : nf(d.faltan)) + '</div>' +
        '<div class="zn-chev">' + (sub ? '<span class="zn-vgo">' + SV('<path d="M9 6l6 6-6 6"/>') + '</span>' : '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>') + '</div></div>';
    }
    function ordenar() {
      var k = ZN.orden;
      deps.sort(function (a, b) { return k === 'otif' ? (a.pOtif - b.pOtif) : k === 'pedidos' ? (b.evaluados - a.evaluados) : (b.faltan - a.faltan || b.evaluados - a.evaluados); });
      qa('#znSort button').forEach(function (b) { b.classList.toggle('on', b.dataset.o === k); });
    }
    function pintarFilas(animar) {
      ordenar();
      q('#znRows').innerHTML = deps.map(function (d) { return '<div class="zn-grp' + (ZN.abierto === d.clave ? ' open' : '') + '">' + fila(d, false) + '<div class="zn-sub"></div></div>'; }).join('');
      crecer(qa('#znRows .zn-bar span'), { anim: animar !== false, delay: .1, stagger: .025 });
      if (GS && animar !== false) gsap.from(qa('#znRows .zn-row').slice(0, 14), { opacity: 0, x: -10, duration: .32, stagger: .03, ease: 'power2.out', clearProps: 'transform,opacity' });
      qa('#znRows .zn-row[data-dep]').forEach(function (r) {
        r.addEventListener('mouseenter', function () { if (mapApi) mapApi.foco(r.dataset.dep); });
        r.addEventListener('mouseleave', function () { if (mapApi) mapApi.foco(null); });
        var go = function () { toggleDep(r.parentNode, r.dataset.dep); };
        r.addEventListener('click', go); r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
      if (ZN.abierto) { var g = qa('#znRows .zn-grp').filter(function (x) { return x.classList.contains('open'); })[0]; if (g) llenarSub(g, ZN.abierto, false); }
    }
    function llenarSub(grp, dep, animar) {
      var subs = CALC.agrupar(evs.filter(function (o) { return o.p.departamento === dep; }), function (p) { return p.region_nombre || p.region_cod || '—'; })
        .filter(function (c) { return c.evaluados; }).sort(function (a, b) { return b.evaluados - a.evaluados; });
      subs.forEach(function (c) { c.faltan = faltanParaMeta(c, meta); });
      var box = q('.zn-sub', grp), evDep = evs.filter(function (o) { return o.p.departamento === dep; });
      box.innerHTML = '<div class="zn-subh"><span>Ciudades de <b>' + esc(dep) + '</b> · ' + nf(subs.length) + '</span><button type="button" class="zn-vbtn">' + SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 010 6.8M18.5 14.8c1.7.8 2.8 2.6 3 5.2"/>') + 'Vendedores de ' + esc(dep) + '<em class="zn-vbtn__n">' + nf(new Set(evDep.map(function (o) { return o.p.vendedor_nombre || o.p.vendedor_cod; }).filter(Boolean)).size) + '</em></button></div>' +
        subs.map(function (c) { return fila(c, true); }).join('');
      q('.zn-vbtn', box).addEventListener('click', function (e) { e.stopPropagation(); abrirVendedores(dep, 'Departamento · ' + (zonaDe[dep] || ''), evDep, { dep: dep }); });
      qa('.zn-row[data-city]', box).forEach(function (r) {
        var go = function () { var c = r.dataset.city; abrirVendedores(tCase(c), dep + ' · ' + (zonaDe[dep] || ''), evDep.filter(function (o) { return (o.p.region_nombre || o.p.region_cod || '—') === c; }), { dep: dep, city: c }); };
        r.addEventListener('click', go); r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
      qa('.zn-bar span', box).forEach(function (s) { s.style.width = s.dataset.w + '%'; });
      if (!GS || animar === false) { box.style.height = 'auto'; return; }
      gsap.fromTo(box, { height: 0 }, { height: 'auto', duration: .45, ease: 'power3.out' });
      gsap.from(qa('.zn-row', box), { opacity: 0, y: -6, duration: .3, stagger: .025, delay: .08, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    function toggleDep(grp, dep) {
      var abierto = grp.classList.contains('open');
      qa('#znRows .zn-grp.open').forEach(function (g) {
        if (g === grp) return;
        g.classList.remove('open'); var b = q('.zn-sub', g);
        if (GS) gsap.to(b, { height: 0, duration: .3, ease: 'power2.in', onComplete: function () { b.innerHTML = ''; } }); else { b.innerHTML = ''; b.style.height = '0'; }
      });
      if (abierto) {
        grp.classList.remove('open'); ZN.abierto = null; var b2 = q('.zn-sub', grp);
        if (GS) gsap.to(b2, { height: 0, duration: .3, ease: 'power2.in', onComplete: function () { b2.innerHTML = ''; } }); else { b2.innerHTML = ''; b2.style.height = '0'; }
      } else { grp.classList.add('open'); ZN.abierto = dep; llenarSub(grp, dep, true); }
    }
    qa('#znSort button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (ZN.orden === b.dataset.o) return;
        ZN.orden = b.dataset.o;
        var antes = {};
        qa('#znRows .zn-grp').forEach(function (g) { antes[q('.zn-row', g).dataset.dep] = g.getBoundingClientRect().top; });
        pintarFilas(false);
        if (!GS) return;
        qa('#znRows .zn-grp').forEach(function (g, i) {
          var k = q('.zn-row', g).dataset.dep, dy = (antes[k] || 0) - g.getBoundingClientRect().top;
          if (Math.abs(dy) > 1) gsap.from(g, { y: dy, duration: .6, delay: i * .012, ease: 'power3.inOut', clearProps: 'transform' });
        });
      });
    });
    pintarFilas(entrada);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (!q('#znMapBox') || VIEW !== 'zonas') return; mapApi = pintarMapa(deps, meta, entrada, function (dep) {
      var r = qa('#znRows .zn-row[data-dep]').filter(function (x) { return x.dataset.dep === dep; })[0];
      if (!r) return;
      if (!r.parentNode.classList.contains('open')) toggleDep(r.parentNode, dep);
      var st = q('#stage'), top = r.getBoundingClientRect().top - st.getBoundingClientRect().top + st.scrollTop - 90;
      if (GS) gsap.to(st, { scrollTop: top, duration: .6, ease: 'power2.inOut' }); else st.scrollTop = top;
      if (GS) gsap.fromTo(r, { backgroundColor: '#dbeafe' }, { backgroundColor: 'rgba(0,0,0,0)', duration: 1.4, delay: .4, ease: 'power1.out', clearProps: 'backgroundColor' });
    }); }); });

    // animación de las tarjetas de zona
    qa('.zn-card').forEach(function (c, i) {
      var n = q('[data-p]', c), m = q('.zn-meter span', c);
      if (GS) gsap.from(q('.zn-ico', c), { scale: 0, rotate: -25, duration: .5, delay: .1 + i * .1, ease: 'back.out(2.4)', clearProps: 'transform' });
      animCount(n, parseFloat(n.dataset.p), function (v) { return pf(v); }, 1.1);
      crecer([m], { dur: 1.1, delay: .15 + i * .1 });
    });
    if (GS && entrada !== false) {
      gsap.from('.zn-card', { opacity: 0, y: 18, duration: .5, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('#znRank', { opacity: 0, y: 16, duration: .5, delay: .15, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
  }

  /* ════════════════════════════════════════════════════════════
     VENDEDORES Y CLIENTES (minimalista)
     Nombre · barra % en tiempo y forma · faltan para la meta.
     Tocar una fila abre el Detalle filtrado.
     ════════════════════════════════════════════════════════════ */
  var VC = { tipo: 'vend', orden: 'faltan', q: '', limit: 25 };
  function renderVendedores(body, entrada) {
    var evs = EVS.filter(enScope), meta = +CFG.meta_otif || 85;
    q('#tbTitle').textContent = 'Vendedores y clientes';
    q('#tbSub').textContent = 'Cumplimiento por cartera · ' + mesLbl(CUR) + ' · ' + ({ tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE]);
    body.innerHTML =
      '<div class="ot-card vc-card">' +
        '<div class="vc-bar"><div class="zn-sort" id="vcTipo"><button type="button" data-t="vend">Vendedores</button><button type="button" data-t="cli">Clientes</button></div>' +
          '<div class="ot-search vc-q"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="vcQ" placeholder="Buscar…" value="' + esc(VC.q) + '"/></div>' +
          '<div class="ord"><span class="ord__l">Ordenar por</span><div class="zn-sort" id="vcOrden"><button type="button" data-o="faltan" title="Primero los que más pedidos necesitan recuperar para llegar a la meta">Más pedidos faltantes</button><button type="button" data-o="otif" title="Primero los de porcentaje más bajo">Menor cumplimiento</button></div></div></div>' +
        '<div class="zn-head vc-head"><span id="vcCol">Vendedor</span><span>% en tiempo y forma</span><span class="r">Faltan p/ ' + pf(meta, 0) + '</span><span></span></div>' +
        '<div id="vcRows"></div>' +
        '<div class="ot-legend"><span><i style="background:#16a34a"></i>En meta</span><span><i style="background:#d97706"></i>Cerca</span><span><i style="background:#dc2626"></i>Lejos</span><span>· Solo personas con 5 pedidos evaluados o más</span></div>' +
      '</div>';
    function pintar(animar) {
      var key = VC.tipo === 'vend' ? function (p) { return p.vendedor_nombre || p.vendedor_cod; } : function (p) { return p.cliente_nombre || p.cliente_cod; };
      var grupos = CALC.agrupar(evs, key).filter(function (g) { return g.evaluados >= 5; });
      grupos.forEach(function (g) { g.faltan = faltanParaMeta(g, meta); });
      var t = VC.q.toLowerCase().trim();
      if (t) grupos = grupos.filter(function (g) { return String(g.clave).toLowerCase().indexOf(t) >= 0; });
      grupos.sort(function (a, b) { return VC.orden === 'otif' ? a.pOtif - b.pOtif : (b.faltan - a.faltan || b.evaluados - a.evaluados); });
      qa('#vcTipo button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === VC.tipo); });
      qa('#vcOrden button').forEach(function (b) { b.classList.toggle('on', b.dataset.o === VC.orden); });
      q('#vcCol').textContent = VC.tipo === 'vend' ? 'Vendedor' : 'Cliente';
      var vis = grupos.slice(0, VC.limit);
      q('#vcRows').innerHTML = !grupos.length ? '<div class="ot-soon" style="padding:40px">Sin resultados.</div>' :
        vis.map(function (g) {
          var c = semColor(g.pOtif);
          return '<div class="zn-row vc-row" data-k="' + esc(g.clave) + '" role="button" tabindex="0" title="Ver sus pedidos">' +
            '<div class="zn-name">' + esc(g.clave) + '<small>' + nf(g.evaluados) + ' pedidos</small></div>' +
            '<div class="zn-bar"><div class="ot-bar__t"><span data-w="' + Math.min(100, g.pOtif || 0).toFixed(1) + '" style="background:' + c + '"></span><em style="left:' + meta + '%"></em></div><b style="color:' + c + '">' + pf(g.pOtif) + '</b></div>' +
            '<div class="r">' + (g.faltan === 0 ? '<span class="st-chip ok">En meta</span>' : nf(g.faltan)) + '</div>' +
            '<div class="zn-chev"><svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></div></div>';
        }).join('') + (grupos.length > vis.length ? '<div class="det-more"><button class="btn btn--sm" type="button" id="vcMas">Mostrar más</button><span>' + nf(vis.length) + ' de ' + nf(grupos.length) + '</span></div>' : '');
      qa('#vcRows .zn-bar span').forEach(function (s, i) { if (GS && animar !== false) gsap.fromTo(s, { width: '0%' }, { width: s.dataset.w + '%', duration: .8, delay: .05 + Math.min(i, 20) * .03, ease: 'power3.out' }); else s.style.width = s.dataset.w + '%'; });
      if (GS && animar !== false) gsap.from(qa('#vcRows .zn-row').slice(0, 20), { opacity: 0, x: -10, duration: .3, stagger: .025, ease: 'power2.out', clearProps: 'transform,opacity' });
      qa('#vcRows .vc-row').forEach(function (r) {
        var go = function () {
          DET.q = DET.estado = DET.zona = DET.depto = DET.vend = DET.cond = ''; DET.limit = 200;
          if (VC.tipo === 'vend') DET.vend = r.dataset.k; else DET.q = r.dataset.k;
          ir('detalle');
        };
        r.addEventListener('click', go); r.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      });
      var mas = q('#vcMas'); if (mas) mas.addEventListener('click', function () { VC.limit += 25; pintar(false); });
    }
    qa('#vcTipo button').forEach(function (b) { b.addEventListener('click', function () { if (VC.tipo === b.dataset.t) return; VC.tipo = b.dataset.t; VC.limit = 25; VC.q = ''; q('#vcQ').value = ''; pintar(true); }); });
    qa('#vcOrden button').forEach(function (b) { b.addEventListener('click', function () { if (VC.orden === b.dataset.o) return; VC.orden = b.dataset.o; pintar(true); }); });
    var tmr; q('#vcQ').addEventListener('input', function (e) { clearTimeout(tmr); tmr = setTimeout(function () { VC.q = e.target.value; VC.limit = 25; pintar(false); }, 180); });
    pintar(entrada);
    if (GS && entrada !== false) gsap.from('.vc-card', { opacity: 0, y: 16, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
  }

  /* ════════════════════════════════════════════════════════════
     TIEMPOS DEL PROCESO (minimalista)
     Cada etapa: tiempo típico + "los más lentos" (1 de cada 10).
     Y cuánto tardan los pedidos en llegar, en tramos simples.
     ════════════════════════════════════════════════════════════ */
  function p90(a) { if (!a.length) return null; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * .9))]; }
  function renderTiempos(body, entrada) {
    var evs = EVS.filter(enScope), g = CALC.resumen(evs);
    q('#tbTitle').textContent = 'Tiempos de entrega';
    q('#tbSub').textContent = 'Medido en horario laboral · ' + mesLbl(CUR) + ' · ' + ({ tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE]);
    var filas = TRAMOS.map(function (t) { var a = g.tramos[t[0]] || []; return { t: t, med: g.tramosMed[t[0]], lento: p90(a) }; });
    var maxV = Math.max.apply(null, filas.map(function (f) { return f.lento || 0; })) || 1;
    var tMax = filas.reduce(function (m, f) { return f.med != null && (!m || f.med > m.med) ? f : m; }, null);
    // distribución: cuánto tardó cada pedido (carga → entrega)
    var J = CALC.jornada || 585;
    var cubos = [['Menos de 1 día', function (j) { return j < 1; }], ['1 día', function (j) { return j >= 1 && j < 2; }], ['2 días', function (j) { return j >= 2 && j < 3; }], ['3 a 5 días', function (j) { return j >= 3 && j < 6; }], ['Más de 5 días', function (j) { return j >= 6; }]];
    var cnt = cubos.map(function () { return 0; });
    g.ciclos.forEach(function (j) { for (var i = 0; i < cubos.length; i++) if (cubos[i][1](j)) { cnt[i]++; break; } });
    var tot = g.ciclos.length || 1, maxC = Math.max.apply(null, cnt) || 1;
    var lentos = p90(g.ciclos), slaN = 0, slaS = 0;
    evs.forEach(function (o) { if (o.estado === 'evaluado') { slaS += o.sla; slaN++; } });
    var slaProm = slaN ? slaS / slaN : null;
    var thMarg = slaProm != null && g.cicloMed != null ? slaProm - g.cicloMed : null, thPos = slaProm ? Math.min(100, (g.cicloMed || 0) / slaProm * 100) : 0;
    body.innerHTML =
      '<div class="tp-page">' +
      '<div class="ot-blue tp-hero2" id="tpHero">' +
        '<div class="th-main"><span class="th-ico">' + SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>') + '</span><div><span class="th-l">Tiempo habitual de entrega</span><b id="tpBig">' + tiempo(g.cicloMed) + '</b></div></div>' +
        '<div class="th-track"><div class="th-bar"><i data-w="' + thPos.toFixed(1) + '"></i></div><div class="th-ends"><span>Carga del pedido</span><span>Plazo · ' + plazo(slaProm == null ? null : Math.round(slaProm * 10) / 10) + '</span></div></div>' +
        '<div class="th-side">' + (thMarg == null ? '' : '<span class="st-meta ' + (thMarg >= 0 ? 'ok' : 'bad') + '"><i></i>' + tiempo(Math.abs(thMarg)) + (thMarg >= 0 ? ' antes del plazo' : ' después del plazo') + '</span>') + '<small>' + nf(g.ciclos.length) + ' pedidos entregados</small></div>' +
      '</div>' +
      '<div class="ot-grid2 tp-grid">' +
        '<div class="ot-card" id="tpEtapas"><div class="ot-card__h"><h3>Tiempo por etapa</h3><small>tocá una etapa para ver sus pedidos</small></div>' +
          '<div class="tp-rows">' + filas.map(function (f) {
            var w1 = (f.med || 0) / maxV * 100, w2 = (f.lento || 0) / maxV * 100, max = f === tMax;
            return '<div class="tp-row' + (max ? ' is-max' : '') + '" data-etapa="' + f.t[0] + '" role="button" tabindex="0" title="Ver los pedidos de esta etapa"><div class="tp-n"><span class="tp-ico">' + STG_ICO[f.t[0]] + '</span><span>' + esc(f.t[1]) + '<small>' + esc(f.t[2]) + '</small></span></div>' +
              '<div class="tp-bar"><span class="slow" data-w="' + w2.toFixed(1) + '"></span><span class="typ" data-w="' + w1.toFixed(1) + '" style="background:' + (max ? '#dc2626' : f.t[3]) + '"></span></div>' +
              '<div class="tp-v"><b>' + tiempo(f.med) + '</b><small>hasta ' + tiempo(f.lento, true) + '</small></div><span class="tp-go">' + SV('<path d="M9 6l6 6-6 6"/>') + '</span></div>';
          }).join('') + '</div>' +
          '<div class="ot-legend"><span><i style="background:#0B5F8D"></i>Tiempo habitual</span><span><i style="background:#d6e4f2"></i>Los más demorados</span></div>' + '<div class="cfg-wrap">' + btnConfigHorario() + '</div>' +
        '</div>' +
        '<div class="ot-card" id="tpDist"><div class="ot-card__h"><h3>¿En cuánto tiempo llegan los pedidos?</h3><small>' + nf(g.ciclos.length) + ' pedidos entregados</small></div>' +
          '<div class="tp-rows">' + cubos.map(function (c, i) {
            return '<div class="tp-col"><div class="tp-col__n">' + c[0] + '</div><div class="tp-col__bar"><span data-w="' + (cnt[i] / maxC * 100).toFixed(1) + '"></span></div><div class="tp-col__v"><b>' + pf(cnt[i] / tot * 100, 0) + '</b><small>' + nf(cnt[i]) + '</small></div></div>';
          }).join('') + '</div>' +
          '<div class="ot-legend">Según el tiempo desde la carga del pedido hasta la entrega (horario laboral)</div>' +
        '</div>' +
      '</div></div>';
    wireConfigHorario(body);
    wireEtapas(body, 'tiempos');
    var bars = qa('#tpEtapas .tp-bar span, #tpDist .tp-col__bar span, #tpHero .th-bar i');
    bars.forEach(function (s, i) { if (GS && entrada !== false) gsap.fromTo(s, { width: '0%' }, { width: s.dataset.w + '%', duration: .9, delay: .1 + i * .04, ease: 'power3.out' }); else s.style.width = s.dataset.w + '%'; });
    if (GS && entrada !== false) {
      gsap.from('#tpHero, .tp-grid .ot-card', { opacity: 0, y: 16, duration: .45, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('#tpBig', { opacity: 0, scale: .9, transformOrigin: '0% 50%', duration: .6, delay: .15, ease: 'back.out(1.8)', clearProps: 'transform,opacity' });
      gsap.from('.tp-row, .tp-col', { opacity: 0, x: -8, duration: .3, stagger: .04, delay: .1, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
  }

  /* ════════════════════════════════════════════════════════════
     PLAZOS Y FERIADOS — configuración (solo admin edita)
     Guarda en otif_config y recalcula todo el tablero.
     ════════════════════════════════════════════════════════════ */
  function renderParametros(body, entrada) {
    var adm = isAdmin(), c = JSON.parse(JSON.stringify(CFG || {}));
    c.sla_zona = c.sla_zona || {}; c.sla_departamento = c.sla_departamento || {}; c.feriados = c.feriados || [];
    c.calendario = c.calendario || { dias: [null, [435, 1020], [435, 1020], [435, 1020], [435, 1020], [435, 1020], [435, 690]] };
    var orig = JSON.stringify(c);
    q('#tbTitle').textContent = 'Plazos y calendario';
    q('#tbSub').textContent = adm ? 'Parámetros de medición · se aplican a todo el equipo' : 'Solo lectura · lo edita un administrador';
    var hm = function (m) { return m == null ? '' : pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
    var aMinHM = function (s) { var p = String(s || '').split(':'); return p.length === 2 && p[0] !== '' ? (+p[0]) * 60 + (+p[1]) : null; };
    var dis = adm ? '' : ' disabled';
    var DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    var MES3 = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    var deps = Object.keys(c.sla_departamento).sort(function (a, b) { return a.localeCompare(b, 'es'); });
    var meta = +c.meta_otif || 85, R = 54, CR = 2 * Math.PI * R;
    var hoyOtif = CALC.resumen(EVS).pOtif;
    var hoyISO = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
    var lv = c.calendario.dias[1] || [435, 1020], sa = c.calendario.dias[6];

    function stepper(attr, val, step, min, max) {
      return '<div class="stp"><button type="button" class="stp-b" data-d="-' + step + '"' + dis + ' aria-label="Menos">−</button>' +
        '<input type="number" ' + attr + ' value="' + val + '" step="' + step + '" min="' + min + '" max="' + max + '"' + dis + '/>' +
        '<button type="button" class="stp-b" data-d="' + step + '"' + dis + ' aria-label="Más">+</button></div>';
    }
    function franja(id, rango, etiqueta, sub) {
      var on = !!rango, l = on ? rango[0] / 1440 * 100 : 0, w = on ? (rango[1] - rango[0]) / 1440 * 100 : 0;
      return '<div class="pf-tl' + (on ? '' : ' off') + '" id="' + id + '">' +
        '<div class="pf-tl__n"><b>' + etiqueta + '</b><small>' + sub + '</small></div>' +
        '<div class="pf-tl__track"><span class="pf-tl__fill" data-l="' + l.toFixed(2) + '" data-w="' + w.toFixed(2) + '"></span>' +
          '<i style="left:25%"></i><i style="left:50%"></i><i style="left:75%"></i></div>' +
        '<div class="pf-tl__in"><input type="time" data-tl="' + id + '" data-p="0" value="' + (on ? hm(rango[0]) : '') + '"' + dis + '/><em>a</em><input type="time" data-tl="' + id + '" data-p="1" value="' + (on ? hm(rango[1]) : '') + '"' + dis + '/></div>' +
      '</div>';
    }
    function feriados() {
      var lista = c.feriados.slice().sort();
      if (!lista.length) return '<div class="pf-fer-empty">Sin feriados cargados.</div>';
      var prox = lista.filter(function (f) { return f >= hoyISO; })[0];
      return lista.map(function (f) {
        var d = new Date(f + 'T12:00:00Z'), pas = f < hoyISO;
        return '<div class="pf-fd' + (pas ? ' pas' : '') + (f === prox ? ' prox' : '') + '"><div class="pf-fd__cal"><span>' + MES3[d.getUTCMonth()] + '</span><b>' + f.slice(8) + '</b></div>' +
          '<div class="pf-fd__t"><b>' + DIAS[d.getUTCDay()] + '</b><small>' + (f === prox ? 'Próximo feriado' : f.slice(0, 4)) + '</small></div>' +
          (adm ? '<button type="button" class="pf-fd__x" data-del="' + f + '" aria-label="Quitar">' + SV('<path d="M18 6L6 18M6 6l12 12"/>') + '</button>' : '') + '</div>';
      }).join('');
    }

    body.innerHTML =
      '<div class="pf2">' +
        '<div class="ot-blue pf-meta">' +
          '<div class="ot-lbl">Meta de cumplimiento</div>' +
          '<div class="pf-meta__body">' +
            '<div class="pf-ring"><svg viewBox="0 0 128 128"><circle class="bg" cx="64" cy="64" r="' + R + '"/><circle class="fg" id="pfRing" cx="64" cy="64" r="' + R + '" stroke-dasharray="' + CR.toFixed(1) + '" stroke-dashoffset="' + CR.toFixed(1) + '"/></svg><div class="pf-ring__c"><b id="pfMetaTxt">' + meta + '%</b></div></div>' +
            '<div class="pf-meta__r"><p>de los pedidos tienen que llegar <b>a tiempo y completos</b></p>' + stepper('id="pfMeta"', meta, 1, 50, 100) +
              '<span class="pf-meta__hoy">Hoy: <b>' + pf(hoyOtif) + '</b> · ' + (hoyOtif != null && hoyOtif >= meta ? 'en meta' : 'faltan ' + nf(Math.max(0, meta - (hoyOtif || 0)), 1) + ' pts') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ot-card pf-hor"><div class="ot-card__h"><h3>Horario laboral</h3><small>los tiempos se cuentan solo en esta franja · 1 jornada = 1 día</small></div>' +
          franja('tlLv', lv, 'Lunes a viernes', 'jornada principal') +
          franja('tlSa', sa, 'Sábado', 'dejá vacío si no se trabaja') +
          '<div class="pf-tl off"><div class="pf-tl__n"><b>Domingo y feriados</b><small>no laborables</small></div><div class="pf-tl__track"></div><div class="pf-tl__in"><span class="cfg-tag">No laborable</span></div></div>' +
          '<div class="pf-tl__axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24 h</span></div>' +
        '</div>' +
        '<div class="ot-card pf-zon"><div class="ot-card__h"><h3>Plazo por zona</h3><small>días hábiles</small></div>' +
          ['Capital', 'Interior'].map(function (z) { return '<div class="pf-z" data-box><span class="pf-z__ico">' + (ZONA_ICO[z] || '') + '</span><div class="pf-z__t"><b>' + z + '</b><small>plazo de entrega</small></div>' + stepper('data-zona="' + z + '"', c.sla_zona[z] || '', .5, .5, 30) + '</div>'; }).join('') +
          '<div class="pf-note2">' + SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4M12 16h.01"/>') + '<span>Retira el cliente / salón (' + esc((c.condiciones_retiro || ['08', '09']).join(', ')) + '): el plazo termina en la factura.</span></div>' +
        '</div>' +
        '<div class="ot-card pf-dep"><div class="ot-card__h"><h3>Plazo por departamento</h3><small>días hábiles · tiene prioridad sobre la zona</small></div>' +
          '<div class="pf-dgrid">' + deps.map(function (d) { return '<div class="pf-d" data-box><b>' + esc(d) + '</b>' + stepper('data-dep="' + esc(d) + '"', c.sla_departamento[d], .5, .5, 30) + '</div>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="ot-card pf-fer2"><div class="ot-card__h"><h3>Feriados</h3><small id="pfFerCnt">' + nf(c.feriados.length) + ' cargados · no cuentan como día laboral</small></div>' +
          (adm ? '<div class="pf-add2"><input type="date" id="pfFerD"/><button class="btn btn--primary btn--sm" type="button" id="pfFerAdd">' + SV('<path d="M12 5v14M5 12h14"/>') + ' Agregar feriado</button></div>' : '') +
          '<div class="pf-fgrid" id="pfFerList">' + feriados() + '</div>' +
        '</div>' +
      '</div>' +
      (adm ? '<div class="pf-bar" id="pfBar" hidden><div class="pf-bar__in"><span>' + SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4M12 16h.01"/>') + 'Tenés cambios sin guardar</span><button type="button" class="btn" id="pfDescartar">Descartar</button><button type="button" class="btn pf-bar__ok" id="pfGuardar">Guardar cambios</button></div></div>' : '');

    // ── dibujo / animaciones ──
    function anillo(v, anim) {
      var off = CR * (1 - Math.min(v, 100) / 100);
      if (GS && anim) gsap.to('#pfRing', { attr: { 'stroke-dashoffset': off }, duration: anim === 'rapido' ? .35 : 1.1, ease: 'power2.out' });
      else q('#pfRing').setAttribute('stroke-dashoffset', off);
    }
    function pintarFranja(id, anim) {
      var row = q('#' + id); if (!row) return;
      var ins = qa('input', row), a = aMinHM(ins[0].value), b = aMinHM(ins[1].value), fill = q('.pf-tl__fill', row);
      var ok = a != null && b != null && b > a;
      row.classList.toggle('off', !ok);
      var to = { left: (ok ? a / 1440 * 100 : 0) + '%', width: (ok ? (b - a) / 1440 * 100 : 0) + '%' };
      if (GS && anim) gsap.to(fill, Object.assign({ duration: .45, ease: 'power3.out' }, to)); else { fill.style.left = to.left; fill.style.width = to.width; }
    }
    if (GS && entrada !== false) {
      gsap.from('.pf2 > *', { opacity: 0, y: 16, duration: .45, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('.pf-d', { opacity: 0, scale: .94, duration: .3, stagger: .025, delay: .25, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
      gsap.from('.pf-fd', { opacity: 0, y: 8, duration: .3, stagger: .03, delay: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('.pf-z__ico', { scale: 0, rotate: -20, duration: .5, stagger: .1, delay: .2, ease: 'back.out(2.4)', clearProps: 'transform' });
      qa('.pf-tl__fill').forEach(function (f, i) { gsap.fromTo(f, { left: f.dataset.l + '%', width: '0%' }, { width: f.dataset.w + '%', duration: .9, delay: .3 + i * .12, ease: 'power3.out' }); });
      animCount(q('#pfMetaTxt'), meta, function (v) { return Math.round(v) + '%'; }, 1.1);
      anillo(meta, true);
    } else { qa('.pf-tl__fill').forEach(function (f) { f.style.left = f.dataset.l + '%'; f.style.width = f.dataset.w + '%'; }); anillo(meta, false); }
    if (!adm) return;

    // ── edición ──
    function leer() {
      var x = JSON.parse(JSON.stringify(c));
      x.meta_otif = parseFloat(q('#pfMeta').value);
      var lvI = qa('#tlLv input'), saI = qa('#tlSa input');
      var a = [aMinHM(lvI[0].value), aMinHM(lvI[1].value)], s = [aMinHM(saI[0].value), aMinHM(saI[1].value)];
      x.calendario.dias = [null, a, a, a, a, a, (s[0] != null && s[1] != null && s[1] > s[0]) ? s : null];
      qa('[data-zona]').forEach(function (i) { var v = parseFloat(i.value); if (v > 0) x.sla_zona[i.dataset.zona] = v; });
      qa('[data-dep]').forEach(function (i) { var v = parseFloat(i.value); if (v > 0) x.sla_departamento[i.dataset.dep] = v; });
      x.feriados = c.feriados.slice().sort();
      return x;
    }
    var bar = q('#pfBar');
    function revisar() {
      var sucio = JSON.stringify(Object.assign({}, leer(), { feriados: c.feriados.slice().sort() })) !== JSON.stringify(Object.assign({}, JSON.parse(orig), { feriados: JSON.parse(orig).feriados.slice().sort() }));
      // marcar las cajas que cambiaron
      var o = JSON.parse(orig);
      qa('[data-zona]').forEach(function (i) { i.closest('[data-box]').classList.toggle('chg', parseFloat(i.value) !== +o.sla_zona[i.dataset.zona]); });
      qa('[data-dep]').forEach(function (i) { i.closest('[data-box]').classList.toggle('chg', parseFloat(i.value) !== +o.sla_departamento[i.dataset.dep]); });
      if (sucio && bar.hidden) { bar.hidden = false; if (GS) gsap.fromTo(bar, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'back.out(1.5)' }); }
      else if (!sucio && !bar.hidden) { if (GS) gsap.to(bar, { y: 80, opacity: 0, duration: .25, ease: 'power2.in', onComplete: function () { bar.hidden = true; } }); else bar.hidden = true; }
    }
    qa('.stp').forEach(function (s) {
      var inp = q('input', s);
      qa('.stp-b', s).forEach(function (b) {
        b.addEventListener('click', function () {
          var st = parseFloat(b.dataset.d), mn = parseFloat(inp.min), mx = parseFloat(inp.max);
          var v = Math.round(((parseFloat(inp.value) || 0) + st) * 10) / 10;
          inp.value = Math.max(mn, Math.min(mx, v));
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          if (GS) gsap.fromTo(inp, { scale: st > 0 ? 1.15 : .85 }, { scale: 1, duration: .35, ease: 'back.out(2.6)', clearProps: 'transform' });
        });
      });
    });
    q('#pfMeta').addEventListener('input', function () {
      var v = Math.max(50, Math.min(100, parseFloat(this.value) || 0));
      q('#pfMetaTxt').textContent = Math.round(v) + '%'; anillo(v, 'rapido');
    });
    qa('[data-tl]').forEach(function (i) { i.addEventListener('input', function () { pintarFranja(i.dataset.tl, true); }); });
    qa('.pf2 input').forEach(function (i) { i.addEventListener('input', revisar); });
    function wireFer() {
      qa('#pfFerList [data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          var card = b.closest('.pf-fd');
          var quitar = function () { c.feriados = c.feriados.filter(function (f) { return f !== b.dataset.del; }); redibujarFer(); revisar(); };
          if (GS) gsap.to(card, { opacity: 0, scale: .85, duration: .22, ease: 'power2.in', onComplete: quitar }); else quitar();
        });
      });
    }
    function redibujarFer(nuevo) {
      q('#pfFerList').innerHTML = feriados(); q('#pfFerCnt').textContent = nf(c.feriados.length) + ' cargados · no cuentan como día laboral';
      wireFer();
      if (nuevo && GS) { var n = qa('#pfFerList .pf-fd').filter(function (x) { return q('[data-del="' + nuevo + '"]', x); })[0]; if (n) gsap.fromTo(n, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.2)', clearProps: 'transform,opacity' }); }
    }
    wireFer();
    q('#pfFerAdd').addEventListener('click', function () {
      var v = q('#pfFerD').value; if (!v) { toast('Elegí una fecha', true); return; }
      if (c.feriados.indexOf(v) >= 0) { toast('Ese feriado ya está cargado', true); return; }
      c.feriados.push(v); q('#pfFerD').value = ''; redibujarFer(v); revisar();
    });
    q('#pfDescartar').addEventListener('click', function () { renderParametros(body, false); mejorarFiltros(body); toast('Cambios descartados'); });
    q('#pfGuardar').addEventListener('click', async function () {
      var btn = this, x = leer();
      if (!(x.meta_otif >= 50 && x.meta_otif <= 100)) { toast('La meta tiene que estar entre 50 y 100', true); return; }
      var a = x.calendario.dias[1];
      if (a[0] == null || a[1] == null || a[1] <= a[0]) { toast('Revisá el horario de lunes a viernes', true); return; }
      btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        var r = await DB.from('otif_config').update({ data: x, actualizado_en: new Date().toISOString(), actualizado_por: userName() }).eq('id', 1);
        if (r.error) throw r.error;
        await cargarBase(); await cargarMes();
        toast('Cambios guardados · tablero recalculado');
        renderShell();
      } catch (e) { console.error(e); toast('No se pudo guardar', true); btn.disabled = false; btn.textContent = 'Guardar cambios'; }
    });
  }


  /* ════════════════════════════════════════════════════════════
     ACTUALIZAR BASE — apartado propio (solo admin)
     Arrastrar / elegir el Excel de SAP · historial de cargas.
     ════════════════════════════════════════════════════════════ */
  function renderCargar(body, entrada) {
    q('#tbTitle').textContent = 'Actualizar datos';
    q('#tbSub').textContent = 'Cargá el reporte de pedidos de SAP tal como se exporta';
    if (!isAdmin()) { body.innerHTML = '<div class="ot-soon">' + IC.upload + '<h3>Solo administradores</h3><p>Pedile a un administrador que cargue el Excel.</p></div>'; return; }
    var f2 = function (d) { return d ? d.slice(8) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—'; };
    var hist = IMPORTS.slice(0, 8).map(function (i) {
      var d = new Date(i.cargado_en);
      return '<div class="up-h"><div class="up-h__ico">' + IC.upload + '</div><div class="up-h__t"><b>' + esc(i.archivo || 'Excel') + '</b><small>' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + (i.cargado_por ? ' · ' + esc(i.cargado_por) : '') + '</small></div>' +
        '<div class="up-h__p">' + f2(i.carga_desde) + ' → ' + f2(i.carga_hasta) + '</div><div class="up-h__n"><b>' + nf(i.pedidos) + '</b><small>' + (i.pedidos_nuevos ? nf(i.pedidos_nuevos) + ' nuevos' : 'sin nuevos') + '</small></div></div>';
    }).join('');
    body.innerHTML =
      '<div class="up-wrap">' +
        '<label class="up-drop" id="upDrop" tabindex="0" role="button" aria-label="Elegir el Excel de SAP">' +
          '<span class="up-drop__ico">' + IC.upload + '</span>' +
          '<b>Arrastrá el Excel acá</b>' +
          '<span>o tocá para elegirlo · .xlsx del reporte de pedidos de SAP</span>' +
          '<span class="btn btn--primary up-drop__btn">Elegir archivo</span>' +
        '</label>' +
        '<div class="up-rules">' +
          '<div><i>✓</i><span>Cada pedido y posición se guarda <b>una sola vez</b>: volver a subir un Excel actualiza, no duplica.</span></div>' +
          '<div><i>✓</i><span>Si el Excel <b>ya estaba cargado</b>, te avisa antes de seguir.</span></div>' +
          '<div><i>✓</i><span>Las <b>filas repetidas</b> dentro del Excel se toman una sola vez.</span></div>' +
        '</div>' +
        '<div class="ot-card up-hist"><div class="ot-card__h"><h3>Historial de cargas</h3><small>' + nf(IMPORTS.length) + ' en total</small></div>' + (hist || '<div class="ot-soon" style="padding:24px">Todavía no se cargó ningún Excel.</div>') + '</div>' +
      '</div>';
    var drop = q('#upDrop');
    drop.addEventListener('click', function (e) { e.preventDefault(); q('#fileBase').click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); q('#fileBase').click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('is-over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      if (!/\.xlsx?$/i.test(f.name)) { toast('Tiene que ser un Excel (.xlsx)', true); return; }
      subirExcel(f);
    });
    if (GS && entrada !== false) {
      gsap.from('#upDrop', { opacity: 0, y: 16, scale: .98, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('#upDrop .up-drop__ico', { scale: .6, rotate: -12, duration: .6, delay: .15, ease: 'back.out(2.2)', clearProps: 'transform' });
      gsap.from('.up-rules > div', { opacity: 0, x: -8, duration: .3, stagger: .07, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('.up-hist', { opacity: 0, y: 14, duration: .45, delay: .25, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('.up-h', { opacity: 0, y: 6, duration: .28, stagger: .04, delay: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
  }

  /* Al terminar de cargar: transición al Resumen */
  function irAlResumen() {
    VIEW = 'resumen'; setNav('resumen');
    var st = q('#stage');
    if (!GS) { renderShell(); return; }
    gsap.to(st, { opacity: 0, y: 12, filter: 'blur(6px)', duration: .28, ease: 'power2.in', onComplete: function () {
      renderShell();
      gsap.fromTo(st, { opacity: 0, y: -14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .55, ease: 'power3.out', clearProps: 'transform,opacity,filter' });
    } });
  }

  /* ── Mapa de Paraguay pintado por semáforo (Zonas) ── */
  // Escala gradual para el mapa: rojo oscuro (lejos) → naranja → ámbar → verde (en meta)
  function mapColor(p, meta) {
    if (p == null || isNaN(p)) return '#e2e8f0';
    var stops = [[meta - 45, [127, 29, 29]], [meta - 25, [220, 38, 38]], [meta - 10, [249, 115, 22]], [meta - 3, [234, 179, 8]], [meta, [22, 163, 74]]];
    if (p <= stops[0][0]) return 'rgb(' + stops[0][1] + ')';
    if (p >= meta) return 'rgb(' + stops[4][1] + ')';
    for (var i = 1; i < stops.length; i++) if (p <= stops[i][0]) {
      var a = stops[i - 1], b = stops[i], t = (p - a[0]) / (b[0] - a[0]);
      return 'rgb(' + a[1].map(function (v, j) { return Math.round(v + (b[1][j] - v) * t); }).join(',') + ')';
    }
    return 'rgb(' + stops[4][1] + ')';
  }
  function pintarMapa(deps, meta, entrada, alTocar) {
    var box = q('#znMapBox'), M = window.PY_MAPA;
    if (!box || !M) { var c0 = q('#znMap'); if (c0) c0.remove(); return null; }
    var by = {}; deps.forEach(function (d) { by[d.clave] = d; });
    var maxN = Math.max.apply(null, deps.map(function (d) { return d.evaluados; })) || 1;
    function volColor(n) {
      if (!n) return '#e2e8f0';
      var t = Math.sqrt(n / maxN), a = [207, 226, 246], b = [11, 79, 138];
      return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
    }
    function colorDe(k) { var x = by[k]; if (!x) return '#e2e8f0'; return ZN.lente === 'vol' ? volColor(x.evaluados) : mapColor(x.pOtif, meta); }
    function textoDe(k) { var x = by[k]; if (!x) return ''; return ZN.lente === 'vol' ? nf(x.evaluados) : Math.round(x.pOtif) + '%'; }
    // Etiquetas: una por departamento con datos (el Chaco, una sola sobre Pdte. Hayes)
    var etiquetas = [], vistos = {};
    M.deptos.forEach(function (d) {
      if (!by[d.k] || vistos[d.k]) return;
      if (d.k === 'Chaco' && d.n !== 'Presidente Hayes') return;
      vistos[d.k] = 1;
      etiquetas.push({ k: d.k, x: d.k === 'Asuncion' ? d.cx - 30 : d.cx, y: d.k === 'Asuncion' ? d.cy - 26 : d.cy + 8, a: d.k === 'Asuncion' ? 'end' : 'middle' });
    });
    var asu = M.deptos.filter(function (d) { return d.k === 'Asuncion'; })[0];
    box.innerHTML = '<svg viewBox="-10 -10 ' + (M.w + 20) + ' ' + (M.h + 20) + '" role="img" aria-label="Mapa de cumplimiento por departamento">' +
      '<defs><filter id="pmSh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#0f172a" flood-opacity=".28"/></filter></defs>' +
      '<g class="pm-g">' + M.deptos.map(function (d) {
        return '<path class="pm-d' + (by[d.k] ? ' has' : '') + '" data-k="' + esc(d.k) + '" d="' + d.d + '" fill="#e2e8f0"/>';
      }).join('') +
      (asu ? '<circle class="pm-d pm-asu' + (by.Asuncion ? ' has' : '') + '" data-k="Asuncion" cx="' + asu.cx + '" cy="' + asu.cy + '" r="15" fill="#e2e8f0"/>' : '') + '</g>' +
      '<g class="pm-o"></g>' +
      '<g class="pm-l">' + etiquetas.map(function (e) { return '<text class="pm-t" data-k="' + esc(e.k) + '" x="' + e.x + '" y="' + e.y + '" text-anchor="' + e.a + '">' + textoDe(e.k) + '</text>'; }).join('') + '</g>' +
      '</svg>';
    var svg = q('svg', box), det = q('#znDet');
    var orden = deps.slice().sort(function (a, b) { return b.faltan - a.faltan || b.evaluados - a.evaluados; });
    var sel = ZN.sel && by[ZN.sel] ? ZN.sel : (orden[0] ? orden[0].clave : null);

    function leyenda() {
      var lg = q('#znMapLeg'); if (!lg) return;
      lg.innerHTML = ZN.lente === 'vol'
        ? '<span style="background:linear-gradient(90deg,' + volColor(1) + ',' + volColor(maxN) + ')"></span><div><small>Pocos pedidos</small><small>Muchos pedidos</small></div>'
        : '<span style="background:linear-gradient(90deg,' + [meta - 45, meta - 25, meta - 10, meta - 3, meta].map(function (v) { return mapColor(v, meta); }).join(',') + ')"></span><div><small>' + pf(meta - 45, 0) + ' o menos</small><small>Meta ' + pf(meta, 0) + '</small></div>';
    }
    var fichaK = null, fichaSel = null;
    function ficha(k, esSel, suave) {
      var x = by[k]; if (!det || !x) return;
      if (fichaK === k && fichaSel === !!esSel) return;
      fichaK = k; fichaSel = !!esSel;
      var nombre = k === 'Chaco' ? 'Chaco' : (M.deptos.filter(function (d) { return d.k === k; })[0] || {}).n || k;
      var col = mapColor(x.pOtif, meta), mayor = orden[0] && orden[0].clave === k;
      det.innerHTML =
        '<div class="md-n"><i style="background:' + col + '"></i><div><b>' + esc(nombre) + '</b><small>' + (esSel && mayor ? 'Donde más se puede mejorar' : esc(x.zona || '')) + '</small></div></div>' +
        '<div class="md-k"><b style="color:' + col + '" id="mdPct">' + pf(x.pOtif) + '</b><small>en tiempo y forma</small></div>' +
        '<div class="md-s"><b>' + nf(x.evaluados) + '</b><small>pedidos</small></div>' +
        '<div class="md-s"><b>' + (x.faltan ? nf(x.faltan) : '✓') + '</b><small>' + (x.faltan ? 'faltan p/ ' + pf(meta, 0) : 'en meta') + '</small></div>' +
        '<div class="md-s"><b>' + tiempo(x.cicloMed, true) + '</b><small>tiempo habitual</small></div>';
      if (GS) {
        if (suave) gsap.fromTo(det.children, { opacity: .35 }, { opacity: 1, duration: .18, ease: 'power1.out', clearProps: 'opacity' });
        else {
          gsap.fromTo(det.children, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .28, stagger: .035, ease: 'power2.out', clearProps: 'transform,opacity' });
          animCount(q('#mdPct'), x.pOtif, function (v) { return pf(v); }, .55);
        }
      }
    }
    function foco(k, apagar) {
      svg.classList.toggle('foco', !!k && apagar !== false);
      qa('.pm-d', svg).forEach(function (p) { p.classList.toggle('on', p.dataset.k === k); });
      var capa = q('.pm-o', svg);
      capa.innerHTML = k ? qa('.pm-d[data-k="' + k + '"]', svg).map(function (p) { var c = p.cloneNode(false); c.removeAttribute('data-k'); c.setAttribute('class', 'pm-hl'); c.setAttribute('fill', 'none'); return c.outerHTML; }).join('') : '';
      qa('.pm-t', svg).forEach(function (t) { t.classList.toggle('on', t.dataset.k === k); });
      qa('#znRows .zn-row[data-dep]').forEach(function (r) { r.classList.toggle('hl', r.dataset.dep === k); });
    }
    function volver() { foco(sel, false); ficha(sel, true); }   // seleccionado: solo borde, sin apagar al resto

    var card = q('#znMap'), tip = el('<div class="pm-tip" hidden><b></b><span></span><em class="st-meta"></em></div>');
    card.appendChild(tip);
    var tipX = GS ? gsap.quickTo(tip, 'left', { duration: .25, ease: 'power3.out', modifiers: { left: function (v) { return Math.round(parseFloat(v)) + 'px'; } } }) : null, tipY = GS ? gsap.quickTo(tip, 'top', { duration: .25, ease: 'power3.out', modifiers: { top: function (v) { return Math.round(parseFloat(v)) + 'px'; } } }) : null;
    var tSalir = null, actual = null;
    function entrar(k) {
      clearTimeout(tSalir);
      if (actual === k) return;
      actual = k; foco(k); ficha(k, false, true);
      var x = by[k], nombre = k === 'Chaco' ? 'Chaco' : (M.deptos.filter(function (d) { return d.k === k; })[0] || {}).n || k;
      q('b', tip).textContent = nombre;
      q('span', tip).textContent = ZN.lente === 'vol' ? nf(x.evaluados) + ' pedidos' : pf(x.pOtif);
      var stT = estadoMeta(x.pOtif, meta), emT = q('em', tip); emT.className = 'st-meta ' + stT.c; emT.innerHTML = '<i></i>' + (ZN.lente === 'vol' ? pf(x.pOtif) + ' a tiempo y completo' : stT.t);
      if (tip.hidden) { tip.hidden = false; if (GS) gsap.fromTo(tip, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .18, ease: 'power2.out', clearProps: 'transform' }); }
    }
    function salir() {
      clearTimeout(tSalir);
      tSalir = setTimeout(function () { actual = null; volver(); if (GS) gsap.to(tip, { opacity: 0, duration: .15, onComplete: function () { tip.hidden = true; } }); else tip.hidden = true; }, 120);
    }
    box.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect(), tw = tip.offsetWidth || 180, th = tip.offsetHeight || 80, cx = e.clientX - r.left, cy = e.clientY - r.top;
      var x = cx + 16 + tw > r.width - 8 ? cx - tw - 16 : cx + 16, y = cy + 16 + th > r.height - 8 ? cy - th - 16 : cy + 16;
      x = Math.max(8, x); y = Math.max(8, y);
      x = Math.round(x); y = Math.round(y); if (tipX) { tipX(x); tipY(y); } else { tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
    });
    qa('.pm-d', svg).forEach(function (el2) {
      var k = el2.dataset.k;
      el2.addEventListener('mouseenter', function () { if (by[k]) entrar(k); });
      el2.addEventListener('mouseleave', salir);
      var el = el2;
      if (by[k]) el.addEventListener('click', function () {
        sel = ZN.sel = k; volver();
        if (GS) gsap.fromTo(qa('.pm-d[data-k="' + k + '"]', svg), { scale: 1 }, { scale: 1.035, transformOrigin: '50% 50%', duration: .16, yoyo: true, repeat: 1, ease: 'power1.inOut', clearProps: 'transform' });
        alTocar(k);
      });
    });
    // Lente: Cumplimiento / Volumen
    qa('#znLente button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l === (ZN.lente || 'cumpl'));
      b.addEventListener('click', function () {
        if ((ZN.lente || 'cumpl') === b.dataset.l) return;
        ZN.lente = b.dataset.l;
        qa('#znLente button').forEach(function (x) { x.classList.toggle('on', x === b); });
        qa('.pm-d', svg).forEach(function (p, i) { var c = colorDe(p.dataset.k); if (GS) gsap.to(p, { attr: { fill: c }, duration: .55, delay: i * .015, ease: 'power2.inOut' }); else p.setAttribute('fill', c); });
        qa('.pm-t', svg).forEach(function (t) {
          if (!GS) { t.textContent = textoDe(t.dataset.k); return; }
          gsap.to(t, { opacity: 0, duration: .15, onComplete: function () { t.textContent = textoDe(t.dataset.k); gsap.to(t, { opacity: 1, duration: .25 }); } });
        });
        leyenda();
      });
    });
    leyenda();

    // Entrada: los departamentos se pintan del peor al mejor
    var pathsPorK = {}; qa('.pm-d', svg).forEach(function (p) { (pathsPorK[p.dataset.k] = pathsPorK[p.dataset.k] || []).push(p); });
    var orden2 = deps.slice().sort(function (a, b) { return a.pOtif - b.pOtif; }).map(function (d) { return d.clave; });
    qa('.pm-d:not(.has)', svg).forEach(function (p) { p.setAttribute('fill', '#e2e8f0'); });
    if (GS && entrada !== false) {
      gsap.from(svg, { opacity: 0, scale: .96, transformOrigin: '50% 50%', duration: .5, ease: 'power2.out', clearProps: 'transform,opacity' });
      orden2.forEach(function (k, i) { (pathsPorK[k] || []).forEach(function (p) { gsap.to(p, { attr: { fill: colorDe(k) }, duration: .45, delay: .25 + i * .07, ease: 'power2.out' }); }); });
      gsap.from(qa('.pm-t', svg), { opacity: 0, y: 6, duration: .35, stagger: .03, delay: .35 + orden2.length * .07, ease: 'power2.out', clearProps: 'transform,opacity' });
    } else {
      qa('.pm-d', svg).forEach(function (p) { p.setAttribute('fill', colorDe(p.dataset.k)); });
    }
    setTimeout(volver, GS && entrada !== false ? 350 + orden2.length * 70 : 0);
    return {
      foco: function (k) {
        clearTimeout(tSalir);
        if (k) { actual = k; foco(k); ficha(k, false, true); }
        else tSalir = setTimeout(function () { actual = null; volver(); }, 120);
      }
    };
  }

  /* ════════════════════════════════════════════════════════════
     APARTADO DE CADA KPI — se entra desde el chip "Ver pedidos" de
     las tarjetas del Resumen. Pestañas + buscador + lista + Volver.
     ════════════════════════════════════════════════════════════ */
  var KPI = { k: 'ot', tab: null, q: '', limit: 150 };
  var KPIS = {
    ot: { t: 'A tiempo', c: '#0B5F8D', ico: 'clock', d: 'Pedidos entregados dentro del plazo pactado',
      pct: function (g) { return g.pOt; }, val: function (g) { return pf(g.pOt); }, sub: function (g) { return nf(g.ot) + ' de ' + nf(g.evaluados) + ' pedidos'; },
      tabs: [['si', 'A tiempo', function (o) { return o.estado === 'evaluado' && o.ot; }], ['no', 'Fuera de plazo', function (o) { return o.estado === 'evaluado' && !o.ot; }]] },
    inf: { t: 'Completos', c: '#16a34a', ico: 'check', d: 'Pedidos entregados sin faltantes',
      pct: function (g) { return g.pIn; }, val: function (g) { return pf(g.pIn); }, sub: function (g) { return nf(g.inf) + ' de ' + nf(g.evaluados) + ' pedidos'; },
      tabs: [['si', 'Completos', function (o) { return o.estado === 'evaluado' && o.inf; }], ['no', 'Con faltantes', function (o) { return o.estado === 'evaluado' && !o.inf; }]] },
    sc: { t: 'Entregas sin cerrar', c: '#d97706', ico: 'truck', d: 'Salieron del depósito y falta registrar la entrega en SAP',
      pct: function (g) { return g.total ? g.sin_registro / g.total * 100 : 0; }, val: function (g) { return nf(g.sin_registro); }, sub: function (g) { return 'pedidos · ' + pf(g.total ? g.sin_registro / g.total * 100 : null) + ' del total'; },
      tabs: [['todos', 'Todas', function (o) { return o.estado === 'sin_registro'; }], ['chofer', 'En chofer (04)', function (o) { return o.estado === 'sin_registro' && o.p.ult_etapa === 4; }], ['parcial', 'Entrega parcial', function (o) { return o.estado === 'sin_registro' && o.p.n_entregadas > 0; }]] },
    sd: { t: 'Sin despachar', c: '#dc2626', ico: 'box', d: 'Pedidos que nunca salieron del depósito',
      pct: function (g) { return g.total ? g.sin_despacho / g.total * 100 : 0; }, val: function (g) { return nf(g.sin_despacho); }, sub: function (g) { return 'pedidos · ' + pf(g.total ? g.sin_despacho / g.total * 100 : null) + ' del total'; },
      tabs: [['todos', 'Todos', function (o) { return o.estado === 'sin_despacho'; }]] }
  };
  var KPI_ICO = {
    clock: SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    check: SV('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
    truck: STG_ICO.tra,
    box: SV('<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M9 10l6 6M15 10l-6 6"/>')
  };
  var IC_BACK = SV('<path d="M15 18l-6-6 6-6"/>');

  function wireEtapas(root, desde) {
    qa('[data-etapa]', root).forEach(function (n) {
      var go = function () { abrirKpi('etapa', n.dataset.etapa, desde); };
      n.addEventListener('click', go);
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }
  // Apartado de una etapa: sus pedidos, del más demorado al más rápido
  function defEtapa(g, k) {
    var t = TRAMOS.filter(function (x) { return x[0] === k; })[0] || TRAMOS[0];
    var tMax = null; TRAMOS.forEach(function (x) { var v = g.tramosMed[x[0]]; if (v != null && (tMax == null || v > g.tramosMed[tMax])) tMax = x[0]; });
    var med = g.tramosMed[t[0]], n = (g.tramos[t[0]] || []).length;
    return { t: t[1], lbl: t[1] + (t[0] === tMax ? ' · cuello de botella' : ''), c: t[0] === tMax ? '#dc2626' : '#0B5F8D', icoHtml: STG_ICO[t[0]], etapa: t[0], med: med,
      d: 'De ' + t[2] + '. Ordenado del más demorado al más rápido.',
      pct: function () { return null; }, val: function () { return tiempo(med); }, sub: function () { return 'tiempo habitual · ' + nf(n) + ' pedidos pasaron por esta etapa'; },
      tabs: TRAMOS.map(function (x) { return [x[0], x[1], function (o) { return o.tramos && o.tramos[x[0]] != null; }]; }) };
  }
  function abrirKpi(k, tab, desde) {
    KPI.k = k; KPI.tab = tab || null; KPI.q = ''; KPI.limit = 150; KPI.from = desde || 'resumen';
    var body = q('#otBody');
    VIEW = 'kpi';
    if (!GS || !body) { renderPagina(true); return; }
    gsap.to(body, { opacity: 0, x: -28, duration: .22, ease: 'power2.in', onComplete: function () {
      q('#stage').scrollTop = 0; renderPagina(true);
      gsap.fromTo(body, { opacity: 0, x: 36 }, { opacity: 1, x: 0, duration: .42, ease: 'power3.out', clearProps: 'transform,opacity' });
    } });
  }
  function volverDeKpi() {
    var body = q('#otBody');
    VIEW = KPI.from || 'resumen'; setNav(VIEW);
    if (!GS || !body) { renderPagina(true); return; }
    gsap.to(body, { opacity: 0, x: 28, duration: .22, ease: 'power2.in', onComplete: function () {
      q('#stage').scrollTop = 0; renderPagina(true);
      gsap.fromTo(body, { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: .42, ease: 'power3.out', clearProps: 'transform,opacity' });
    } });
  }

  function renderKpi(body, entrada) {
    var evs = EVS.filter(enScope), g = CALC.resumen(evs), meta = +CFG.meta_otif || 85, ES = KPI.k === 'etapa';
    if (ES && !KPI.tab) KPI.tab = 'rep';
    var def = ES ? defEtapa(g, KPI.tab) : (KPIS[KPI.k] || KPIS.ot);
    if (!KPI.tab) KPI.tab = def.tabs[def.tabs.length > 1 && (KPI.k === 'ot' || KPI.k === 'inf') ? 1 : 0][0];   // de entrada: lo que hay que mirar (fuera de plazo / con faltantes)
    q('#tbTitle').textContent = def.t;
    q('#tbTitle').textContent = ES ? 'Pedidos por etapa' : def.t;
    q('#tbSub').textContent = (ES ? 'Tiempo de cada pedido en la etapa · ' : 'Pedidos del indicador · ') + mesLbl(CUR) + ' · ' + ({ tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE]);
    var conteo = def.tabs.map(function (t) { return evs.filter(t[2]).length; });
    body.innerHTML =
      '<div class="kp">' +
        '<div class="kp-head" style="--c:' + def.c + '">' +
          '<button type="button" class="kp-back" id="kpBack">' + IC_BACK + '<span>Volver</span></button><span class="kp-sep"></span>' +
          '<div class="kp-ico" id="kpIco">' + (def.icoHtml || KPI_ICO[def.ico]) + '</div>' +
          '<div class="kp-v"><span id="kpLbl">' + esc(def.lbl || def.t) + '</span><b id="kpVal">' + def.val(g) + '</b></div>' +
          '<div class="kp-meter' + (ES ? ' no-t' : '') + '">' + (ES ? '' : '<div class="kp-meter__t"><i data-w="' + Math.max(0, Math.min(100, def.pct(g) || 0)).toFixed(1) + '"></i></div>') + '<small id="kpSub">' + esc(def.sub(g)) + '</small></div>' +
          '<p class="kp-d" id="kpD">' + esc(def.d) + '</p>' +
        '</div>' +
        '<div class="ot-card kp-card">' +
          '<div class="kp-bar">' +
            (def.tabs.length > 1 ? '<div class="zn-sort kp-tabs' + (ES ? ' kp-tabs--et' : '') + '" id="kpTabs">' + def.tabs.map(function (t, i) { return '<button type="button" data-t="' + t[0] + '"' + (KPI.tab === t[0] ? ' class="on"' : '') + '>' + esc(t[1]) + '<em>' + nf(conteo[i]) + '</em></button>'; }).join('') + '</div>' : '') +
            '<div class="ot-search kp-q"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="kpQ" placeholder="Buscar pedido, cliente o vendedor…" value="' + esc(KPI.q) + '"/></div>' +
            '<button class="btn btn--sm btn--primary" type="button" id="kpExport">' + IC.upload.replace('M17 8l-5-5-5 5M12 3v12', 'M7 10l5 5 5-5M12 15V3') + ' Excel</button>' +
          '</div>' +
          '<div class="det-tblwrap kp-tbl" id="kpTabla"></div>' +
        '</div>' +
      '</div>';
    function lista() {
      var tab = def.tabs.filter(function (t) { return t[0] === KPI.tab; })[0] || def.tabs[0], tq = KPI.q.toLowerCase().trim();
      return evs.filter(tab[2]).filter(function (o) { return !tq || [o.p.doc_vtas, o.p.cliente_nombre, o.p.vendedor_nombre, o.p.region_nombre].join(' ').toLowerCase().indexOf(tq) >= 0; })
        .sort(ES ? function (a, b) { return b.tramos[def.etapa] - a.tramos[def.etapa]; } : function (a, b) { return (b.ciclo == null ? -1 : b.ciclo - b.sla) - (a.ciclo == null ? -1 : a.ciclo - a.sla) || (a.p.fecha_carga < b.p.fecha_carga ? -1 : 1); });
    }
    function pintar(animar) {
      var f = lista(), vis = f.slice(0, KPI.limit);
      EXPORT_DET = f;
      q('#kpTabla').innerHTML = !f.length ? '<div class="ot-soon" style="padding:50px">No hay pedidos en esta pestaña.</div>' :
        '<table class="ot-tbl det-tbl"><thead><tr><th>Pedido</th><th>Carga</th><th>Cliente</th><th>Vendedor</th><th>Destino</th><th class="r">' + (ES ? 'En esta etapa' : 'Artículos') + '</th><th class="r">Tiempo / plazo</th><th>Estado</th></tr></thead><tbody>' +
        vis.map(function (o) {
          var tE = ES ? o.tramos[def.etapa] : null, mE = def.med || 0;
          var p = o.p, tarde = o.ciclo != null && o.ciclo > o.sla;
          return '<tr data-doc="' + esc(p.doc_vtas) + '" tabindex="0"><td class="b">' + esc(p.doc_vtas) + '</td><td>' + fechaHora(p.fecha_carga) + '</td>' +
            '<td class="cli" title="' + esc(p.cliente_nombre) + '">' + esc(p.cliente_nombre || p.cliente_cod || '—') + '</td><td class="ven">' + esc(p.vendedor_nombre || '—') + '</td>' +
            '<td class="des">' + esc(p.region_nombre || p.departamento) + '<small>' + esc(p.departamento) + '</small></td>' +
            (ES ? '<td class="r"><span class="et-t ' + (tE > mE * 2 ? 'bad' : tE > mE ? 'warn' : 'ok') + '">' + tiempo(tE, true) + '</span></td>'
                : '<td class="r' + (p.n_completas < p.n_lineas ? ' warnt' : '') + '">' + nf(p.n_completas) + '/' + nf(p.n_lineas) + '</td>') +
            '<td class="r"><b class="' + (tarde ? 'badt' : '') + '">' + (o.ciclo == null ? '—' : tiempo(o.ciclo, true)) + '</b><small> de ' + plazo(o.sla) + '</small></td>' +
            '<td>' + estadoChip(o) + '</td></tr>';
        }).join('') + '</tbody></table>' +
        (f.length > vis.length ? '<div class="det-more"><button class="btn btn--sm" type="button" id="kpMas">Mostrar más</button><span>' + nf(vis.length) + ' de ' + nf(f.length) + '</span></div>' : '<div class="det-more"><span>' + nf(f.length) + ' pedidos</span></div>');
      qa('#kpTabla tbody tr').forEach(function (tr) {
        var go = function () { var o = f.filter(function (x) { return x.p.doc_vtas === tr.dataset.doc; })[0]; if (o) abrirPedido(o); };
        tr.addEventListener('click', go); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      });
      var m = q('#kpMas'); if (m) m.addEventListener('click', function () { KPI.limit += 150; pintar(false); });
      if (GS && animar !== false) gsap.from(qa('#kpTabla tbody tr').slice(0, 20), { opacity: 0, y: 8, duration: .28, stagger: .02, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    q('#kpBack').addEventListener('click', volverDeKpi);
    var mt = q('.kp-meter__t i'); if (mt) { if (GS) gsap.fromTo(mt, { width: '0%' }, { width: mt.dataset.w + '%', duration: 1, delay: .25, ease: 'power3.out' }); else mt.style.width = mt.dataset.w + '%'; }
    if (GS && !ES) { var kv = q('#kpVal'), pv = def.pct(g); if (kv && (KPI.k === 'ot' || KPI.k === 'inf')) animCount(kv, pv, function (v) { return pf(v); }, .9); else if (kv) { var nv = KPI.k === 'sc' ? g.sin_registro : g.sin_despacho; animCount(kv, nv, function (v) { return nf(v); }, .9); } }
    qa('#kpTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (KPI.tab === b.dataset.t) return;
        KPI.tab = b.dataset.t; KPI.limit = 150;
        qa('#kpTabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (ES) {
          def = defEtapa(g, KPI.tab);
          var head = q('.kp-head'), cambiar = function () {
            head.style.setProperty('--c', def.c);
            q('#kpIco').innerHTML = def.icoHtml; q('#kpLbl').textContent = def.lbl; q('#kpVal').textContent = def.val(g); q('#kpSub').textContent = def.sub(g); q('#kpD').textContent = def.d;
          };
          if (GS) {
            gsap.to('#kpIco, .kp-v, .kp-meter, .kp-d', { opacity: 0, y: -6, duration: .14, ease: 'power1.in', onComplete: function () {
              cambiar();
              gsap.fromTo('#kpIco', { scale: .4, rotate: -20 }, { scale: 1, rotate: 0, opacity: 1, y: 0, duration: .45, ease: 'back.out(2.4)', clearProps: 'transform,opacity' });
              gsap.fromTo('.kp-v, .kp-meter, .kp-d', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .28, stagger: .04, ease: 'power2.out', clearProps: 'transform,opacity' });
            } });
          } else cambiar();
        }
        if (GS) gsap.to('#kpTabla', { opacity: 0, y: 6, duration: .14, ease: 'power1.in', onComplete: function () { pintar(true); gsap.to('#kpTabla', { opacity: 1, y: 0, duration: .25, clearProps: 'transform,opacity' }); } });
        else pintar(true);
      });
    });
    var tmr; q('#kpQ').addEventListener('input', function (e) { clearTimeout(tmr); tmr = setTimeout(function () { KPI.q = e.target.value; KPI.limit = 150; pintar(false); }, 180); });
    q('#kpExport').addEventListener('click', exportarDetalle);
    pintar(entrada);
    if (GS && entrada !== false) {
      gsap.from('.kp-head', { opacity: 0, y: 12, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('.kp-head > *', { opacity: 0, x: -10, duration: .35, stagger: .05, delay: .08, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('.kp-ico', { scale: 0, rotate: -25, duration: .55, delay: .15, ease: 'back.out(2.4)', clearProps: 'transform' });
      gsap.from('.kp-card', { opacity: 0, y: 16, duration: .45, delay: .12, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('#kpTabs button', { opacity: 0, y: -6, duration: .3, stagger: .05, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
  }

  /* ════════════════════════════════════════════════════════════
     MODAL "Configuración del horario" (reemplaza el texto
     "1 día = jornada laboral…"). Admin edita; el resto solo ve.
     ════════════════════════════════════════════════════════════ */
  function btnConfigHorario() {
    return '<button type="button" class="cfg-btn" data-cfg-horario>' + SV('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>') + '<span class="cfg-t"><b>Configuración del horario</b><small>' + esc(horarioTxt()) + '</small></span><span class="cfg-arr">' + SV('<path d="M9 6l6 6-6 6"/>') + '</span></button>';
  }
  function wireConfigHorario(root) { qa('[data-cfg-horario]', root || document).forEach(function (b) { b.addEventListener('click', abrirConfigHorario); }); }
  function abrirConfigHorario() {
    var adm = isAdmin(), dias = (CFG.calendario && CFG.calendario.dias) || [], lv = dias[1] || [435, 1020], sa = dias[6];
    var hm = function (m) { return m == null ? '' : pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
    var aMinHM = function (s) { var p = String(s || '').split(':'); return p.length === 2 && p[0] !== '' ? (+p[0]) * 60 + (+p[1]) : null; };
    var dis = adm ? '' : ' disabled';
    var bd = el('<div class="modal-bd open cfg-modal"><div class="modal-box">' +
      '<div class="cfg-hd"><div class="cfg-hd__ico">' + SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>') + '</div><div><h3>Horario laboral</h3><p>Los tiempos se cuentan solo dentro de este horario. Una jornada completa equivale a <b>1 día</b>.</p></div>' +
        '<button class="modal-x" type="button" aria-label="Cerrar"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="cfg-body">' +
        '<div class="cfg-row"><div><b>Lunes a viernes</b><small>jornada principal</small></div><input type="time" id="cfgLvI" value="' + hm(lv[0]) + '"' + dis + '/><i>a</i><input type="time" id="cfgLvF" value="' + hm(lv[1]) + '"' + dis + '/></div>' +
        '<div class="cfg-row"><div><b>Sábado</b><small>dejá vacío si no se trabaja</small></div><input type="time" id="cfgSaI" value="' + hm(sa && sa[0]) + '"' + dis + '/><i>a</i><input type="time" id="cfgSaF" value="' + hm(sa && sa[1]) + '"' + dis + '/></div>' +
        '<div class="cfg-row cfg-row--muted"><div><b>Domingo y feriados</b><small>' + nf((CFG.feriados || []).length) + ' feriados cargados</small></div><span class="cfg-tag">No laborable</span></div>' +
        (adm ? '' : '<div class="cfg-note">Solo un administrador puede modificar el horario.</div>') +
      '</div>' +
      '<div class="cfg-ft"><button class="btn" type="button" data-fer>Editar feriados</button><span></span>' +
        (adm ? '<button class="btn" type="button" data-x>Cancelar</button><button class="btn btn--primary" type="button" data-ok>Guardar</button>' : '<button class="btn btn--primary" type="button" data-x>Entendido</button>') +
      '</div></div></div>');
    document.body.appendChild(bd);
    var box = q('.modal-box', bd);
    function cerrar(cb) {
      if (!GS) { bd.remove(); if (cb) cb(); return; }
      gsap.to(box, { opacity: 0, y: 14, scale: .96, duration: .2, ease: 'power2.in' });
      gsap.to(bd, { opacity: 0, duration: .24, delay: .04, onComplete: function () { bd.remove(); if (cb) cb(); } });
    }
    if (GS) {
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: .22 });
      gsap.fromTo(box, { opacity: 0, y: 24, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
      gsap.from(qa('.cfg-row', bd), { opacity: 0, x: -10, duration: .3, stagger: .06, delay: .15, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from(q('.cfg-hd__ico', bd), { scale: 0, rotate: -30, duration: .5, delay: .1, ease: 'back.out(2.4)', clearProps: 'transform' });
    }
    q('.modal-x', bd).addEventListener('click', function () { cerrar(); });
    bd.addEventListener('click', function (e) { if (e.target === bd) cerrar(); });
    qa('[data-x]', bd).forEach(function (b) { b.addEventListener('click', function () { cerrar(); }); });
    q('[data-fer]', bd).addEventListener('click', function () { cerrar(function () { ir('parametros'); }); });
    var ok = q('[data-ok]', bd);
    if (ok) ok.addEventListener('click', async function () {
      var a = [aMinHM(q('#cfgLvI', bd).value), aMinHM(q('#cfgLvF', bd).value)], s = [aMinHM(q('#cfgSaI', bd).value), aMinHM(q('#cfgSaF', bd).value)];
      if (a[0] == null || a[1] == null || a[1] <= a[0]) { toast('Revisá el horario de lunes a viernes', true); return; }
      var c = JSON.parse(JSON.stringify(CFG));
      c.calendario = c.calendario || {};
      c.calendario.dias = [null, a, a, a, a, a, (s[0] != null && s[1] != null && s[1] > s[0]) ? s : null];
      ok.disabled = true; ok.textContent = 'Guardando…';
      try {
        var r = await DB.from('otif_config').update({ data: c, actualizado_en: new Date().toISOString(), actualizado_por: userName() }).eq('id', 1);
        if (r.error) throw r.error;
        await cargarBase(); await cargarMes();
        cerrar(function () { toast('Horario guardado · tiempos recalculados'); renderShell(); });
      } catch (e) { console.error(e); toast('No se pudo guardar', true); ok.disabled = false; ok.textContent = 'Guardar'; }
    });
  }

  /* ════════════════════════════════════════════════════════════
     MODAL "¿Quiénes vendieron aquí?" — vendedores de un departamento
     o ciudad, con participación y % en tiempo y forma.
     ════════════════════════════════════════════════════════════ */
  function tCase(s) { return String(s == null ? '' : s).toLowerCase().replace(/(^|[\s\-.(\/])([a-záéíóúñü])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function iniciales(n) { var p = String(n || '?').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, ' ').split(/\s+/).filter(Boolean); return ((p[0] || '?')[0] + ((p[1] || '')[0] || '')).toUpperCase(); }
  function abrirVendedores(tit, sub, lista, filtro) {
    var meta = +CFG.meta_otif || 85, g = CALC.resumen(lista), VQ = '';
    var vs = CALC.agrupar(lista, function (p) { return p.vendedor_nombre || p.vendedor_cod; }).filter(function (v) { return v.total; })
      .sort(function (a, b) { return b.total - a.total || (b.pOtif || 0) - (a.pOtif || 0); });
    var est = estadoMeta(g.pOtif, meta), X = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    var bd = el('<div class="modal-bd open vz-modal"><div class="modal-box">' +
      '<div class="vz-hd">' +
        '<div class="vz-ico">' + SV(filtro.city ? '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>' : '<path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>') + '</div>' +
        '<div class="vz-t"><span>¿Quiénes vendieron en…?</span><h3>' + esc(tit) + '</h3><small>' + esc(sub) + ' · ' + esc(mesLbl(CUR)) + '</small></div>' +
        '<div class="vz-ks">' +
          '<div class="vz-k"><b id="vzP">' + pf(g.pOtif) + '</b><span>en tiempo y forma</span><em class="st-meta ' + est.c + '"><i></i>' + esc(est.t) + '</em></div>' +
          '<div class="vz-k"><b>' + nf(g.total) + '</b><span>pedidos</span></div>' +
          '<div class="vz-k"><b>' + nf(vs.length) + '</b><span>vendedores</span></div>' +
        '</div>' +
        '<button class="modal-x vz-x" type="button" aria-label="Cerrar">' + X + '</button>' +
      '</div>' +
      '<div class="vz-bar"><div class="ot-search vz-q"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" placeholder="Buscar vendedor…"/></div>' +
        '<span class="vz-hint">' + SV('<path d="M9 6l6 6-6 6"/>') + 'Tocá un vendedor para ver sus pedidos</span></div>' +
      '<div class="vz-body"><table class="ot-tbl vz-tbl"><thead><tr><th class="c">#</th><th>Vendedor</th><th class="r">Pedidos</th><th>Participación</th><th>En tiempo y forma</th><th class="r">A tiempo</th><th class="r">Completos</th></tr></thead><tbody></tbody></table></div>' +
    '</div></div>');
    document.body.appendChild(bd);
    var box = q('.modal-box', bd), tb = q('tbody', bd);
    function pintar(animar) {
      var tq = VQ.toLowerCase().trim(), f = vs.filter(function (v) { return !tq || String(v.clave).toLowerCase().indexOf(tq) >= 0; });
      tb.innerHTML = !f.length ? '<tr><td colspan="7" class="vz-empty">Ningún vendedor coincide con la búsqueda.</td></tr>' : f.map(function (v) {
        var rk = vs.indexOf(v) + 1, part = g.total ? v.total / g.total * 100 : 0, c = semColor(v.pOtif);
        return '<tr data-v="' + esc(v.clave) + '" tabindex="0">' +
          '<td class="c"><span class="vz-rk' + (rk <= 3 ? ' top' : '') + '">' + rk + '</span></td>' +
          '<td><div class="vz-v"><span class="vz-av">' + esc(iniciales(v.clave)) + '</span><b>' + esc(v.clave) + '</b></div></td>' +
          '<td class="r b">' + nf(v.total) + '</td>' +
          '<td><div class="vz-cell"><div class="vz-b"><i class="part" data-w="' + part.toFixed(1) + '"></i></div><span>' + pf(part) + '</span></div></td>' +
          '<td><div class="vz-cell"><div class="vz-b"><i data-w="' + Math.min(100, v.pOtif || 0).toFixed(1) + '" style="background:' + c + '"></i><em style="left:' + meta + '%"></em></div><span style="color:' + c + '">' + (v.evaluados ? pf(v.pOtif) : '—') + '</span></div></td>' +
          '<td class="r">' + (v.evaluados ? pf(v.pOt) : '—') + '</td><td class="r">' + (v.evaluados ? pf(v.pIn) : '—') + '</td></tr>';
      }).join('');
      var bars = qa('.vz-b i', tb), vis = bars.slice(0, 24);
      crecer(bars.slice(24), { anim: false });
      crecer(vis, { anim: animar !== false, delay: .3, stagger: .012 });
      if (GS && animar !== false) gsap.from(qa('tr', tb).slice(0, 12), { opacity: 0, y: 8, duration: .32, stagger: .03, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
      qa('tr[data-v]', tb).forEach(function (tr) {
        var go = function () {
          cerrar(function () {
            DET.q = filtro.city || ''; DET.estado = ''; DET.zona = ''; DET.cond = ''; DET.depto = filtro.dep || ''; DET.vend = tr.dataset.v; DET.limit = 200;
            ir('detalle');
          });
        };
        tr.addEventListener('click', go); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      });
    }
    function cerrar(cb) {
      if (!GS) { bd.remove(); if (cb) cb(); return; }
      gsap.to(box, { opacity: 0, y: 16, scale: .96, duration: .2, ease: 'power2.in' });
      gsap.to(bd, { opacity: 0, duration: .24, delay: .04, onComplete: function () { bd.remove(); if (cb) cb(); } });
    }
    q('.vz-x', bd).addEventListener('click', function () { cerrar(); });   // solo se sale con la X
    var tmr; q('.vz-q input', bd).addEventListener('input', function (e) { clearTimeout(tmr); tmr = setTimeout(function () { VQ = e.target.value; pintar(false); }, 150); });
    pintar(true);
    if (GS) {
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: .22 });
      gsap.fromTo(box, { opacity: 0, y: 26, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .48, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
      gsap.from(q('.vz-ico', bd), { scale: 0, rotate: -25, duration: .5, delay: .12, ease: 'back.out(2.4)', clearProps: 'transform' });
      gsap.from(qa('.vz-k', bd), { opacity: 0, y: 8, duration: .32, stagger: .06, delay: .16, ease: 'power2.out', clearProps: 'transform,opacity' });
      if (g.pOtif != null) animCount(q('#vzP', bd), g.pOtif, function (v) { return pf(v); }, .8);
    }
    mejorarFiltros(bd);
  }

  function crecer(els, o) {
    o = o || {}; els = [].slice.call(els || []); if (!els.length) return;
    els.forEach(function (b) { b.style.width = b.dataset.w + '%'; });
    if (!GS || o.anim === false) return;
    gsap.fromTo(els, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: o.dur || .8, delay: o.delay || 0, stagger: o.stagger || 0, ease: 'power3.out', clearProps: 'transform', overwrite: true });
  }

  /* ── Brecha a la meta (Resumen) ── */
  function faltanParaMeta(g, meta) {
    if (!g.evaluados) return null;
    return Math.max(0, Math.ceil(meta / 100 * g.evaluados - 1e-9) - g.otif);
  }
  function gapHtml(g, meta) {
    var f = faltanParaMeta(g, meta);
    if (f == null) return '';
    return chipFaltan(f, meta);
  }

  /* ════════════════════════════════════════════════════════════
     DETALLE DE PEDIDOS — tabla filtrable + panel con la línea de tiempo
     ════════════════════════════════════════════════════════════ */
  var DET = { q: '', estado: '', zona: '', depto: '', vend: '', cond: '', sort: 'fecha', dir: 1, limit: 200 };
  var ESTADOS = [
    ['otif', 'En tiempo y forma', 'ok'],
    ['tarde', 'Fuera de plazo', 'bad'],
    ['incompleto', 'Incompleto', 'warn'],
    ['tarde_inc', 'Fuera de plazo e incompleto', 'bad'],
    ['noent', 'No entregado (06)', 'bad'],
    ['sincerrar', 'Sin cerrar', 'warn'],
    ['sindesp', 'Sin despachar', 'mute']
  ];
  var COND_TXT = { '01': 'Entrega capital', '14': 'Entrega interior', '08': 'Salón (espera)', '09': 'Retira el cliente', '02': 'Terminal / encomiendas', '26': 'Herrería', '27': 'Zona Chaco', '29': 'Empresas', '10': 'Sin definir', '13': 'Sin definir' };
  function estadoDe(o) {
    if (o.estado === 'sin_despacho') return 'sindesp';
    if (o.estado === 'sin_registro') return 'sincerrar';
    if (o.noEnt) return 'noent';
    if (o.otif) return 'otif';
    if (!o.ot && !o.inf) return 'tarde_inc';
    return o.ot ? 'incompleto' : 'tarde';
  }
  function estadoChip(o) {
    var k = estadoDe(o), e = ESTADOS.filter(function (x) { return x[0] === k; })[0];
    var extra = (k === 'tarde' || k === 'tarde_inc') && o.ciclo != null ? ' +' + tiempo(o.ciclo - o.sla, true) : '';
    return '<span class="st-chip ' + e[2] + '">' + esc(e[1]) + extra + '</span>';
  }
  function filtrarDetalle(evs) {
    var t = DET.q.toLowerCase().trim();
    return evs.filter(function (o) {
      var p = o.p;
      if (DET.estado && !coincide(DET.estado, estadoDe(o))) return false;
      if (DET.zona && !coincide(DET.zona, p.zona)) return false;
      if (DET.depto && !coincide(DET.depto, p.departamento)) return false;
      if (DET.vend && !coincide(DET.vend, p.vendedor_nombre)) return false;
      if (DET.cond && !coincide(DET.cond, p.cond_exp)) return false;
      if (t && [p.doc_vtas, p.cliente_nombre, p.cliente_cod, p.vendedor_nombre, p.region_nombre].join(' ').toLowerCase().indexOf(t) < 0) return false;
      return true;
    });
  }
  var ORDEN = {
    pedido: function (o) { return o.p.doc_vtas; },
    fecha: function (o) { return o.p.fecha_carga; },
    cliente: function (o) { return (o.p.cliente_nombre || '').toLowerCase(); },
    vendedor: function (o) { return (o.p.vendedor_nombre || '').toLowerCase(); },
    destino: function (o) { return (o.p.departamento || '') + (o.p.region_nombre || ''); },
    ciclo: function (o) { return o.ciclo == null ? Infinity : o.ciclo; },      // tiempo real (sin dato, al final)
    plazo: function (o) { return o.sla == null ? Infinity : o.sla; },
    alm: function (o) { return o.p.almacen || ''; },
    entregas: function (o) { return (o.p.n_entregas || 0) * 1000 + (o.p.n_entregadas || 0); },
    articulos: function (o) { return (o.p.n_lineas || 0) * 1000 + (o.p.n_completas || 0); },
    estado: function (o) { return ESTADOS.map(function (x) { return x[0]; }).indexOf(estadoDe(o)); }
  };
  function opciones(evs, fn, fmt) {
    var m = new Map();
    evs.forEach(function (o) { var v = fn(o.p); if (v) m.set(v, (m.get(v) || 0) + 1); });
    return Array.from(m.entries()).sort(function (a, b) { return b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'es'); })
      .map(function (e) { return [e[0], (fmt ? fmt(e[0]) : e[0]) + ' (' + nf(e[1]) + ')']; });
  }
  // Varios valores en un mismo filtro se guardan unidos por MSEP
  var MSEP = '||';
  function coincide(filtro, v) { if (!filtro) return true; return filtro.indexOf(MSEP) < 0 ? filtro === v : filtro.split(MSEP).indexOf(v) >= 0; }
  function valorFiltro(sel) { return sel._multi && sel._multi.length ? sel._multi.join(MSEP) : sel.value; }
  function selectHtml(id, lbl, opts, val) {
    var multi = val && val.indexOf(MSEP) >= 0;
    return '<label class="det-fld"><span>' + esc(lbl) + '</span><select id="' + id + '" data-lbl="' + esc(lbl) + '"' + (multi ? ' data-multi="' + esc(val) + '"' : '') + '><option value="">Todos</option>' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }

  function renderDetalle(body, entrada) {
    var evs = EVS.filter(enScope), meta = +CFG.meta_otif || 85;
    q('#tbTitle').textContent = 'Detalle de pedidos';
    q('#tbSub').textContent = 'Seguimiento pedido por pedido · ' + mesLbl(CUR) + ' · ' + ({ tot: 'Total', fer: 'Ferretería', hie: 'Hierros' }[SCOPE]);
    body.innerHTML =
      '<div class="det-filters" id="detFilters">' +
        '<div class="ot-search det-q"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="detQ" placeholder="Buscar pedido, cliente, vendedor o ciudad…" value="' + esc(DET.q) + '"/></div>' +
        selectHtml('detEstado', 'Estado', (function () { var c = {}; evs.forEach(function (o) { var k = estadoDe(o); c[k] = (c[k] || 0) + 1; }); return ESTADOS.filter(function (e) { return c[e[0]]; }).sort(function (a, b) { return c[b[0]] - c[a[0]]; }).map(function (e) { return [e[0], e[1] + ' (' + nf(c[e[0]]) + ')']; }); })(), DET.estado) +
        selectHtml('detZona', 'Zona', opciones(evs, function (p) { return p.zona; }), DET.zona) +
        selectHtml('detDepto', 'Departamento', opciones(evs, function (p) { return p.departamento; }), DET.depto) +
        selectHtml('detVend', 'Vendedor', opciones(evs, function (p) { return p.vendedor_nombre; }), DET.vend) +
        selectHtml('detCond', 'Condición de envío', opciones(evs, function (p) { return p.cond_exp; }, function (c) { return c + ' · ' + (COND_TXT[c] || 'Sin definir'); }), DET.cond) +
        '<div class="det-actions"><button class="btn btn--sm" type="button" id="detLimpiar">Limpiar</button><button class="btn btn--sm btn--primary" type="button" id="detExport">' + IC.upload.replace('M17 8l-5-5-5 5M12 3v12', 'M7 10l5 5 5-5M12 15V3') + ' Excel</button></div>' +
      '</div>' +
      '<div class="det-chips" id="detChips"></div>' +
      '<div class="ot-blue det-kpis" id="detKpis"></div>' +
      '<div class="ot-card det-card"><div class="det-tblwrap" id="detTabla"></div></div>';

    function pintar(animar) {
      var f = filtrarDetalle(evs), g = CALC.resumen(f);
      // KPIs del filtro
      var faltan = faltanParaMeta(g, meta);
      var est = estadoMeta(g.pOtif, meta);
      q('#detKpis').innerHTML =
        kpi('box', 'Pedidos', '<span data-n="' + g.total + '">0</span>', nf(g.evaluados) + ' evaluados', null) +
        kpi('check', 'En tiempo y forma', '<span data-p="' + (g.pOtif == null ? '' : g.pOtif) + '">—</span>', faltan == null ? '—' : '<em class="st-meta ' + est.c + '"><i></i>' + (faltan === 0 ? 'Meta ' + pf(meta, 0) + ' cumplida' : nf(faltan) + ' para el ' + pf(meta, 0)) + '</em>', g.pOtif, true) +
        kpi('clock', 'A tiempo', '<span data-p="' + (g.pOt == null ? '' : g.pOt) + '">—</span>', nf(g.ot) + ' pedidos', g.pOt) +
        kpi('ok', 'Completos', '<span data-p="' + (g.pIn == null ? '' : g.pIn) + '">—</span>', nf(g.inf) + ' pedidos', g.pIn) +
        kpi('time', 'Tiempo habitual', jd(g.cicloMed), 'carga → entrega', null);
      qa('#detKpis .dk-bar i').forEach(function (b) { if (GS) gsap.fromTo(b, { width: '0%' }, { width: b.dataset.w + '%', duration: .9, ease: 'power3.out' }); else b.style.width = b.dataset.w + '%'; });
      pintarChips();
      qa('#detKpis [data-n]').forEach(function (n) { animCount(n, +n.dataset.n, function (v) { return nf(v); }, .6); });
      qa('#detKpis [data-p]').forEach(function (n) { if (n.dataset.p === '') { n.textContent = '—'; return; } animCount(n, +n.dataset.p, function (v) { return pf(v); }, .7); });
      // orden
      var key = ORDEN[DET.sort] || ORDEN.fecha;
      f.sort(function (a, b) { var x = key(a), y = key(b); if (x === Infinity || y === Infinity) return x === y ? 0 : x === Infinity ? 1 : -1; return (x < y ? -1 : x > y ? 1 : 0) * DET.dir; });   // sin dato, siempre al final
      var flechas = function (k) { return '<i class="srt' + (DET.sort === k ? (DET.dir > 0 ? ' asc' : ' desc') : '') + '"><b></b><b></b></i>'; };
      var th = function (k, t, cls) { return '<th class="sortable' + (cls ? ' ' + cls : '') + (DET.sort === k ? ' on' : '') + '" data-k="' + k + '"><span class="srt-k">' + t + flechas(k) + '</span></th>'; };
      var thDoble = '<th class="r srt-2"><span class="srt-k' + (DET.sort === 'ciclo' ? ' on' : '') + '" data-k="ciclo" title="Ordenar por tiempo">Tiempo' + flechas('ciclo') + '</span><em>/</em><span class="srt-k' + (DET.sort === 'plazo' ? ' on' : '') + '" data-k="plazo" title="Ordenar por plazo">Plazo' + flechas('plazo') + '</span></th>';
      var vis = f.slice(0, DET.limit);
      q('#detTabla').innerHTML = !f.length ? '<div class="ot-soon" style="padding:50px">No hay pedidos con estos filtros.</div>' :
        '<table class="ot-tbl det-tbl"><thead><tr>' + th('pedido', 'Pedido') + th('fecha', 'Carga') + th('cliente', 'Cliente') + th('vendedor', 'Vendedor') + th('destino', 'Destino') +
          th('alm', 'Alm.') + th('entregas', 'Entregas', 'r') + th('articulos', 'Artículos', 'r') + thDoble + th('estado', 'Estado') + '</tr></thead><tbody>' +
        vis.map(function (o) {
          var p = o.p, tarde = o.ciclo != null && o.ciclo > o.sla;
          return '<tr data-doc="' + esc(p.doc_vtas) + '" tabindex="0"><td class="b">' + esc(p.doc_vtas) + '</td><td>' + fechaHora(p.fecha_carga) + '</td>' +
            '<td class="cli" title="' + esc(p.cliente_nombre) + '">' + esc(p.cliente_nombre || p.cliente_cod || '—') + '</td>' +
            '<td class="ven" title="' + esc(p.vendedor_nombre) + '">' + esc(p.vendedor_nombre || '—') + '</td>' +
            '<td class="des" title="' + esc((p.region_nombre || '') + ' · ' + p.departamento) + '">' + esc(p.region_nombre || p.departamento) + '<small>' + esc(p.departamento) + '</small></td>' +
            '<td>' + esc(p.almacen || '—') + '</td>' +
            '<td class="r">' + nf(p.n_entregadas) + '/' + nf(p.n_entregas) + '</td>' +
            '<td class="r' + (p.n_completas < p.n_lineas ? ' warnt' : '') + '">' + nf(p.n_completas) + '/' + nf(p.n_lineas) + '</td>' +
            '<td class="r"><b class="' + (tarde ? 'badt' : '') + '">' + (o.ciclo == null ? '—' : tiempo(o.ciclo, true)) + '</b><small> de ' + plazo(o.sla) + '</small></td>' +
            '<td>' + estadoChip(o) + '</td></tr>';
        }).join('') + '</tbody></table>' +
        (f.length > vis.length ? '<div class="det-more"><button class="btn btn--sm" type="button" id="detMas">Mostrar 200 más</button><span>Mostrando ' + nf(vis.length) + ' de ' + nf(f.length) + '</span></div>' : '<div class="det-more"><span>' + nf(f.length) + ' pedidos</span></div>');
      qa('#detTabla [data-k]').forEach(function (h) {
        h.addEventListener('click', function (e) { e.stopPropagation(); var k = h.dataset.k; if (DET.sort === k) DET.dir = -DET.dir; else { DET.sort = k; DET.dir = 1; } pintar(false);
          var nuevo = q('#detTabla [data-k="' + k + '"] .srt'); if (GS && nuevo) gsap.fromTo(nuevo, { scale: .6 }, { scale: 1, duration: .3, ease: 'back.out(2.6)', clearProps: 'transform' }); });
      });
      qa('#detTabla tbody tr').forEach(function (tr) {
        var go = function () { var o = f.filter(function (x) { return x.p.doc_vtas === tr.dataset.doc; })[0]; if (o) abrirPedido(o); };
        tr.addEventListener('click', go);
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      });
      var mas = q('#detMas'); if (mas) mas.addEventListener('click', function () { DET.limit += 200; pintar(false); });
      if (GS && animar !== false) gsap.from(qa('#detTabla tbody tr').slice(0, 24), { opacity: 0, x: -8, duration: .3, stagger: .018, ease: 'power2.out', clearProps: 'transform,opacity' });
      EXPORT_DET = f;
    }
    var DK_ICO = {
      box: SV('<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"/>'),
      check: SV('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
      clock: SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
      ok: SV('<path d="M20 6L9 17l-5-5"/>'),
      time: SV('<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 00-.6-1.4L12 12l-4.4 4.4a2 2 0 00-.6 1.4V22M7 2v4.2a2 2 0 00.6 1.4L12 12l4.4-4.4a2 2 0 00.6-1.4V2"/>')
    };
    // ico, etiqueta, valor, pie (texto o html), % para la barrita (null = sin barra), destacado
    function kpi(ico, l, v, pie, pct, dest) {
      var chipArriba = dest && String(pie).indexOf('<em') === 0;
      return '<div class="det-kpi' + (dest ? ' dest' : '') + '"><div class="dk-h"><i class="dk-ico">' + DK_ICO[ico] + '</i><span>' + esc(l) + '</span>' + (chipArriba ? pie : '') + '</div><b>' + v + '</b>' +
        (pct != null ? '<div class="dk-bar"><i data-w="' + Math.max(0, Math.min(100, pct)).toFixed(1) + '"></i>' + (dest ? '<em style="left:' + meta + '%"></em>' : '') + '</div>' : '') +
        (chipArriba ? '' : '<small>' + (String(pie).indexOf('<em') === 0 ? pie : esc(pie)) + '</small>') + '</div>';
    }
    // Chips de filtros activos (cada uno se quita con su ×)
    var CHIP_DEF = [['q', 'Buscar', '#detQ'], ['estado', 'Estado', '#detEstado'], ['zona', 'Zona', '#detZona'], ['depto', 'Departamento', '#detDepto'], ['vend', 'Vendedor', '#detVend'], ['cond', 'Condición', '#detCond']];
    function pintarChips() {
      var box = q('#detChips'); if (!box) return;
      var act = CHIP_DEF.filter(function (c) { return DET[c[0]]; });
      var previos = qa('.dc', box).map(function (x) { return x.dataset.k; });
      box.innerHTML = act.length ? act.map(function (c) {
        var el2 = q(c[2]), txt = DET[c[0]];
        if (el2 && el2.tagName === 'SELECT') {
          var nombres = String(DET[c[0]]).split(MSEP).map(function (v) { var o = Array.prototype.filter.call(el2.options, function (x) { return x.value === v; })[0]; return o ? o.text.replace(/\s*\(\d[\d.]*\)$/, '') : v; });
          txt = nombres.length > 2 ? nombres.slice(0, 2).join(', ') + ' +' + (nombres.length - 2) : nombres.join(', ');
        }
        return '<span class="dc" data-k="' + c[0] + '"><b>' + c[1] + ':</b> ' + esc(c[0] === 'q' ? '“' + txt + '”' : txt) + '<button type="button" aria-label="Quitar filtro">' + SV('<path d="M18 6L6 18M6 6l12 12"/>') + '</button></span>';
      }).join('') + (act.length > 1 ? '<button type="button" class="dc-all">Limpiar todo</button>' : '') : '';
      box.classList.toggle('on', act.length > 0);
      if (GS) gsap.from(qa('.dc', box).filter(function (x) { return previos.indexOf(x.dataset.k) < 0; }), { scale: .6, opacity: 0, duration: .32, ease: 'back.out(2.2)', clearProps: 'transform,opacity' });
      qa('.dc button', box).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.parentNode.dataset.k, c = CHIP_DEF.filter(function (x) { return x[0] === k; })[0], inp = q(c[2]);
          var quitar = function () {
            if (!inp) return;
            inp.value = ''; inp._multi = null;
            inp.dispatchEvent(new Event(inp.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
            if (k === 'q') { DET.q = ''; DET.limit = 200; pintar(); }
          };
          if (GS) gsap.to(b.parentNode, { scale: .6, opacity: 0, duration: .18, ease: 'power2.in', onComplete: quitar }); else quitar();
        });
      });
      var all = q('.dc-all', box); if (all) all.addEventListener('click', function () { var lb = q('#detLimpiar'); if (lb) lb.click(); });
    }

    var tmr;
    q('#detQ').addEventListener('input', function (e) { clearTimeout(tmr); tmr = setTimeout(function () { DET.q = e.target.value; DET.limit = 200; pintar(); }, 180); });
    [['detEstado', 'estado'], ['detZona', 'zona'], ['detDepto', 'depto'], ['detVend', 'vend'], ['detCond', 'cond']].forEach(function (x) {
      q('#' + x[0]).addEventListener('change', function (e) { DET[x[1]] = valorFiltro(e.target); DET.limit = 200; e.target.classList.toggle('on', !!DET[x[1]]); pintar(); });
      if (DET[x[1]]) q('#' + x[0]).classList.add('on');
    });
    q('#detLimpiar').addEventListener('click', function () { DET.q = DET.estado = DET.zona = DET.depto = DET.vend = DET.cond = ''; DET.limit = 200; renderDetalle(body, false); mejorarFiltros(body); });
    q('#detExport').addEventListener('click', exportarDetalle);
    pintar();
    if (GS && entrada !== false) {
      gsap.from('#detFilters', { opacity: 0, y: 10, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('#detKpis', { opacity: 0, y: 14, duration: .45, delay: .05, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from('#detKpis .det-kpi', { opacity: 0, y: 10, duration: .38, stagger: .06, delay: .12, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from('#detKpis .dk-ico', { scale: 0, rotate: -20, duration: .45, stagger: .06, delay: .2, ease: 'back.out(2.4)', clearProps: 'transform' });
      gsap.from('.det-card', { opacity: 0, y: 16, duration: .45, delay: .12, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
  }
  var EXPORT_DET = [];
  async function exportarDetalle() {
    try {
      var X = await cargarXLSX();
      var aoa = [['Pedido', 'Fecha carga', 'Cliente', 'Vendedor', 'Ciudad', 'Departamento', 'Zona', 'Almacén', 'Condición envío', 'Entregas registradas', 'Entregas', 'Artículos completos', 'Artículos', 'Tiempo (días hábiles)', 'Plazo (días hábiles)', 'A tiempo', 'Completo', 'Estado', 'Monto pedido (Gs)']];
      EXPORT_DET.forEach(function (o) {
        var p = o.p, e = ESTADOS.filter(function (x) { return x[0] === estadoDe(o); })[0];
        aoa.push([p.doc_vtas, fechaHora(p.fecha_carga), p.cliente_nombre || p.cliente_cod || '', p.vendedor_nombre || '', p.region_nombre || '', p.departamento, p.zona, p.almacen || '', p.cond_exp || '',
          p.n_entregadas, p.n_entregas, p.n_completas, p.n_lineas, o.ciclo == null ? '' : Math.round(o.ciclo * 100) / 100, o.sla,
          o.estado === 'evaluado' ? (o.ot ? 'Sí' : 'No') : '', o.estado === 'sin_despacho' ? '' : (o.inf ? 'Sí' : 'No'), e[1], +p.monto_pedido || 0]);
      });
      var wb = X.utils.book_new(), ws = X.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [12, 12, 32, 22, 18, 14, 9, 8, 9, 10, 8, 10, 8, 10, 10, 8, 9, 24, 14].map(function (w) { return { wch: w }; });
      X.utils.book_append_sheet(wb, ws, 'Pedidos');
      X.writeFile(wb, 'pedidos_otif_' + CUR + '.xlsx');
      toast('Excel descargado · ' + nf(EXPORT_DET.length) + ' pedidos');
    } catch (err) { console.error(err); toast('No se pudo exportar', true); }
  }

  /* ── Panel lateral del pedido: línea de tiempo + entregas + artículos ── */
  async function abrirPedido(o) {
    var p = o.p;
    var bd = el('<div class="dw-bd"><aside class="dw" role="dialog" aria-label="Pedido ' + esc(p.doc_vtas) + '">' +
      '<div class="dw-hd"><div class="dw-hd__t"><div class="dw-k">Pedido</div><h3>' + esc(p.doc_vtas) + '</h3><div class="dw-cli">' + esc(p.cliente_nombre || p.cliente_cod || '') + '</div></div>' +
        '<div class="dw-kpis">' +
          '<div><span>Tiempo total</span><b class="' + (o.ciclo == null ? '' : o.ot ? 'ok' : 'bad') + '">' + (o.ciclo == null ? '—' : tiempo(o.ciclo, true)) + '</b></div>' +
          '<div><span>Plazo</span><b>' + plazo(o.sla) + '</b></div>' +
          '<div><span>Artículos</span><b>' + nf(p.n_completas) + '/' + nf(p.n_lineas) + '</b></div>' +
          '<div><span>Monto</span><b>' + gs(p.monto_pedido) + '</b></div>' +
        '</div>' +
        '<button class="modal-x" type="button" aria-label="Cerrar"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="dw-body"><div class="dw-top">' + estadoChip(o) +
        '<span class="dw-tag">' + SV('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>') + esc(tCase(p.region_nombre || p.departamento)) + ' · ' + esc(p.zona) + '</span>' +
        '<span class="dw-tag">' + SV('<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.7 3.6-5.6 7-5.6s6.2 1.9 7 5.6"/>') + esc(p.vendedor_nombre || '—') + '</span>' +
        '<span class="dw-tag">' + STG_ICO.tra + 'Cond. ' + esc(p.cond_exp || '—') + ' · ' + esc(COND_TXT[p.cond_exp] || '') + '</span></div>' +
        (o.ciclo != null ? '<div class="dw-plazo"><div class="dw-plazo__hd"><span>Ciclo carga → ' + (o.retiro ? 'factura (retira el cliente)' : 'entrega') + '</span><b class="' + (o.ot ? 'okt' : 'badt') + '">' + tiempo(o.ciclo) + '</b></div>' +
          '<div class="dw-plazo__bar"><span style="background:' + (o.ot ? '#16a34a' : '#dc2626') + '" data-w="' + Math.min(100, o.ciclo / Math.max(o.sla * 1.6, o.ciclo) * 100).toFixed(1) + '"></span><em style="left:' + (o.sla / Math.max(o.sla * 1.6, o.ciclo) * 100).toFixed(1) + '%"><i>Plazo ' + plazo(o.sla) + '</i></em></div></div>' : '') +
        '<section class="dw-card"><div class="dw-sec">' + SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>') + 'Línea de tiempo</div><div class="tl" id="dwTl"><div class="ot-loading" style="padding:24px"><div class="ot-loading__ring"></div></div></div></section>' +
        '<section class="dw-card"><div class="dw-sec">' + STG_ICO.tra + 'Entregas</div><div id="dwEnt"></div></section>' +
        '<section class="dw-card"><div class="dw-sec">' + STG_ICO.pre + 'Artículos</div><div id="dwLin"></div></section>' +
      '</div></aside></div>');
    document.body.appendChild(bd);
    var dw = q('.dw', bd);
    function cerrar() {
      if (!GS) { bd.remove(); return; }
      gsap.to(dw, { x: 40, opacity: 0, scale: .985, duration: .22, ease: 'power2.in', overwrite: true });
      gsap.to(bd, { opacity: 0, duration: .24, ease: 'power1.in', onComplete: function () { bd.remove(); } });
    }
    q('.modal-x', bd).addEventListener('click', cerrar);
    bd.addEventListener('click', function (e) { if (e.target === bd) cerrar(); });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', k); } });
    if (GS) {
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: .22, ease: 'power1.out' });
      gsap.fromTo(dw, { x: 48, opacity: 0, scale: .985 }, { x: 0, opacity: 1, scale: 1, duration: .45, ease: 'expo.out', clearProps: 'transform,opacity' });
      gsap.from(qa('.dw-kpis > div', bd), { opacity: 0, y: 8, duration: .35, stagger: .06, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
      gsap.from(qa('.dw-card', bd), { opacity: 0, y: 14, duration: .4, stagger: .08, delay: .3, ease: 'power3.out', clearProps: 'transform,opacity' });
      gsap.from(qa('.dw-top > *', bd), { opacity: 0, y: 6, duration: .3, stagger: .05, delay: .25, ease: 'power2.out', clearProps: 'transform,opacity' });
      var pb = q('.dw-plazo__bar span', bd); if (pb) gsap.fromTo(pb, { width: '0%' }, { width: pb.dataset.w + '%', duration: .9, delay: .35, ease: 'power3.out' });
    } else { var pb2 = q('.dw-plazo__bar span', bd); if (pb2) pb2.style.width = pb2.dataset.w + '%'; }

    try {
      var r = await Promise.all([
        DB.from('otif_entregas').select('entrega,almacen,ult_etapa,etapa_desc,ts_creacion,ts_control,ts_empaque,ts_factura,nro_factura,ts_transporte,transporte,usuario_transp,ts_entrega,usuario_entrega').eq('doc_vtas', p.doc_vtas).order('entrega'),
        DB.from('otif_lineas').select('pos,entrega,material,unidad,cant_pedida,cant_entregada,cant_facturada,motivo_rechazo').eq('doc_vtas', p.doc_vtas).order('pos')
      ]);
      if (r[0].error) throw r[0].error; if (r[1].error) throw r[1].error;
      var ents = r[0].data, lins = r[1].data;
      var mats = Array.from(new Set(lins.map(function (l) { return l.material; }).filter(Boolean)));
      var desc = new Map();
      if (mats.length) { var md = await DB.from('otif_materiales').select('material,descripcion').in('material', mats); if (!md.error) md.data.forEach(function (m) { desc.set(m.material, m.descripcion); }); }

      // línea de tiempo (primera vez que ocurre cada etapa; entrega = la última)
      var minOf = function (k) { var v = ents.map(function (e) { return e[k]; }).filter(Boolean).sort(); return v[0] || null; };
      var maxOf = function (k) { var v = ents.map(function (e) { return e[k]; }).filter(Boolean).sort(); return v.length === ents.length && v.length ? v[v.length - 1] : null; };
      var hitos = [['Pedido cargado', p.fecha_carga], ['Entrega creada', minOf('ts_creacion')], ['Control', minOf('ts_control')], ['Empaque', minOf('ts_empaque')], ['Factura', minOf('ts_factura')], ['Sale en transporte', minOf('ts_transporte')], ['Entregado al cliente', maxOf('ts_entrega')]];
      var prev = null;
      var TL_ICO = [STG_ICO.lib, STG_ICO.pre, SV('<path d="M9 11l2.5 2.5L16 9"/><rect x="4" y="4" width="16" height="16" rx="3"/>'), SV('<path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8L12 12.5 20.5 8M8 5.8l8.5 4.6"/>'), STG_ICO.fac, STG_ICO.tra, SV('<path d="M20 6L9 17l-5-5"/>')];
      var ultimo = -1; hitos.forEach(function (h, i) { if (h[1]) ultimo = i; });
      var el2 = q('#dwTl', bd); el2.className = 'tl2';
      el2.innerHTML = hitos.map(function (h, i) {
        var dlt = '';
        if (h[1] && prev) { var j = CALC.jornadas(CALC.aMin(prev), CALC.aMin(h[1])); dlt = '<span class="tl-d">+' + tiempo(j, true) + '</span>'; }
        if (h[1]) prev = h[1];
        var est = h[1] ? (i === hitos.length - 1 ? ' on fin' : ' on') : (i < ultimo ? ' skip' : '');
        var sub = h[1] ? fechaHora(h[1]) : i < ultimo ? 'Sin registro en SAP' : 'Pendiente';
        return '<div class="tl2-it' + est + (i < ultimo ? ' pasa' : '') + '"><div class="tl2-ic">' + TL_ICO[i] + '</div><div class="tl2-tx"><b>' + esc(h[0]) + '</b><small>' + sub + '</small></div>' + dlt + '</div>';
      }).join('');
      q('#dwEnt', bd).innerHTML = '<table class="ot-tbl dw-tbl"><thead><tr><th>Entrega</th><th>Alm.</th><th>Etapa</th><th>Chofer</th><th>Entregado</th></tr></thead><tbody>' +
        ents.map(function (e) { return '<tr><td class="b">' + esc(e.entrega) + '</td><td>' + esc(e.almacen || '—') + '</td><td>' + etapaChip(e) + '</td><td>' + esc(e.usuario_transp || '—') + '</td><td>' + fechaHora(e.ts_entrega) + '</td></tr>'; }).join('') +
        (ents.length ? '' : '<tr><td colspan="5" class="mute">Ninguna entrega: el pedido no se despachó.</td></tr>') + '</tbody></table>';
      q('#dwLin', bd).innerHTML = '<table class="ot-tbl dw-tbl"><thead><tr><th>Pos</th><th>Artículo</th><th class="r">Pedido</th><th class="r">Fact.</th><th class="c">Entregado</th></tr></thead><tbody>' +
        lins.map(function (l) {
          var ok = l.entrega && l.cant_facturada >= l.cant_pedida;
          return '<tr><td>' + l.pos + '</td><td class="art" title="' + esc(desc.get(l.material) || '') + '"><b>' + esc(desc.get(l.material) || l.material) + '</b><small>' + esc(l.material) + (!l.entrega ? ' · ' + esc(motivoTxt(l.motivo_rechazo)) : '') + '</small></td>' +
            '<td class="r">' + nf(l.cant_pedida, l.cant_pedida % 1 ? 2 : 0) + '</td><td class="r">' + nf(l.cant_facturada, l.cant_facturada % 1 ? 2 : 0) + '</td><td class="c">' + (ok
              ? '<span class="ent-ok" title="Entregado completo">' + SV('<path d="M20 6L9 17l-5-5"/>') + '</span>'
              : '<span class="ent-no" title="' + (l.cant_facturada > 0 ? 'Entrega parcial' : 'No entregado') + '">' + SV('<path d="M18 6L6 18M6 6l12 12"/>') + '</span>' + (l.cant_facturada > 0 ? '<small class="ent-f">faltan ' + nf(l.cant_pedida - l.cant_facturada, (l.cant_pedida - l.cant_facturada) % 1 ? 2 : 0) + '</small>' : '')) + '</td></tr>';
        }).join('') + '</tbody></table>';
      if (GS) {
        gsap.from(qa('.tl2-it', bd), { opacity: 0, x: -10, duration: .35, stagger: .06, ease: 'power2.out', clearProps: 'transform,opacity' });
        gsap.from(qa('.tl2-it.on .tl2-ic', bd), { scale: .4, duration: .45, stagger: .06, delay: .1, ease: 'back.out(2.2)', clearProps: 'transform' });
        gsap.from(qa('.ent-ok, .ent-no', bd).slice(0, 40), { scale: 0, duration: .35, stagger: .02, delay: .35, ease: 'back.out(2.4)', clearProps: 'transform' });
        gsap.from(qa('#dwEnt tbody tr, #dwLin tbody tr', bd).slice(0, 30), { opacity: 0, y: 6, duration: .28, stagger: .02, delay: .2, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
    } catch (err) { console.error(err); q('#dwTl', bd).innerHTML = '<div class="ot-soon" style="padding:20px">No se pudo traer el detalle.</div>'; }
  }

  /* ── Navegación ── */
  function setNav(v) {
    qa('[data-nav]').forEach(function (b) {
      var on = b.dataset.nav === v, was = b.classList.contains('is-active');
      b.classList.toggle('is-active', on);
      if (on && !was && GS) { var ic = b.querySelector('.nav-btn__ico'); if (ic) gsap.fromTo(ic, { scale: .7 }, { scale: 1, duration: .4, ease: 'back.out(2.2)', clearProps: 'transform' }); }
    });
  }
  function ir(v) {
    var cambio = VIEW !== v;
    VIEW = v; setNav(v);
    var body = q('#otBody');
    if (!body) { renderShell(); return; }
    if (!GS || !cambio) { renderPagina(true); return; }
    gsap.killTweensOf(body);
    gsap.to(body, { opacity: 0, y: 10, filter: 'blur(5px)', duration: .2, ease: 'power2.in', onComplete: function () {
      q('#stage').scrollTop = 0;
      renderPagina(true);
      gsap.fromTo(body, { opacity: 0, y: -10, filter: 'blur(5px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .42, ease: 'power3.out', clearProps: 'transform,opacity,filter' });
    } });
  }

  /* ── Filtros y buscadores con diseño unificado ──
     · Opciones (.zn-sort): pastilla blanca que se desliza al elegir.
     · Buscadores (.ot-search): botón × para borrar, con animación.
     · Listas del Detalle: resaltado al cambiar y "Limpiar (n)". */
  function moverSegPill(c, animar) {
    if (!c) return;
    var pill = q('.zn-sort__pill', c);
    if (!pill) { c.insertAdjacentHTML('afterbegin', '<span class="zn-sort__pill"></span>'); pill = q('.zn-sort__pill', c); animar = false; }
    var b = q('button.on', c);
    if (!b) { pill.style.opacity = 0; return; }
    var to = { x: b.offsetLeft - 3, width: b.offsetWidth, opacity: 1 };
    if (GS && animar) gsap.to(pill, { x: to.x, width: to.width, opacity: 1, duration: .42, ease: 'back.out(1.5)' });
    else { pill.style.transform = 'translateX(' + to.x + 'px)'; pill.style.width = to.width + 'px'; pill.style.opacity = 1; }
  }
  function mejorarFiltros(root) {
    root = root || document;
    qa('.zn-sort', root).forEach(function (c) { moverSegPill(c, false); });
    qa('.ot-search', root).forEach(function (box) {
      if (box.dataset.ok) return; box.dataset.ok = '1';
      var inp = q('input', box); if (!inp) return;
      var x = el('<button type="button" class="ot-search__x" aria-label="Borrar búsqueda" hidden>' + SV('<path d="M18 6L6 18M6 6l12 12"/>') + '</button>');
      box.appendChild(x);
      var sync = function () {
        var tiene = !!inp.value;
        if (tiene && x.hidden) { x.hidden = false; if (GS) gsap.fromTo(x, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2.6)' }); }
        else if (!tiene && !x.hidden) { if (GS) gsap.to(x, { scale: .4, opacity: 0, duration: .15, onComplete: function () { x.hidden = true; } }); else x.hidden = true; }
        box.classList.toggle('has', tiene);
      };
      inp.addEventListener('input', sync);
      x.addEventListener('click', function () { inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); if (GS) gsap.fromTo(box, { x: -4 }, { x: 0, duration: .4, ease: 'elastic.out(1,.4)', clearProps: 'transform' }); });
      sync();
    });
    qa('.det-fld select', root).forEach(ddMejorar);
    var df = q('#detFilters', root);
    if (df) contarFiltros(df);
  }
  /* ── Desplegable con buscador (reemplaza visualmente al <select> nativo,
        que sigue por detrás: los filtros existentes no cambian) ── */
  function ddMejorar(sel) {
    if (sel.dataset.dd) return; sel.dataset.dd = '1';
    sel.classList.add('dd-native');
    if (sel.dataset.multi) sel._multi = sel.dataset.multi.split(MSEP);
    var lbl = sel.dataset.lbl || '';
    var btn = el('<button type="button" class="dd-btn" aria-haspopup="listbox"><span></span><em class="dd-n" hidden></em>' + SV('<path d="M6 9l6 6 6-6"/>') + '</button>');
    sel.parentNode.insertBefore(btn, sel.nextSibling);
    var OPTS = Array.prototype.slice.call(sel.options).filter(function (o) { return o.value; }).map(function (o) { var m = o.text.match(/\((\d[\d.]*)\)$/); return { v: o.value, t: o.text.replace(/\s*\(\d[\d.]*\)$/, ''), n: m ? m[1] : '' }; });
    function elegidos() { var v = valorFiltro(sel); return v ? v.split(MSEP) : []; }
    function nombre(v) { var o = OPTS.filter(function (x) { return x.v === v; })[0]; return o ? o.t : v; }
    function sync() {
      var e = elegidos(), sp = q('span', btn), n = q('.dd-n', btn);
      sp.textContent = !e.length ? 'Todos' : nombre(e[0]);
      n.hidden = e.length < 2; n.textContent = '+' + (e.length - 1);
      btn.classList.toggle('on', e.length > 0);
      btn.title = e.length ? e.map(nombre).join(', ') : 'Todos';
    }
    function aplicar(lista) {
      sel._multi = lista.length > 1 ? lista.slice() : null;
      sel.value = lista.length === 1 ? lista[0] : '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    sel.addEventListener('change', sync);
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      var abierto = q('.dd-pop', sel.parentNode);
      qa('.dd-pop').forEach(function (p) { p._cerrar && p._cerrar(); });
      if (abierto) return;
      var conBuscar = OPTS.length > 6;
      var pop = el('<div class="dd-pop dd-pop--m" role="listbox" aria-multiselectable="true">' +
        '<div class="dd-hd"><b>' + esc(lbl) + '</b><span class="dd-cnt"></span></div>' +
        (conBuscar ? '<div class="dd-q">' + SV('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>') + '<input type="text" placeholder="Buscar ' + esc(lbl.toLowerCase()) + '…"/></div>' : '') +
        '<div class="dd-list"></div><div class="dd-empty" hidden>Sin resultados</div>' +
        '<div class="dd-ft"><button type="button" class="dd-clr">Limpiar</button><button type="button" class="dd-ok">Listo</button></div></div>');
      sel.parentNode.appendChild(pop);
      pop.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); });   // que el <label> no reenvíe clics
      btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      var list = q('.dd-list', pop), inp = q('input', pop), vacio = q('.dd-empty', pop), cnt = q('.dd-cnt', pop);
      function contar() { var n = elegidos().length; cnt.textContent = n ? n + (n === 1 ? ' elegido' : ' elegidos') : 'Todos'; cnt.classList.toggle('on', n > 0); }
      function pintar(t) {
        t = (t || '').toLowerCase().trim();
        var sel2 = elegidos(), vis = OPTS.filter(function (o) { return !t || o.t.toLowerCase().indexOf(t) >= 0; });
        list.innerHTML = vis.map(function (o) { var on = sel2.indexOf(o.v) >= 0; return '<button type="button" class="dd-o' + (on ? ' on' : '') + '" data-v="' + esc(o.v) + '" role="option" aria-selected="' + on + '"><i class="dd-ck">' + SV('<path d="M20 6L9 17l-5-5"/>') + '</i><span>' + esc(o.t) + '</span>' + (o.n ? '<em>' + o.n + '</em>' : '') + '</button>'; }).join('');
        vacio.hidden = vis.length > 0;
        qa('.dd-o', list).forEach(function (b2) {
          b2.addEventListener('click', function () {
            var l = elegidos(), i = l.indexOf(b2.dataset.v);
            if (i >= 0) l.splice(i, 1); else l.push(b2.dataset.v);
            b2.classList.toggle('on', i < 0); b2.setAttribute('aria-selected', i < 0);
            if (GS) gsap.fromTo(q('.dd-ck', b2), { scale: .5 }, { scale: 1, duration: .3, ease: 'back.out(3)', clearProps: 'transform' });
            aplicar(l); contar();
          });
        });
      }
      function cerrar() {
        document.removeEventListener('click', fuera); document.removeEventListener('keydown', tecla);
        btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
        pop._cerrar = null;
        if (GS) gsap.to(pop, { opacity: 0, y: -6, scale: .98, duration: .14, ease: 'power1.in', onComplete: function () { pop.remove(); } }); else pop.remove();
      }
      function fuera(ev) { if (!pop.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) cerrar(); }
      function tecla(ev) {
        if (ev.key === 'Escape') cerrar();
        if (ev.key === 'Enter' && inp && document.activeElement === inp) { var f2 = q('.dd-o', list); if (f2) f2.click(); }
      }
      q('.dd-clr', pop).addEventListener('click', function () { aplicar([]); pintar(inp ? inp.value : ''); contar(); });
      q('.dd-ok', pop).addEventListener('click', cerrar);
      pop._cerrar = cerrar;
      pintar(''); contar();
      if (inp) { inp.addEventListener('input', function () { pintar(inp.value); }); setTimeout(function () { inp.focus(); }, 30); }
      if (GS) {
        gsap.fromTo(pop, { opacity: 0, y: -8, scale: .97, transformOrigin: '50% 0%' }, { opacity: 1, y: 0, scale: 1, duration: .26, ease: 'back.out(1.6)', clearProps: 'transform' });
        gsap.from(qa('.dd-o', list).slice(0, 12), { opacity: 0, x: -6, duration: .2, stagger: .015, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
      setTimeout(function () { document.addEventListener('click', fuera); document.addEventListener('keydown', tecla); }, 0);
    });
  }

  function contarFiltros(df) {
    var n = qa('select', df).filter(function (s2) { return valorFiltro(s2); }).length + (q('#detQ', df) && q('#detQ', df).value ? 1 : 0);
    var b = q('#detLimpiar', df); if (!b) return;
    b.textContent = n ? 'Limpiar (' + n + ')' : 'Limpiar';
    b.classList.toggle('has', !!n);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.zn-sort button');
    if (b) setTimeout(function () { moverSegPill(b.parentNode, true); }, 0);
  });
  document.addEventListener('change', function (e) {
    var sel = e.target.closest && e.target.closest('.det-fld select');
    if (!sel) return;
    var df = q('#detFilters'); if (df) contarFiltros(df);
  });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'detQ') { var df = q('#detFilters'); if (df) contarFiltros(df); } });
  window.addEventListener('resize', function () { qa('.zn-sort').forEach(function (c) { moverSegPill(c, false); }); });

  /* Aparición al bajar: lo que está fuera de la vista se anima cuando llega */
  var _revealObs = null;
  function revelarAlBajar() {
    if (!GS || !window.IntersectionObserver) return;
    var st = q('#stage'); if (!st) return;
    if (_revealObs) _revealObs.disconnect();
    var limite = st.getBoundingClientRect().bottom;
    var els = qa('#otBody .ot-card, #otBody .ot-tile, #otBody .ot-blue').filter(function (e) { return e.getBoundingClientRect().top > limite - 20; });
    if (!els.length) return;
    _revealObs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        _revealObs.unobserve(en.target);
        gsap.to(en.target, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', clearProps: 'transform,opacity' });
        crecer(qa('[data-w]', en.target), { delay: .1, stagger: .03 });
      });
    }, { root: st, threshold: .12 });
    els.forEach(function (e) { gsap.killTweensOf(e); gsap.set(e, { opacity: 0, y: 28 }); _revealObs.observe(e); });
  }

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
      // Pregunta en la misma tarjeta (ej. "este Excel ya está cargado"). Devuelve true/false.
      preguntar: function (titulo, texto, si, no) {
        if (tw) tw.kill();
        var tit = q('.ld-title', ov), viejo = tit.textContent;
        tit.textContent = titulo; mensaje(texto);
        var box = el('<div class="ld-ask"><button class="ld-btn" type="button" data-r="1">' + esc(si) + '</button><button class="ld-btn ld-btn--ghost" type="button" data-r="0">' + esc(no) + '</button></div>');
        card.appendChild(box);
        if (GS) { gsap.from(box.children, { opacity: 0, y: 8, duration: .3, stagger: .06, ease: 'power2.out', clearProps: 'transform,opacity' }); gsap.fromTo(card, { x: -6 }, { x: 0, duration: .5, ease: 'elastic.out(1,.4)', clearProps: 'transform' }); }
        return new Promise(function (res) {
          qa('button', box).forEach(function (b) { b.addEventListener('click', function () { var r = b.dataset.r === '1'; box.remove(); tit.textContent = viejo; res(r); }); });
        });
      },
      cerrar: function (cb) { cerrar(cb); },
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
          botones('<button class="ld-btn" type="button">Ver el Resumen actualizado</button>', function () { cerrar(alCerrar); });
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
      // Validación: ¿este Excel ya se cargó? (mismo período, misma cantidad y todos los pedidos ya existen)
      ui.mensaje('Comparando con lo ya cargado…');
      var ya = await OtifImport.contarExistentes(adaptador(), res);
      var previo = IMPORTS.filter(function (i) { return i.carga_desde === res.meta.carga_desde && i.carga_hasta === res.meta.carga_hasta && +i.pedidos === res.meta.pedidos; })[0];
      if (ya === res.meta.pedidos && previo) {
        var dp = new Date(previo.cargado_en);
        var seguir = await ui.preguntar('Este Excel ya está cargado',
          'Se cargó el ' + pad(dp.getDate()) + '/' + pad(dp.getMonth() + 1) + ' a las ' + pad(dp.getHours()) + ':' + pad(dp.getMinutes()) + (previo.cargado_por ? ' (' + previo.cargado_por + ')' : '') + '. Sus ' + nf(ya) + ' pedidos ya están en el tablero; no se va a duplicar nada.',
          'Actualizar igual', 'Cancelar');
        if (!seguir) { ui.cerrar(); return; }
      }
      await espera(200);
      ui.paso(2);
      var out = await OtifImport.subir(adaptador(), res, { archivo: file.name, usuario: userName(), ya: ya }, function (p, t) {
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
      ].concat(res.meta.repetidas ? [['Filas repetidas en el Excel (tomadas una vez)', nf(res.meta.repetidas)]] : []), irAlResumen);
    } catch (e) {
      console.error(e);
      ui.fail('Error al guardar: ' + (e && e.message ? e.message : e) + '. Probá de nuevo: lo que ya se guardó no se duplica.');
    }
  }

  /* ── Init ── */
  window.__initOtif = async function () {
    var nc = q('#navCargar'); if (nc && !isAdmin()) nc.remove();
    qa('[data-nav]').forEach(function (b) { b.addEventListener('click', function () { ir(b.dataset.nav); }); });
    q('#fileBase').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) subirExcel(f); });
    if (!DB) { q('#stage').innerHTML = '<div class="empty">' + IC.empty + '<h3>Sin conexión</h3><p>No se pudo conectar con la base de datos.</p></div>'; return; }
    q('#stage').innerHTML = '<div class="ot-loading"><div class="ot-loading__ring"></div><b>Cargando pedidos</b><span>Calculando el cumplimiento del mes…</span></div>';
    if (GS) gsap.from('#stage .ot-loading', { opacity: 0, y: 10, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
    try { await cargarBase(); await cargarMes(); renderShell(); }
    catch (e) { console.error(e); q('#stage').innerHTML = '<div class="empty">' + IC.empty + '<h3>No se pudieron cargar los datos</h3><p>' + esc(e && e.message ? e.message : e) + '</p></div>'; }
  };
})();
