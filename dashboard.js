// ==========================================
// DASHBOARD DE PRODUCTIVIDAD — IMPORTACIÓN EXCEL + RESUMEN
// ==========================================

const PICKER_NAMES = {
  ETRIGO: 'HENRI TRIGO', ADUO: 'ALEX DUO', RZORRILLA: 'ROBERTO ZORRILLA',
  GROJAS: 'GUILLERMO ROJAS', JMORALES: 'JUAN MORALES', RGRACIA: 'ROBERTO GRACIA',
  ICABRERA: 'IVAN CABRERA', EFLEITAS: 'EDUARDO FLEITAS', ECABRERA: 'ELIAS CABRERA',
  IPAREDES: 'ISMAEL PAREDES', ROVELAR: 'RAFAEL OVELAR', KGONZALES: 'KEVIN GONZALEZ',
  LBRANDELL: 'LISANDRO BRANDELL', DSOSA: 'DARWIN SOSA', VIAQUINO: 'VICTOR AQUINO',
  MNUNEZ: 'MAURICIO NUÑEZ', FROMAN: 'FEDERICO ROMAN'
};

let dashboardData = (function () {
  try {
    var raw = localStorage.getItem('picking_imported_data');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
})();
let dashSortCol = 'monto';
let dashSortAsc = false;
let dashFilter = '';
let dashSelectedPicker = null;

function normalizeKey(pedido, articulo) {
  var ped = String(pedido).replace(/\s/g, '');
  var num = parseInt(ped, 10);
  var pedNorm = isNaN(num) ? ped : String(num);
  var art = String(articulo).replace(/\s/g, '').toUpperCase();
  return pedNorm + '|' + art;
}

function findHeaderRow(data, requiredCols) {
  for (var i = 0; i < Math.min(data.length, 15); i++) {
    if (!data[i]) continue;
    var row = data[i].map(function (c) { return String(c || '').trim(); });
    var found = requiredCols.every(function (col) { return row.indexOf(col) !== -1; });
    if (found) return i;
  }
  return 0;
}

function colIndex(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === name) return i;
  }
  return -1;
}

// Entrega normalizada (sin ceros adelante): "0015889149" → "15889149"
function normEntrega(v) {
  var n = parseInt(String(v).replace(/\D/g, ''), 10);
  return isNaN(n) ? '' : String(n);
}

// Modelo por ENTREGA (3 hojas):
//   datosWMS   → preparador (Usuario) por entrega + período (Fecha Cierre) + Cant.Preparada
//   datosSAP   → ítems: suma de Cont.Art por entrega
//   datosMonto → monto facturado por línea (entrega|material) para el monto proporcional
function processExcel(workbook, validCodes) {
  var wsWMS = workbook.Sheets['datosWMS'];
  var wsSAP = workbook.Sheets['datosSAP'];     // Cont.Art → ítems
  var wsMonto = workbook.Sheets['datosMonto']; // facturado → monto
  if (!wsWMS || !wsSAP || !wsMonto) {
    alert('El archivo debe tener las hojas "datosWMS", "datosSAP" y "datosMonto".');
    return null;
  }

  var rawWMS = XLSX.utils.sheet_to_json(wsWMS, { header: 1, defval: '' });
  var rawSAP = XLSX.utils.sheet_to_json(wsSAP, { header: 1, defval: '' });
  var rawMonto = XLSX.utils.sheet_to_json(wsMonto, { header: 1, defval: '' });

  // --- datosMonto: facturado por clave entrega|material ---
  var mHeaderIdx = findHeaderRow(rawMonto, ['Entrega', 'Material']);
  var mH = rawMonto[mHeaderIdx].map(function (c) { return String(c).trim(); });
  var imEntrega = colIndex(mH, 'Entrega');
  var imMaterial = colIndex(mH, 'Material');
  var imPrecio = colIndex(mH, 'Precio');
  var imCantFact = colIndex(mH, 'Cant.Fact.');
  var imDesc = colIndex(mH, '%Desc');

  var montoMap = {};    // clave → monto facturado total (Precio×Cant.Fact×desc)
  var cantFactMap = {}; // clave → Cant. Facturada total (para precio unitario)
  for (var s = mHeaderIdx + 1; s < rawMonto.length; s++) {
    var rm = rawMonto[s];
    if (!rm || !rm[imEntrega]) continue;
    var mkey = normalizeKey(rm[imEntrega], rm[imMaterial]);
    var precio = parseFloat(rm[imPrecio]) || 0;
    var cantFact = parseFloat(rm[imCantFact]) || 0;
    var desc = parseFloat(rm[imDesc]) || 0;
    montoMap[mkey] = (montoMap[mkey] || 0) + precio * cantFact * (1 - desc / 100);
    cantFactMap[mkey] = (cantFactMap[mkey] || 0) + cantFact;
  }

  // --- datosSAP: ÍTEMS = suma de Cont.Art por entrega ---
  var sapHeaderIdx = findHeaderRow(rawSAP, ['Entrega', 'Cont.Art']);
  var sapH = rawSAP[sapHeaderIdx].map(function (c) { return String(c).trim(); });
  var isEntrega = colIndex(sapH, 'Entrega');
  var isContArt = colIndex(sapH, 'Cont.Art');
  var itemsByEnt = {};   // entrega → suma Cont.Art
  for (var a = sapHeaderIdx + 1; a < rawSAP.length; a++) {
    var ra = rawSAP[a];
    if (!ra || !ra[isEntrega]) continue;
    var eItems = normEntrega(ra[isEntrega]);
    if (!eItems) continue;
    itemsByEnt[eItems] = (itemsByEnt[eItems] || 0) + (parseFloat(ra[isContArt]) || 0);
  }

  // --- WMS: preparador por entrega + monto proporcional por línea ---
  var wmsHeaderIdx = findHeaderRow(rawWMS, ['Pedido', 'Articulo']);
  var wmsH = rawWMS[wmsHeaderIdx].map(function (c) { return String(c).trim(); });
  var iPedido = colIndex(wmsH, 'Pedido');       // = Entrega (con ceros adelante)
  var iArticulo = colIndex(wmsH, 'Articulo');
  var iDescArt = colIndex(wmsH, 'Desc. Articulo');
  var iCantPrep = colIndex(wmsH, 'Cant. Preparada');
  var iAccion = colIndex(wmsH, 'Accion');
  var iUsuario = colIndex(wmsH, 'Usuario');
  var iFechaCierre = colIndex(wmsH, 'Fecha Cierre');
  var iHoraCierre = colIndex(wmsH, 'Hora Cierre');

  var pickerMap = {};
  var periodCount = {};
  var entUserCount = {}; // entrega → { usuario: nº de líneas }
  var allEntregas = new Set(); // todas las entregas (para total de entregas)

  function ensurePicker(u) {
    if (!pickerMap[u]) pickerMap[u] = { code: u, lineas: 0, items: 0, monto: 0, pedidosSet: new Set() };
    return pickerMap[u];
  }

  for (var w = wmsHeaderIdx + 1; w < rawWMS.length; w++) {
    var row = rawWMS[w];
    if (!row || !row[iPedido]) continue;
    if (String(row[iAccion] || '').trim() !== 'Salida de Stock Por Ventas') continue;

    var usuario = String(row[iUsuario] || '').trim().toUpperCase();
    if (!usuario) continue;
    // Opción B: solo preparadores configurados (si se pasó la lista)
    if (validCodes && !validCodes.has(usuario)) continue;

    var entrega = normEntrega(row[iPedido]);
    if (!entrega) continue;

    // Período (YYYY-MM) de la Fecha Cierre del WMS
    var fc = String(row[iFechaCierre] || '');
    var m = fc.match(/(\d{4})[-/](\d{2})/);
    if (m) { var per = m[1] + '-' + m[2]; periodCount[per] = (periodCount[per] || 0) + 1; }

    // entrega → preparador (se resuelve por mayoría de líneas más abajo)
    if (!entUserCount[entrega]) entUserCount[entrega] = {};
    entUserCount[entrega][usuario] = (entUserCount[entrega][usuario] || 0) + 1;

    // Monto proporcional a lo preparado: Cant.Preparada × precio unitario (monto/cantFact)
    var key = normalizeKey(row[iPedido], row[iArticulo]);
    var cantPrep = parseFloat(row[iCantPrep]) || 0;
    var unitPrice = cantFactMap[key] > 0 ? (montoMap[key] / cantFactMap[key]) : 0;
    var montoLinea = cantPrep * unitPrice;

    var p = ensurePicker(usuario);
    p.lineas++;
    p.monto += montoLinea;
    p.pedidosSet.add(entrega);
    allEntregas.add(entrega);
  }

  // Resolver preparador único por entrega (mayoría de líneas)
  var ent2user = {};
  Object.keys(entUserCount).forEach(function (e) {
    var best = '', bestN = -1;
    Object.keys(entUserCount[e]).forEach(function (u) {
      if (entUserCount[e][u] > bestN) { bestN = entUserCount[e][u]; best = u; }
    });
    ent2user[e] = best;
  });

  // Ítems (Cont.Art) de cada entrega → al preparador que la preparó
  Object.keys(itemsByEnt).forEach(function (e) {
    var u = ent2user[e];
    if (!u) return; // entrega sin preparador en WMS → se ignora
    ensurePicker(u).items += itemsByEnt[e];
  });

  var pickersArr = Object.values(pickerMap).map(function (p) {
    return {
      code: p.code,
      name: PICKER_NAMES[p.code] || p.code,
      lineas: p.lineas,
      items: Math.round(p.items),
      monto: Math.round(p.monto),
      pedidos: p.pedidosSet.size,
      ticketPromedio: p.pedidosSet.size > 0 ? Math.round(p.monto / p.pedidosSet.size) : 0,
      itemsPorPedido: p.pedidosSet.size > 0 ? Math.round(p.items / p.pedidosSet.size) : 0
    };
  });

  pickersArr.sort(function (a, b) { return b.items - a.items; });

  var totals = {
    monto: pickersArr.reduce(function (s, p) { return s + p.monto; }, 0),
    items: pickersArr.reduce(function (s, p) { return s + p.items; }, 0),
    lineas: pickersArr.reduce(function (s, p) { return s + p.lineas; }, 0),
    pedidos: allEntregas.size,
    preparadores: pickersArr.length
  };

  // Período más frecuente
  var periodo = '';
  var maxCount = 0;
  Object.keys(periodCount).forEach(function (k) {
    if (periodCount[k] > maxCount) { maxCount = periodCount[k]; periodo = k; }
  });
  if (!periodo) {
    var now = new Date();
    periodo = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  return { pickers: pickersArr, totals: totals, periodo: periodo };
}

// ==========================================
// RESUMEN — LISTADO DIRECTO DE PREPARADORES
// ==========================================

function renderResumen() {
  var container = document.getElementById('resumen-body');
  if (!container) return;

  // Items/monto reales si vienen de la importación; si no, derivados (demo)
  function realItems(p) { return (window._pickingFromDB && p.items != null) ? p.items : p.score * 8; }
  function realMonto(p) { return (window._pickingFromDB && p.monto != null) ? p.monto : Math.round(p.score * 8 * ratePerItem * 7500); }

  // Ranking por ítems (preparaciones) — igual que el podio
  var sorted = [...pickers].sort(function (a, b) { return realItems(b) - realItems(a); });
  var html = '';

  var totalItems = sorted.reduce(function (s, p) { return s + realItems(p); }, 0);
  var totalMonto = sorted.reduce(function (s, p) { return s + realMonto(p); }, 0);

  html += `<div class="dash-kpis-row">
    <div class="dash-kpi-inline">
      <div class="dash-kpi-ico" style="background:rgba(11,95,141,0.08);color:#0B5F8D;">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <span class="dash-kpi-val">${sorted.length}</span>
      <span class="dash-kpi-lbl">Preparadores</span>
    </div>
    <div class="dash-kpi-sep"></div>
    <div class="dash-kpi-inline">
      <div class="dash-kpi-ico" style="background:rgba(59,130,246,0.08);color:#3B82F6;">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      </div>
      <span class="dash-kpi-val">${fmtNum(totalItems)}</span>
      <span class="dash-kpi-lbl">Ítems Preparados</span>
    </div>
    <div class="dash-kpi-sep"></div>
    <div class="dash-kpi-inline">
      <div class="dash-kpi-ico" style="background:rgba(5,150,105,0.08);color:#059669;">
        <span style="font-size:11px;font-weight:900;line-height:1;">Gs</span>
      </div>
      <span class="dash-kpi-val" style="color:#059669">${fmtNum(totalMonto)}</span>
      <span class="dash-kpi-lbl">Monto Alcanzado</span>
    </div>
  </div>`;

  // Tabla con columna Categoría (chips)
  html += `<div class="rsm-tablewrap"><table class="rsm-table">
    <thead><tr>
      <th class="rsm-th-rank">#</th>
      <th>Preparador</th>
      <th class="rsm-th-cat">Categoría</th>
      <th class="rsm-th-num">Ítems</th>
      <th class="rsm-th-num">Monto Gs.</th>
      <th class="rsm-th-meta">Meta</th>
    </tr></thead><tbody>`;

  var cats = (typeof CATEGORIAS !== 'undefined') ? CATEGORIAS : ['JUNIOR'];
  cats.forEach(function (cat) {
    var info = (typeof CATEGORIA_INFO !== 'undefined') ? CATEGORIA_INFO[cat] : { label: cat, color: '#64748b', soft: 'rgba(100,116,139,0.1)', icon: '' };
    // sorted ya viene por ítems desc → el filtro conserva ese orden dentro de la categoría
    var grupo = sorted.filter(function (p) { return (typeof pickerCategoria === 'function' ? pickerCategoria(p) : 'JUNIOR') === cat; });

    grupo.forEach(function (p, i) {
      var imgSrc = p.avatarType === 'preset'
        ? (PRESET_AVATARS[p.avatarValue] || PRESET_AVATARS.avatar1)
        : p.avatarValue;
      var totalIt = realItems(p);
      var monto = realMonto(p);
      var metaPct = typeof getMetaPercent === 'function' ? getMetaPercent(p) : 0;
      var metaCls = metaPct >= 100 ? 'is-100' : metaPct >= 80 ? 'is-mid' : 'is-low';

      html += `<tr class="rsm-trow${i === 0 ? ' rsm-trow--catstart' : ''}" style="--cat:${info.color}">
        <td class="rsm-td-rank">${i + 1}</td>
        <td>
          <div class="rsm-prep">
            <img class="rsm-img" src="${imgSrc}" alt="">
            <span class="rsm-name" title="${p.name}">${p.name}</span>
          </div>
        </td>
        <td><span class="rsm-cat-chip" style="--cat:${info.color};--cat-soft:${info.soft}">${info.icon}<span>${info.label}</span></span></td>
        <td class="rsm-td-num">${fmtNum(totalIt)}</td>
        <td class="rsm-td-num rsm-td-monto">${fmtGs(monto)}</td>
        <td class="rsm-td-meta"><span class="rsm-pct ${metaCls}">${metaPct}%</span></td>
      </tr>`;
    });
  });

  html += '</tbody></table></div>';

  container.innerHTML = html;
}

function renderImportedTable() {
  if (!dashboardData) return '';
  var d = dashboardData;
  var html = '';

  html += `<div class="dash-kpis" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px;">
    <div class="dash-kpi"><span class="dash-kpi-value" style="color:#059669">${fmtGs(d.totals.monto)}</span><span class="dash-kpi-label">Monto Total</span></div>
    <div class="dash-kpi"><span class="dash-kpi-value">${fmtNum(d.totals.items)}</span><span class="dash-kpi-label">Ítems</span></div>
    <div class="dash-kpi"><span class="dash-kpi-value">${fmtNum(d.totals.lineas)}</span><span class="dash-kpi-label">Líneas</span></div>
    <div class="dash-kpi"><span class="dash-kpi-value">${fmtNum(d.totals.pedidos)}</span><span class="dash-kpi-label">Pedidos</span></div>
    <div class="dash-kpi"><span class="dash-kpi-value">${d.totals.preparadores}</span><span class="dash-kpi-label">Preparadores</span></div>
  </div>`;

  html += '<div class="resumen-table-wrap"><table class="dash-table"><thead><tr>';
  html += '<th>#</th><th>Preparador</th><th>Pedidos</th><th>Líneas</th><th>Ítems</th>';
  html += '<th>Monto Gs.</th><th>Ticket Prom.</th><th>Ítems/Pedido</th>';
  html += '</tr></thead><tbody>';

  d.pickers.forEach(function (p, i) {
    html += `<tr style="cursor:pointer" onclick="selectDashPicker('${p.code}')">
      <td style="font-weight:800;color:var(--text-muted)">${i + 1}</td>
      <td><strong>${p.name}</strong><br><span style="font-size:0.68rem;color:var(--text-muted)">${p.code}</span></td>
      <td>${fmtNum(p.pedidos)}</td>
      <td>${fmtNum(p.lineas)}</td>
      <td>${fmtNum(p.items)}</td>
      <td style="font-weight:800">${fmtGs(p.monto)}</td>
      <td>${fmtGs(p.ticketPromedio)}</td>
      <td>${fmtNum(p.itemsPorPedido)}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  return html;
}

// ==========================================
// RENDER DASHBOARD (IMPORTACIÓN)
// ==========================================

function fmtGs(n) {
  return 'Gs. ' + Math.round(n).toLocaleString('es-PY');
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('es-PY');
}

var _currentView = 'ranking';

function switchView(viewName) {
  if (viewName === _currentView) return;

  var oldView = document.getElementById('view-' + _currentView);
  var newView = document.getElementById('view-' + viewName);
  if (!newView) return;

  // Sidebar highlight
  document.querySelectorAll('.sidebar-icon').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.sidebar-icon[data-view]').forEach(function (b) {
    if (b.dataset.view === viewName) b.classList.add('active');
  });

  // Exit old view
  if (oldView) {
    gsap.to(oldView, {
      opacity: 0, y: -8,
      duration: 0.18, ease: 'power2.in',
      onComplete: function () {
        oldView.classList.remove('is-active');
        oldView.style.opacity = '';
        oldView.style.transform = '';

        // Enter new view
        newView.classList.add('is-active');
        gsap.fromTo(newView,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', clearProps: 'all' }
        );

        _currentView = viewName;
        _afterViewEnter(viewName);
      }
    });
  } else {
    newView.classList.add('is-active');
    _currentView = viewName;
    _afterViewEnter(viewName);
  }
}

function _afterViewEnter(viewName) {
  if (viewName === 'resumen') renderResumen();
  if (viewName === 'importar') renderDashboard();
  if (viewName === 'admin' && typeof renderAdminView === 'function') renderAdminView();
  if (viewName === 'premios' && typeof renderPremios === 'function') renderPremios();

  // Stagger animate direct children of the new view
  var view = document.getElementById('view-' + viewName);
  if (!view) return;
  var children = view.querySelectorAll('.dash-kpi, .resumen-table-wrap, .dash-empty, .adm-card');
  if (children.length > 0) {
    gsap.fromTo(children,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power3.out', clearProps: 'all' }
    );
  }
}

function renderDashboard() {
  var container = document.getElementById('dashboard-body');
  if (!container) return;

  var hasData = !!dashboardData;
  var infoLine = '';
  if (hasData) {
    var mesLabel = (typeof fmtPeriodoLabel === 'function' && dashboardData.periodo) ? fmtPeriodoLabel(dashboardData.periodo) : (dashboardData.periodo || '');
    infoLine = '<div class="dash-lastimport">Última importación: <strong>' + mesLabel + '</strong> · ' +
      fmtNum(dashboardData.totals.pedidos) + ' entregas · ' + dashboardData.totals.preparadores + ' preparadores</div>';
  }

  container.innerHTML = `
    <div class="dash-empty">
      <div class="dash-empty-icon">
        <svg width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <h3>${hasData ? 'Cargar nuevo mes' : 'Importar datos de productividad'}</h3>
      <p>Subí el archivo Excel con las hojas <em>datosWMS</em> y <em>datosSAP</em>. Los datos se procesan y se ven en el Ranking y el Resumen.</p>
      <label class="dash-upload-btn">
        <input type="file" accept=".xlsx,.xls" onchange="handleExcelUpload(event)" style="display:none">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        ${hasData ? 'Cargar / Reimportar Excel' : 'Seleccionar archivo Excel'}
      </label>
      ${infoLine}
    </div>
    <div class="import-manager" id="import-manager"></div>
  `;

  renderImportManager();
}

// Panel para gestionar / borrar importaciones por rango de meses
async function renderImportManager() {
  var box = document.getElementById('import-manager');
  if (!box) return;
  if (!window.PickingAPI || !PickingAPI.isReady() || !window._alasCanEdit) { box.innerHTML = ''; return; }

  var periodos = (await PickingAPI.getPeriodos()) || [];
  if (!periodos.length) { box.innerHTML = ''; return; }

  // periodos viene descendente; para los selects ordenamos ascendente
  var asc = periodos.slice().sort();
  var opts = asc.map(function (p) {
    return '<option value="' + p + '">' + (typeof fmtPeriodoLabel === 'function' ? fmtPeriodoLabel(p) : p) + '</option>';
  }).join('');

  var chips = asc.map(function (p) {
    return '<span class="imp-mgr-chip">' + (typeof fmtPeriodoLabel === 'function' ? fmtPeriodoLabel(p) : p) + '</span>';
  }).join('');

  box.innerHTML = `
    <div class="imp-mgr-card">
      <div class="imp-mgr-head">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7h18M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0v12a2 2 0 002 2h6a2 2 0 002-2V7"/></svg>
        <span>Gestionar importaciones (${asc.length} ${asc.length === 1 ? 'mes' : 'meses'})</span>
      </div>
      <div class="imp-mgr-chips">${chips}</div>
      <div class="imp-mgr-range">
        <span>Borrar desde</span>
        <select class="imp-mgr-sel" id="del-desde">${opts}</select>
        <span>hasta</span>
        <select class="imp-mgr-sel" id="del-hasta">${opts}</select>
        <button class="imp-mgr-btn-del" onclick="deleteImportRange()">Borrar rango</button>
      </div>
      <button class="imp-mgr-btn-all" onclick="deleteImportAll()">Borrar todas las importaciones</button>
    </div>
  `;

  // Por defecto: desde el más viejo, hasta el más nuevo
  var dDesde = document.getElementById('del-desde');
  var dHasta = document.getElementById('del-hasta');
  if (dDesde) dDesde.value = asc[0];
  if (dHasta) dHasta.value = asc[asc.length - 1];
}

async function _doDeleteImport(desde, hasta, mensaje) {
  if (typeof showImportLoader === 'function') {} // no usamos el loader acá
  var ok = await PickingAPI.deleteImportaciones(desde, hasta);
  if (!ok) { if (typeof showToast === 'function') showToast('No se pudo borrar', 'error'); return; }

  if (typeof showToast === 'function') showToast(mensaje, 'success');

  // Limpiar estado local y refrescar
  dashboardData = null;
  try { localStorage.removeItem('picking_imported_data'); } catch (e) {}
  if (typeof loadData === 'function') {
    currentPeriodo = null;
    await loadData();
    if (typeof renderLeaderboard === 'function') renderLeaderboard(true);
    if (typeof refreshPeriodoSelector === 'function') refreshPeriodoSelector();
    if (typeof refreshUpdateChip === 'function') refreshUpdateChip();
  }
  renderDashboard();
}

window.deleteImportRange = function () {
  if (!window._alasCanEdit) return;
  var desde = document.getElementById('del-desde').value;
  var hasta = document.getElementById('del-hasta').value;
  if (desde > hasta) { var t = desde; desde = hasta; hasta = t; }
  var lblD = (typeof fmtPeriodoLabel === 'function') ? fmtPeriodoLabel(desde) : desde;
  var lblH = (typeof fmtPeriodoLabel === 'function') ? fmtPeriodoLabel(hasta) : hasta;
  var rango = (desde === hasta) ? ('<strong>' + lblD + '</strong>') : ('<strong>' + lblD + '</strong> a <strong>' + lblH + '</strong>');
  showConfirm({
    title: 'Borrar importaciones',
    message: '¿Borrar los datos de ' + rango + '? Esta acción no se puede deshacer.',
    okLabel: 'Borrar',
    onConfirm: function () { _doDeleteImport(desde, hasta, 'Datos borrados: ' + lblD + (desde !== hasta ? ' a ' + lblH : '')); }
  });
};

window.deleteImportAll = function () {
  if (!window._alasCanEdit) return;
  showConfirm({
    title: 'Borrar TODO',
    message: '¿Borrar <strong>todas</strong> las importaciones de productividad? Los perfiles y metas de los preparadores se conservan. Esta acción no se puede deshacer.',
    okLabel: 'Borrar todo',
    onConfirm: function () { _doDeleteImport(null, null, 'Todas las importaciones borradas'); }
  });
};

window.dashSortBy = function (col) {
  if (dashSortCol === col) dashSortAsc = !dashSortAsc;
  else { dashSortCol = col; dashSortAsc = false; }
  renderDashboard();
};

window.selectDashPicker = function (code) {
  if (!dashboardData) return;
  if (dashSelectedPicker && dashSelectedPicker.code === code) {
    dashSelectedPicker = null;
  } else {
    dashSelectedPicker = dashboardData.pickers.find(function (p) { return p.code === code; }) || null;
  }
  renderDashboard();
};

function _tick() {
  return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 30); }); });
}

window.handleExcelUpload = function (event) {
  var file = event.target.files[0];
  if (!file) return;

  showImportLoader();
  setImportProgress(10, 'Leyendo archivo…');

  var reader = new FileReader();
  reader.onload = async function (e) {
    try {
      await _tick();
      setImportProgress(35, 'Procesando WMS + SAP…');
      await _tick();

      // Opción B: solo se registran los preparadores que están en Configuración
      var validCodes = null;
      if (window.PickingAPI && PickingAPI.isReady()) {
        var reps = await PickingAPI.getPreparadores();
        if (reps) validCodes = new Set(reps.map(function (r) { return r.codigo; }));
      }

      var wb = XLSX.read(e.target.result, { type: 'array' });
      var result = processExcel(wb, validCodes);
      if (!result) { importError('No se pudo procesar el archivo.'); return; }

      dashboardData = result;
      dashSelectedPicker = null;
      dashFilter = '';
      // localStorage es solo un cache de conveniencia; el dato real va a Supabase.
      // Si excede la cuota no debe abortar la importación.
      try { localStorage.setItem('picking_imported_data', JSON.stringify(result)); }
      catch (e) { console.warn('[import] no se pudo cachear en localStorage:', e.message); }

      setImportProgress(70, 'Guardando productividad…');
      await _tick();

      var saveInfo = null;
      if (window.PickingAPI && PickingAPI.isReady()) {
        saveInfo = await PickingAPI.saveImportacion(result.periodo, file.name, result.totals, result.pickers);

        if (!saveInfo) {
          importError('Datos procesados, pero no se pudieron guardar en la nube. Verificá el schema en Supabase.');
          return;
        }

        // Premios: bloquear al 1º en llegar a 100% por categoría (cronológico).
        // Sólo la PRIMERA importación que detecta ≥100% en una categoría fija al ganador.
        if (reps && reps.length) {
          var metaByCode = {}, catByCode = {}, nameByCode = {};
          reps.forEach(function (r) {
            metaByCode[r.codigo] = Number(r.meta_items_mes) || 0;
            catByCode[r.codigo] = r.categoria || 'JUNIOR';
            nameByCode[r.codigo] = r.nombre;
          });
          var bestByCat = {};
          result.pickers.forEach(function (p) {
            var meta = metaByCode[p.code];
            if (!meta) return;
            var pct = Math.round((Number(p.items) || 0) / meta * 100);
            if (pct < 100) return;
            var cat = catByCode[p.code] || 'JUNIOR';
            if (!bestByCat[cat] || pct > bestByCat[cat].metaPct) {
              bestByCat[cat] = { categoria: cat, code: p.code, name: nameByCode[p.code] || p.name, metaPct: pct };
            }
          });
          var candidatos = Object.keys(bestByCat).map(function (k) { return bestByCat[k]; });
          if (candidatos.length) await PickingAPI.lockPrimeroMeta(result.periodo, candidatos);
        }

        setImportProgress(95, 'Actualizando ranking…');
        if (typeof loadData === 'function') {
          currentPeriodo = result.periodo;
          await loadData();
          if (typeof renderLeaderboard === 'function') renderLeaderboard(true);
          if (typeof refreshPeriodoSelector === 'function') refreshPeriodoSelector();
          if (typeof refreshUpdateChip === 'function') refreshUpdateChip();
        }
      }

      renderDashboard();
      setImportProgress(100, 'Completado');
      await _tick();

      showImportSuccess(result, saveInfo);
    } catch (err) {
      importError('Error al leer el archivo: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
};

// ── Loader UI ──────────────────────────────────────────────
function showImportLoader() {
  var ov = document.getElementById('import-overlay');
  if (!ov) return;
  var ring = ov.querySelector('.import-ring');
  if (ring) ring.classList.remove('done');
  var summary = document.getElementById('import-summary');
  if (summary) summary.innerHTML = '';
  var doneBtn = document.getElementById('import-done-btn');
  if (doneBtn) doneBtn.style.display = 'none';
  setImportProgress(0, 'Procesando archivo…');
  ov.classList.add('active');
}

function setImportProgress(pct, status) {
  var fill = document.getElementById('import-ring-fill');
  var pctEl = document.getElementById('import-pct');
  var statusEl = document.getElementById('import-status');
  var C = 264; // circunferencia
  if (fill) fill.style.strokeDashoffset = (C - C * (pct / 100));
  if (pctEl) pctEl.textContent = Math.round(pct) + '%';
  if (statusEl && status) statusEl.textContent = status;
}

function showImportSuccess(result, saveInfo) {
  var ring = document.querySelector('#import-overlay .import-ring');
  if (ring) ring.classList.add('done');

  var statusEl = document.getElementById('import-status');
  if (statusEl) statusEl.textContent = '¡Importación completada!';

  var t = result.totals;
  var replaced = saveInfo && saveInfo.replaced;
  var mesLabel = (typeof fmtPeriodoLabel === 'function') ? fmtPeriodoLabel(result.periodo) : result.periodo;

  var html = '';
  html += '<div class="imp-row"><span>Período</span><strong>' + mesLabel + '</strong></div>';
  html += '<div class="imp-row"><span>Entregas (pedidos)</span><strong>' + fmtNum(t.pedidos) + '</strong></div>';
  html += '<div class="imp-row"><span>Líneas</span><strong>' + fmtNum(t.lineas) + '</strong></div>';
  html += '<div class="imp-row"><span>Preparadores</span><strong>' + t.preparadores + '</strong></div>';
  if (replaced) {
    html += '<span class="imp-tag reemplazo">↻ Reemplazó datos previos de ' + mesLabel + ' (' + fmtNum(saveInfo.prevPedidos) + ' entregas)</span>';
  } else {
    html += '<span class="imp-tag nuevo">✓ Mes nuevo agregado</span>';
  }

  var summary = document.getElementById('import-summary');
  if (summary) summary.innerHTML = html;

  var doneBtn = document.getElementById('import-done-btn');
  if (doneBtn) doneBtn.style.display = '';
}

function importError(msg) {
  closeImportLoader();
  alert(msg);
}

window.closeImportLoader = function () {
  var ov = document.getElementById('import-overlay');
  if (ov) ov.classList.remove('active');
};

window.exportDashCSV = function () {
  if (!dashboardData) return;
  var rows = [['Código', 'Nombre', 'Pedidos', 'Líneas', 'Ítems', 'Monto Gs.', 'Ticket Promedio', 'Ítems/Pedido']];
  dashboardData.pickers.forEach(function (p) {
    rows.push([p.code, p.name, p.pedidos, p.lineas, p.items, p.monto, p.ticketPromedio, p.itemsPorPedido]);
  });
  var csv = rows.map(function (r) { return r.join(','); }).join('\n');
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'productividad_picking.csv';
  a.click();
};

window.openSummaryModal = function () { switchView('resumen'); };
window.openImportView = function () { switchView('importar'); };
window.switchView = switchView;
