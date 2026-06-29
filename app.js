// ==========================================
// PRESETS Y CONFIGURACIÓN INICIAL
// ==========================================
const PRESET_AVATARS = {
  avatar1: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='a1' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%230e7cc2'/><stop offset='100%25' stop-color='%230B5F8D'/></linearGradient></defs><rect width='200' height='200' fill='url(%23a1)'/><circle cx='100' cy='72' r='32' fill='%23fff' opacity='.95'/><ellipse cx='100' cy='158' rx='48' ry='36' fill='%23fff' opacity='.90'/><circle cx='100' cy='72' r='26' fill='none' stroke='%23fff' stroke-width='1' opacity='.3'/></svg>`,
  avatar2: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='a2' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%23536680'/><stop offset='100%25' stop-color='%23334155'/></linearGradient></defs><rect width='200' height='200' fill='url(%23a2)'/><circle cx='100' cy='72' r='32' fill='%23fff' opacity='.95'/><ellipse cx='100' cy='158' rx='48' ry='36' fill='%23fff' opacity='.90'/><circle cx='100' cy='72' r='26' fill='none' stroke='%23fff' stroke-width='1' opacity='.3'/></svg>`,
  avatar3: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='a3' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%23283548'/><stop offset='100%25' stop-color='%230f172a'/></linearGradient></defs><rect width='200' height='200' fill='url(%23a3)'/><circle cx='100' cy='72' r='32' fill='%23fff' opacity='.95'/><ellipse cx='100' cy='158' rx='48' ry='36' fill='%23fff' opacity='.90'/><circle cx='100' cy='72' r='26' fill='none' stroke='%23fff' stroke-width='1' opacity='.3'/></svg>`,
  avatar4: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='a4' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%234d94f8'/><stop offset='100%25' stop-color='%232563EB'/></linearGradient></defs><rect width='200' height='200' fill='url(%23a4)'/><circle cx='100' cy='72' r='32' fill='%23fff' opacity='.95'/><ellipse cx='100' cy='158' rx='48' ry='36' fill='%23fff' opacity='.90'/><circle cx='100' cy='72' r='26' fill='none' stroke='%23fff' stroke-width='1' opacity='.3'/></svg>`
};

const MOCK_DATA = [
  { id: "p1", name: "Sofía Rodríguez", score: 254, deletedScore: 18, avatarType: "preset", avatarValue: "avatar1" },
  { id: "p2", name: "Juan Pérez", score: 232, deletedScore: 35, avatarType: "preset", avatarValue: "avatar4" },
  { id: "p3", name: "Pedro Gómez", score: 215, deletedScore: 12, avatarType: "preset", avatarValue: "avatar2" },
  { id: "p4", name: "Laura Beltrán", score: 188, deletedScore: 28, avatarType: "preset", avatarValue: "avatar3" },
  { id: "p5", name: "Carlos Mendoza", score: 165, deletedScore: 8, avatarType: "preset", avatarValue: "avatar2" },
  { id: "p6", name: "Miguel Ángel", score: 142, deletedScore: 22, avatarType: "preset", avatarValue: "avatar1" }
];

// ── CATEGORÍAS DE PREPARADORES ──────────────────────────────
const CATEGORIAS = ['PLENO', 'JUNIOR', 'APRENDIZ', 'EMPAQUE'];
const CATEGORIA_INFO = {
  PLENO: {
    label: 'Pleno', color: '#dc2626', soft: 'rgba(220,38,38,0.1)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  },
  JUNIOR: {
    label: 'Junior', color: '#ca8a04', soft: 'rgba(202,138,4,0.12)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
  },
  APRENDIZ: {
    label: 'Aprendiz', color: '#16a34a', soft: 'rgba(22,163,74,0.1)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>'
  },
  EMPAQUE: {
    label: 'Empaque', color: '#64748b', soft: 'rgba(100,116,139,0.12)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  }
};
// Caja de leche (premio)
const MILK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8l1.5-4h7L17 8v12H7z"/><path d="M7 8h10M10 4v4M14 4v4"/><line x1="10" y1="13" x2="14" y2="13"/></svg>';
// Medalla 1º lugar — cinta azul + disco dorado
const MEDAL_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M15.5 12.6L17.6 22 12 18.7 6.4 22l2.1-9.4" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="8.3" r="6.3" fill="#fbbf24" stroke="#d97706" stroke-width="1.4"/><path d="M12 5.4l.93 1.88 2.07.3-1.5 1.46.35 2.06L12 10.18l-1.85.97.35-2.06-1.5-1.46 2.07-.3z" fill="#fffbeb"/></svg>';
// Check simple (110%) y doble check (1º a 100%)
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 9.5 18 20 6.5"/></svg>';
const DCHECK_ICON = '<svg viewBox="0 0 28 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 12.5 7 17.5 16 7"/><polyline points="11 17.5 12.5 19 23 6.5"/></svg>';
function pickerCategoria(p) {
  var c = p && p.categoria;
  return CATEGORIA_INFO[c] ? c : 'JUNIOR';
}

let pickers = [];
let deletedPickers = [];
let selectedAvatarType = "preset";
let selectedAvatarValue = "avatar1";
let statsOldValues = { leader: "", average: 0, total: 0 };
let ratePerItem = 1.50;
let targetGoal = 200;

// ==========================================
// SSO + ROLES
// ==========================================
window._alasIsAdmin = false;
window._alasCanEdit = false;

function waitForAlasAuth(maxMs) {
  maxMs = maxMs || 8000;
  return new Promise(function (resolve) {
    var start = Date.now();
    function check() {
      if (window.__alasAuthReady !== undefined) {
        window.__alasAuthReady.then(function () {
          var c = window.AlasAuthClient;
          resolve((c && c.isAuthenticated) ? c.user : null);
        });
      } else if (Date.now() - start > maxMs) {
        resolve(null);
      } else {
        setTimeout(check, 50);
      }
    }
    check();
  });
}

function applyRoleRestrictions() {
  var role = window._alasRole || 'operador';
  // Admin, supervisor y operador pueden configurar (editar perfiles, metas, categorías).
  window._alasCanEdit = (role === 'admin' || role === 'supervisor' || role === 'operador');

  var btnAdmin = document.getElementById('btn-admin-panel');
  var roleBadge = document.getElementById('admin-role-badge');

  if (!window._alasCanEdit) {
    if (btnAdmin) {
      btnAdmin.textContent = 'Ver Ranking';
      btnAdmin.title = 'Solo visualización — no tienes permisos de edición';
    }
  }

  // El badge "Solo lectura" sólo aparece para roles que NO pueden editar.
  if (roleBadge && !window._alasCanEdit) {
    roleBadge.textContent = 'Solo lectura';
    roleBadge.style.display = 'inline-block';
  }
}

function lockAdminForm() {
  if (window._alasCanEdit) return;

  var form = document.getElementById('picker-form');
  if (form) form.style.display = 'none';

  var goalSection = document.querySelector('.drawer-section-title');
  if (goalSection && goalSection.textContent.includes('Parámetros')) {
    goalSection.style.display = 'none';
    var goalGroup = goalSection.nextElementSibling;
    if (goalGroup) goalGroup.style.display = 'none';
  }

  var resetBtn = document.querySelector('.drawer-footer .btn-danger');
  if (resetBtn) resetBtn.style.display = 'none';

  var manageSection = document.getElementById('manage-list-container');
  if (manageSection) {
    var notice = document.createElement('div');
    notice.className = 'admin-readonly-notice';
    notice.textContent = 'Vista de solo lectura — contacta a un administrador para editar';
    manageSection.parentNode.insertBefore(notice, manageSection);
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  // La ENTRADA la dispara el script inline de index.html (init + enterProject juntos,
  // igual que CajaVenta) para garantizar el orden: ocultar → animar.

  // Botón "Volver al Menú" — salida con la misma transición que el resto
  var btnBack = document.getElementById('btnBack');
  if (btnBack) btnBack.addEventListener('click', function (e) {
    e.preventDefault();
    var url = (window.ALAS_SSO_CONFIG || {}).launcherUrl || 'https://launcher-tawny.vercel.app';
    if (window.ALASTransition) window.ALASTransition.exitToLauncher(url);
    else window.location.replace(url);
  });

  window.addEventListener("hashchange", handleRouting);

  // El resto (SSO + datos + render) corre en paralelo a la animación de entrada
  initApp();
});

async function initApp() {
  // Patrón estándar del ecosistema (igual que Flete / CajaVenta / ItemsBorrados):
  // espera el SSO real; si no hay sesión, redirige al Launcher.
  var ssoUser = await waitForAlasAuth();
  var isBypass = new URLSearchParams(window.location.search).has('bypass_auth');
  if (isBypass && !ssoUser) {
    ssoUser = { name: 'Desarrollador Local', role: 'admin', email: 'dev@alas.com' };
  }
  if (!ssoUser) {
    var url = (window.ALAS_SSO_CONFIG || {}).launcherUrl || 'https://launcher-tawny.vercel.app';
    window.location.replace(url);
    return;
  }

  window._alasSSOReady = true;
  window._alasRole = ssoUser.role || 'operador';
  window._alasIsAdmin = (ssoUser.role === 'admin');

  var nameEl = document.getElementById('ssoUserName');
  var chipEl = document.getElementById('ssoUserChip');
  if (nameEl) nameEl.textContent = ssoUser.name || ssoUser.email || 'Usuario';
  if (chipEl) chipEl.style.display = '';

  applyRoleRestrictions();
  lockAdminForm();

  await loadData();

  handleRouting();
  if (typeof refreshPeriodoSelector === 'function') refreshPeriodoSelector();
  if (typeof refreshUpdateChip === 'function') refreshUpdateChip();
}

function handleRouting() {
  const hash = window.location.hash;
  if (hash === "#tv" || hash === "tv") {
    setTVModeState(true);
  } else {
    setTVModeState(false);
  }
}

// ==========================================
// DATOS
// ==========================================
let currentPeriodo = null;

async function loadData() {
  // 1. Intentar roster real desde Supabase
  if (window.PickingAPI && PickingAPI.isReady()) {
    try {
      const reps = await PickingAPI.getPreparadores();
      if (reps && reps.length) {
        pickers = reps.map(function (r) {
          return {
            id:           r.codigo,
            codigo:       r.codigo,
            name:         r.nombre,
            score:        0,
            deletedScore: 0,
            items:        0,
            monto:        0,
            avatarType:   r.avatar_type,
            avatarValue:  r.avatar_value,
            metaItemsMes: r.meta_items_mes,
            metaMontoMes: r.meta_monto_mes,
            categoria:    r.categoria || 'JUNIOR'
          };
        });
        deletedPickers = [];
        window._pickingFromDB = true;

        // Cargar productividad del último período disponible
        const periodos = await PickingAPI.getPeriodos();
        if (periodos && periodos.length) {
          currentPeriodo = periodos[0];
          await mergeProductividad(currentPeriodo);
        }
        return;
      }
    } catch (e) {
      console.warn('[Picking] loadData → fallback localStorage:', e.message);
    }
  }

  // 2. Fallback: localStorage / mock
  window._pickingFromDB = false;
  loadDataLocal();
}

function fmtPeriodoLabel(periodo) {
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var parts = String(periodo || '').split('-');
  if (parts.length === 2) {
    var m = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12) return meses[m - 1] + ' ' + parts[0];
  }
  return periodo || '';
}

let _periodos = [];      // períodos disponibles (desc)
let _periodoTodo = false; // modo "Todo" (todos los meses sumados)

function fmtFechaHora(iso) {
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  var p2 = function (n) { return String(n).padStart(2, '0'); };
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + '  ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
}

async function refreshUpdateChip() {
  var chip = document.getElementById('update-chip');
  if (!chip) return;
  if (!window.PickingAPI || !PickingAPI.isReady()) { chip.style.display = 'none'; return; }

  var ultima = await PickingAPI.getUltimaImportacion();
  if (!ultima || !ultima.fecha_carga) { chip.style.display = 'none'; return; }

  var dateEl = document.getElementById('update-chip-date');
  if (dateEl) dateEl.textContent = fmtFechaHora(ultima.fecha_carga);
  chip.style.display = 'flex';
}

async function refreshPeriodoSelector() {
  var navs = document.querySelectorAll('.periodo-nav');
  if (!navs.length) return;
  if (!window.PickingAPI || !PickingAPI.isReady()) {
    navs.forEach(function (n) { n.style.display = 'none'; });
    return;
  }

  _periodos = (await PickingAPI.getPeriodos()) || [];
  if (!_periodos.length) {
    navs.forEach(function (n) { n.style.display = 'none'; });
    return;
  }

  if (!currentPeriodo || _periodos.indexOf(currentPeriodo) === -1) {
    currentPeriodo = _periodos[0];
  }
  navs.forEach(function (n) { n.style.display = 'flex'; });
  updatePeriodoUI();
}

function updatePeriodoUI() {
  var idx = _periodos.indexOf(currentPeriodo);

  document.querySelectorAll('.periodo-nav').forEach(function (nav) {
    var label = nav.querySelector('.periodo-label');
    var prev = nav.querySelector('.periodo-prev');
    var next = nav.querySelector('.periodo-next');
    var todo = nav.querySelector('.periodo-todo');

    if (_periodoTodo) {
      if (label) label.textContent = 'Todos los meses';
      if (prev) prev.disabled = true;
      if (next) next.disabled = true;
      if (todo) todo.classList.add('is-active');
      return;
    }

    if (todo) todo.classList.remove('is-active');
    if (label) label.textContent = fmtPeriodoLabel(currentPeriodo);
    // _periodos en orden descendente (más nuevo primero)
    if (next) next.disabled = (idx <= 0);
    if (prev) prev.disabled = (idx >= _periodos.length - 1);
  });
}

window.changePeriodo = async function (delta) {
  if (_periodoTodo) return;
  var idx = _periodos.indexOf(currentPeriodo);
  // delta -1 = mes anterior (más viejo, idx+1) ; delta +1 = mes siguiente (más nuevo, idx-1)
  var newIdx = idx - delta;
  if (newIdx < 0 || newIdx >= _periodos.length) return;
  currentPeriodo = _periodos[newIdx];
  await mergeProductividad(currentPeriodo);
  updatePeriodoUI();
  renderLeaderboard(true);
  if (typeof renderResumen === 'function') renderResumen();
  if (typeof renderPremios === 'function') renderPremios();
};

window.togglePeriodoTodo = async function () {
  _periodoTodo = !_periodoTodo;
  if (_periodoTodo) {
    await mergeProductividadTodo();
  } else {
    await mergeProductividad(currentPeriodo);
  }
  updatePeriodoUI();
  renderLeaderboard(true);
  if (typeof renderResumen === 'function') renderResumen();
  if (typeof renderPremios === 'function') renderPremios();
};

// ==========================================
// PREMIOS — Carrera de metas (caja de leche)
// ==========================================
async function renderPremios() {
  var container = document.getElementById('premios-body');
  if (!container) return;

  // Ganadores bloqueados (1º a 100%) del período seleccionado
  var primeroByCat = {};
  if (!_periodoTodo && currentPeriodo && window.PickingAPI && PickingAPI.isReady()) {
    var rows = await PickingAPI.getPremiosPrimero(currentPeriodo);
    (rows || []).forEach(function (r) { primeroByCat[r.categoria] = r; });
  }

  var html = '';
  if (_periodoTodo) {
    html += `<div class="premios-note">Los premios se calculan por mes. Elegí un mes en el navegador de arriba.</div>`;
  }

  CATEGORIAS.forEach(function (cat) {
    var info = CATEGORIA_INFO[cat];
    var grupo = pickers
      .filter(function (p) { return pickerCategoria(p) === cat; })
      .map(function (p) { return { p: p, pct: getMetaPercent(p), items: pickerItems(p) }; })
      .sort(function (a, b) { return b.pct - a.pct || b.items - a.items; });

    var primero = primeroByCat[cat];
    // Si el "primero" bloqueado ya no está en esta categoría (reasignado), ignorarlo
    if (primero && !grupo.some(function (x) { return x.p.codigo === primero.preparador_codigo; })) {
      primero = null;
    }
    var primeroCode = primero ? primero.preparador_codigo : null;
    // Lazy: si no hay primero válido pero el líder ya está ≥100%, ese es el 1º (y se persiste)
    if (!primero && !_periodoTodo && currentPeriodo && grupo.length && grupo[0].pct >= 100) {
      var top = grupo[0];
      primeroCode = top.p.codigo;
      primero = { preparador_codigo: primeroCode, preparador_nombre: top.p.name, meta_pct: top.pct };
      if (window.PickingAPI && PickingAPI.isReady()) {
        PickingAPI.setPrimero(currentPeriodo, { categoria: cat, code: primeroCode, name: top.p.name, metaPct: top.pct });
      }
    }
    var club110 = grupo.filter(function (x) { return x.pct >= 110; });
    var totalCajas = (primero ? 1 : 0) + club110.length;

    html += `<section class="premio-cat" style="--cat:${info.color};--cat-soft:${info.soft}">
      <div class="premio-cat-head">
        <span class="cat-header__icon">${info.icon}</span>
        <span class="premio-cat-title">${info.label}</span>
        <span class="premio-cat-cajas">${MILK_ICON}<b>${totalCajas}</b> caja${totalCajas !== 1 ? 's' : ''}</span>
      </div>
      <div class="premio-legend">
        <span class="premio-legend-item"><span class="chk chk--gold">${DCHECK_ICON}</span> 1º a 100%</span>
        <span class="premio-legend-item"><span class="chk chk--milk">${CHECK_ICON}</span> Llegó a 110%</span>
      </div>`;

    html += `<div class="premio-race">`;
    if (!grupo.length) {
      html += `<div class="cat-empty">Sin preparadores</div>`;
    } else {
      grupo.forEach(function (x, i) {
        var p = x.p, pct = x.pct;
        var barW = Math.max(0, Math.min(pct, 110)) / 110 * 100;
        var cls = pct >= 110 ? 'is-110' : pct >= 100 ? 'is-100' : pct >= 80 ? 'is-mid' : 'is-low';
        var isPrimero = p.codigo && p.codigo === primeroCode;
        var is110 = pct >= 110;
        var imgSrc = p.avatarType === 'preset' ? (PRESET_AVATARS[p.avatarValue] || PRESET_AVATARS.avatar1) : p.avatarValue;
        html += `<div class="premio-row ${cls}${isPrimero ? ' is-first' : ''}">
          <span class="premio-row-pos">${i + 1}</span>
          <img class="premio-row-img" src="${imgSrc}" alt="">
          <div class="premio-row-main">
            <div class="premio-row-top">
              <span class="premio-row-name" title="${p.name}">${p.name}</span>
              <span class="premio-row-pct">${pct}%</span>
            </div>
            <div class="premio-row-bar"><div class="premio-row-fill" style="width:${barW}%"></div></div>
          </div>
          <div class="premio-checks">
            <span class="chk chk--gold${isPrimero ? '' : ' chk--off'}" title="1º a 100%">${DCHECK_ICON}</span>
            <span class="chk chk--milk${is110 ? '' : ' chk--off'}" title="Llegó a 110%">${CHECK_ICON}</span>
          </div>
        </div>`;
      });
    }
    html += `</div></section>`;
  });

  container.innerHTML = html;
}
window.renderPremios = renderPremios;

async function mergeProductividadTodo() {
  if (!window.PickingAPI || !PickingAPI.isReady()) return;
  const rows = await PickingAPI.getProductividad(null); // todos los períodos
  if (!rows) return;
  const sums = {};
  rows.forEach(function (r) {
    const c = r.preparador_codigo;
    if (!sums[c]) sums[c] = { items: 0, unidades: 0, monto: 0 };
    // "Ítems Preparados" = suma de Cont.Art (columna items); líneas WMS = referencia
    sums[c].items += Number(r.items) || 0;
    sums[c].unidades += Number(r.lineas) || 0;
    sums[c].monto += Number(r.monto) || 0;
  });
  pickers.forEach(function (p) {
    const s = sums[p.codigo];
    if (s) {
      p.items = s.items;
      p.unidades = s.unidades;
      p.monto = s.monto;
      p.score = p.items;
    } else {
      p.items = 0; p.unidades = 0; p.monto = 0; p.score = 0;
    }
  });
}

async function mergeProductividad(periodo) {
  if (!window.PickingAPI || !PickingAPI.isReady()) return;
  const rows = await PickingAPI.getProductividad(periodo);
  if (!rows) return;
  const byCode = {};
  rows.forEach(function (r) { byCode[r.preparador_codigo] = r; });
  pickers.forEach(function (p) {
    const r = byCode[p.codigo];
    if (r) {
      // "Ítems Preparados" = suma de Cont.Art (columna items); líneas WMS = referencia
      p.items = Number(r.items) || 0;
      p.unidades = Number(r.lineas) || 0;
      p.monto = Number(r.monto) || 0;
      p.score = p.items;
    } else {
      p.items = 0; p.unidades = 0; p.monto = 0; p.score = 0;
    }
  });
}

function loadDataLocal() {
  const storedActive = localStorage.getItem("picking_pickers");
  if (storedActive) {
    try {
      pickers = JSON.parse(storedActive).map(p => ({
        ...p,
        deletedScore: p.deletedScore !== undefined ? parseInt(p.deletedScore, 10) : 0
      }));
    } catch (e) {
      pickers = [...MOCK_DATA];
    }
  } else {
    pickers = [...MOCK_DATA];
    saveData();
  }

  if (pickers.length >= 3 && pickers.every(p => !p.deletedScore)) {
    pickers[0].deletedScore = 18;
    pickers[1].deletedScore = 35;
    pickers[2].deletedScore = 12;
    saveData();
  }

  const storedDeleted = localStorage.getItem("picking_deleted_pickers");
  if (storedDeleted) {
    try {
      deletedPickers = JSON.parse(storedDeleted).map(p => ({
        ...p,
        deletedScore: p.deletedScore !== undefined ? parseInt(p.deletedScore, 10) : 0
      }));
    } catch (e) {
      deletedPickers = [];
    }
  } else {
    deletedPickers = [];
  }

  const storedGoal = localStorage.getItem("picking_target_goal");
  if (storedGoal) {
    const parsed = parseInt(storedGoal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetGoal = parsed;
    }
  }
}

function saveData() {
  localStorage.setItem("picking_pickers", JSON.stringify(pickers));
  localStorage.setItem("picking_deleted_pickers", JSON.stringify(deletedPickers));
  localStorage.setItem("picking_target_goal", targetGoal.toString());
}

function updatePickersListAndTrends(newList) {
  const storedActive = localStorage.getItem("picking_pickers");
  let oldRankMap = {};
  if (storedActive) {
    try {
      const oldSorted = JSON.parse(storedActive).sort((a, b) => b.score - a.score);
      oldSorted.forEach((p, idx) => {
        oldRankMap[p.id] = idx + 1;
      });
    } catch (e) {}
  }

  newList.sort((a, b) => b.score - a.score);

  newList.forEach((picker, idx) => {
    const currentRank = idx + 1;
    const oldRank = oldRankMap[picker.id];
    picker.prevRank = oldRank !== undefined ? oldRank : currentRank;
  });

  pickers = newList;
  saveData();
}

function getRemainingPickers() {
  const categoriesList = ["PLENO", "JUNIOR", "APRENDIZ", "EMPAQUE"];
  var remaining = [];
  
  categoriesList.forEach(function (cat) {
    var catPickers = pickers
      .filter(function (p) { return pickerCategoria(p) === cat; })
      .sort(function (a, b) { return b.score - a.score; });
      
    catPickers.forEach(function (p, idx) {
      if (idx >= 3) {
        remaining.push(Object.assign({}, p, { catRank: idx + 1 }));
      }
    });
  });
  
  remaining.sort(function (a, b) { return b.score - a.score; });
  return remaining;
}

// ==========================================
// RENDERIZADO Y ANIMACIONES
// ==========================================
function renderLeaderboard(isInitial = false) {
  const goalInput = document.getElementById("plant-goal-input");
  if (goalInput) goalInput.value = targetGoal;

  pickers.sort((a, b) => b.score - a.score);
  updateStatsCards();

  const container = document.getElementById("pillars-container");
  if (!container) return;

  if (pickers.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px; color: var(--text-muted); background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color);">
        <p style="font-weight: 500; font-size: 1.1rem; color: var(--text-main);">No hay preparadores activos.</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Usa el botón de Administración para agregar uno nuevo o restaurarlos.</p>
      </div>
    `;
    return;
  }

  // Roster real pero sin datos del mes
  if (window._pickingFromDB && pickers.every(function (p) { return !p.items; })) {
    container.innerHTML = `
      <div class="empty-state" style="margin:auto; text-align: center; padding: 48px 60px; color: var(--text-muted); background: #ffffff; border-radius: 16px; border: 1px solid var(--border-color); max-width: 420px;">
        <svg width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 16px; display: block;">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <p style="font-weight: 600; font-size: 1rem; color: var(--text-main);">Sin datos de productividad</p>
      </div>
    `;
    return;
  }

  // 1 columna por categoría — TOP 3 de cada una (pilares 3D)
  let html = "";

  // Agregar pestañas de navegación para el podio
  html += `
    <div class="podium-tabs-nav">
      <button class="tab-btn ${window._activeCategory === 'all' ? 'active' : ''}" onclick="setPodiumActiveCategory('all')">Todos</button>
      <button class="tab-btn ${window._activeCategory === 'PLENO' ? 'active' : ''}" onclick="setPodiumActiveCategory('PLENO')">Pleno</button>
      <button class="tab-btn ${window._activeCategory === 'JUNIOR' ? 'active' : ''}" onclick="setPodiumActiveCategory('JUNIOR')">Junior</button>
      <button class="tab-btn ${window._activeCategory === 'APRENDIZ' ? 'active' : ''}" onclick="setPodiumActiveCategory('APRENDIZ')">Aprendiz</button>
      <button class="tab-btn ${window._activeCategory === 'EMPAQUE' ? 'active' : ''}" onclick="setPodiumActiveCategory('EMPAQUE')">Empaque</button>
      <button class="tab-btn ${window._activeCategory === 'rest' ? 'active' : ''}" onclick="setPodiumActiveCategory('rest')">Posiciones</button>
      <button class="tab-btn autoplay-btn ${window._podiumAutoplay ? 'playing' : ''}" onclick="togglePodiumAutoplay()" title="Auto-ciclo">
        <span class="icon">${window._podiumAutoplay ? '⏸' : '▶'}</span> Auto-ciclo
        ${window._podiumAutoplay ? '<span class="autoplay-indicator"><span class="autoplay-progress"></span></span>' : ''}
      </button>
    </div>
  `;

  if (window._activeCategory === "rest") {
    var remaining = getRemainingPickers();
    html += `
      <div class="cat-podium cat-podium--full-width" style="--cat: #0B5F8D; --cat-soft: rgba(11, 95, 141, 0.08); width: 100%;">
        <div class="cat-header cat-header--podium">
          <span class="cat-header__icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </span>
          <span class="cat-header__title">Posiciones</span>
        </div>
        <div class="remaining-table-card">
          <table class="remaining-table">
            <thead>
              <tr>
                <th style="width: 80px; text-align: center;">Puesto</th>
                <th>Preparador</th>
                <th style="width: 140px; text-align: center;">Categoría</th>
                <th style="text-align: right; width: 180px;">Monto</th>
                <th style="text-align: right; width: 120px;">Items</th>
                <th style="text-align: right; width: 200px;">Meta Mensual</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (remaining.length === 0) {
      html += `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Todo el equipo se encuentra actualmente en el Podio (Top 3 de cada categoría).
          </td>
        </tr>
      `;
    } else {
      remaining.forEach(function(p) {
        var moneyVal = pickerMonto(p);
        var totalItems = pickerItems(p);
        var goalPercent = getMetaPercent(p);
        var catInfo = CATEGORIA_INFO[pickerCategoria(p)];
        var imgSrc = p.avatarType === "preset"
          ? (PRESET_AVATARS[p.avatarValue] || PRESET_AVATARS.avatar1)
          : p.avatarValue;

        html += `
          <tr>
            <td class="col-rank">#${p.catRank}</td>
            <td class="col-name">
              <img src="${imgSrc}" class="table-avatar" alt="${p.name}">
              <span class="name-text">${p.name}</span>
            </td>
            <td class="col-cat" style="text-align: center;">
              <span class="cat-pill" style="--cat-color: ${catInfo.color}; --cat-bg: ${catInfo.soft};">${catInfo.label}</span>
            </td>
            <td class="col-monto">Gs. ${moneyVal.toLocaleString('es-PY')}</td>
            <td class="col-items">${totalItems.toLocaleString()}</td>
            <td class="col-meta">
              <div class="table-meta-cell">
                <span class="pct-text">${goalPercent}%</span>
                <div class="table-bar-track">
                  <div class="table-bar-fill" style="width: ${Math.min(goalPercent, 100)}%; background: ${goalPercent >= 100 ? '#10b981' : '#f59e0b'};"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;

    // Animación suave de entrada de filas
    gsap.fromTo(container.querySelectorAll(".remaining-table tbody tr"),
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power2.out" }
    );
  } else {
    CATEGORIAS.forEach(function (cat) {
      if (window._activeCategory !== "all" && window._activeCategory !== cat) {
        return;
      }
      var info = CATEGORIA_INFO[cat];
      var grupo = pickers
        .filter(function (p) { return pickerCategoria(p) === cat; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 3);

      html += `<div class="cat-podium" style="--cat:${info.color};--cat-soft:${info.soft}">
        <div class="cat-header cat-header--podium">
          <span class="cat-header__icon">${info.icon}</span>
          <span class="cat-header__title">${info.label}</span>
          <span class="cat-header__count">${grupo.length}</span>
        </div>`;

      if (!grupo.length) {
        html += `<div class="cat-podium-empty">Sin preparadores en esta categoría</div></div>`;
        return;
      }

      // Escala relativa al líder de ESTA categoría
      var maxItemsCat = Math.max.apply(null, grupo.map(pickerItems).concat([1]));
      var maxMontoCat = Math.max.apply(null, grupo.map(pickerMonto).concat([1]));

      html += `<div class="cat-podium-row">`;
      grupo.forEach(function (picker, index) {
        html += pillarCardHTML(picker, index + 1, maxItemsCat, maxMontoCat, isInitial);
      });
      html += `</div></div>`;
    });

    container.innerHTML = html;

    const cards = container.querySelectorAll(".pillar-card");
    if (isInitial) {
      // Animación de Entrada Frontal Limpia y Nítida (Deslizar hacia arriba sin mareos)
      gsap.fromTo(cards, 
        {
          opacity: 0,
          scale: 0.96,
          y: 45
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "all", // Limpia propiedades para que tome las reglas puras del CSS plano
          onComplete: () => {
            animateBarsAndNumbers(container);
          }
        }
      );
    } else {
      animateBarsAndNumbers(container);
    }
  }
}

// Función de bucle de flotación continua 3D (Antigravitacional)


function pillarCardHTML(picker, rank, maxItemsPodium, maxMontoPodium, isInitial) {
  var imgSrc = picker.avatarType === "preset"
    ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
    : picker.avatarValue;

  var percentOfGoal = getMetaPercent(picker);
  var totalItems = pickerItems(picker);
  var moneyValuePYG = pickerMonto(picker);

  // Computar porcentajes horizontales (escalados a max de la categoria)
  var itemsPercent = (totalItems / maxItemsPodium) * 100;
  var moneyPercent = (moneyValuePYG / maxMontoPodium) * 100;

  var metaClass = "meta-danger";
  if (percentOfGoal >= 100) metaClass = "meta-success";
  else if (percentOfGoal >= 90) metaClass = "meta-warning";

  var prevRank = picker.prevRank !== undefined ? picker.prevRank : rank;
  var trendClass = "stable", trendSymbol = "▬", trendTitle = "Posición estable";
  if (prevRank > rank) { trendClass = "up"; trendSymbol = "▲"; trendTitle = `Subió ${prevRank - rank} posiciones`; }
  else if (prevRank < rank) { trendClass = "down"; trendSymbol = "▼"; trendTitle = `Bajó ${rank - prevRank} posiciones`; }

  var pickerMetaItems = getPickerMeta(picker).metaItemsMes;
  var rankLabel = rank.toString();

  return `
    <div class="pillar-card rank-${rank}" data-id="${picker.id}" data-meta-items="${pickerMetaItems}" data-max-items="${maxItemsPodium}" data-max-monto="${maxMontoPodium}">
      <!-- Medalla de Puesto Flotante 3D -->
      <div class="medal-3d rank-${rank}">${rankLabel}</div>

      <!-- Cabecera: Avatar circular sin brillo de fondo de color -->
      <div class="avatar-3d-wrapper">
        <img class="avatar-3d-img" src="${imgSrc}" alt="${picker.name}">
        <div class="trend-badge trend-${trendClass}" title="${trendTitle}">${trendSymbol}</div>
      </div>

      <!-- Nombre -->
      <span class="pillar-name" title="${picker.name}">${picker.name}</span>

      <!-- Cámara 3D Skyscraper (Columnas Verticales Físicas con Riel de Cristal) -->
      <div class="skyscraper-chamber">
        <!-- Riel Monto -->
        <div class="skyscraper-track track-monto">
          <div class="skyscraper-fill fill-monto" style="height: ${isInitial ? 0 : moneyPercent}%">
            <div class="skyscraper-glow"></div>
          </div>
          <span class="skyscraper-label">Monto</span>
        </div>
        
        <!-- Riel Items -->
        <div class="skyscraper-track track-items">
          <div class="skyscraper-fill fill-items" style="height: ${isInitial ? 0 : itemsPercent}%">
            <div class="skyscraper-glow"></div>
          </div>
          <span class="skyscraper-label">Items</span>
        </div>
      </div>

      <!-- Grid de Métricas Cockpit (Monto y Items horizontales lado a lado) -->
      <div class="cockpit-grid">
        <div class="cockpit-cell cell-monto">
          <span class="cell-lbl">Monto</span>
          <span class="cell-val val-monto monto-val" data-target="${moneyValuePYG}" data-current="${isInitial ? 0 : moneyValuePYG}">Gs. ${isInitial ? 0 : moneyValuePYG.toLocaleString('es-PY')}</span>
        </div>
        <div class="cockpit-cell cell-items">
          <span class="cell-lbl">Items</span>
          <span class="cell-val val-items items-val" data-target="${totalItems}" data-current="${isInitial ? 0 : totalItems}">${isInitial ? 0 : totalItems.toLocaleString()}</span>
        </div>
      </div>

      <!-- Meta Chip con Progreso Glaseado -->
      <div class="cockpit-meta ${metaClass}">
        <div class="meta-meta-row">
          <span class="meta-lbl">Meta</span>
          <span class="meta-val val-meta meta-val">${isInitial ? 0 : percentOfGoal}%</span>
        </div>
        <div class="meta-bar-track">
          <div class="meta-bar-fill" style="width: ${isInitial ? 0 : Math.min(percentOfGoal, 100)}%"></div>
        </div>
      </div>
      
      ${rank <= 3 ? `<div class="podium-pedestal-base rank-${rank}-pedestal"></div>` : ""}
    </div>
  `;
}

function animateBarsAndNumbers(container) {
  const cards = container.querySelectorAll(".pillar-card");

  cards.forEach(card => {
    const fillMonto = card.querySelector(".skyscraper-fill.fill-monto");
    const fillItems = card.querySelector(".skyscraper-fill.fill-items");
    const fillMeta = card.querySelector(".meta-bar-fill");
    const metaVal = card.querySelector(".meta-val");
    const montoVal = card.querySelector(".monto-val");
    const itemsVal = card.querySelector(".items-val");

    if (montoVal && itemsVal) {
      const targetMonto = parseInt(montoVal.dataset.target, 10);
      const targetItems = parseInt(itemsVal.dataset.target, 10);
      const currentMonto = parseInt(montoVal.dataset.current || "0", 10);
      const currentItems = parseInt(itemsVal.dataset.current || "0", 10);

      const maxItems = parseFloat(card.dataset.maxItems) || 1;
      const maxMonto = parseFloat(card.dataset.maxMonto) || 1;
      const cardMetaItems = parseInt(card.dataset.metaItems, 10) || 1;

      const animObj = { monto: currentMonto, items: currentItems };

      gsap.to(animObj, {
        monto: targetMonto, items: targetItems,
        duration: 1.6, ease: "power3.out",
        onUpdate: () => {
          montoVal.dataset.current = Math.round(animObj.monto).toString();
          itemsVal.dataset.current = Math.round(animObj.items).toString();

          const montoPercent = (animObj.monto / maxMonto) * 100;
          const itemsPercent = (animObj.items / maxItems) * 100;
          const percentOfGoal = cardMetaItems > 0 ? Math.round((Math.round(animObj.items) / cardMetaItems) * 100) : 0;

          // Animar las columnas verticales (Skyscrapers)
          if (fillMonto) fillMonto.style.height = Math.min(montoPercent, 100) + "%";
          if (fillItems) fillItems.style.height = Math.min(itemsPercent, 100) + "%";
          
          // Animar la barra de meta horizontal
          if (fillMeta) fillMeta.style.width = Math.min(percentOfGoal, 100) + "%";

          montoVal.innerText = `Gs. ${Math.round(animObj.monto).toLocaleString('es-PY')}`;
          itemsVal.innerText = `${Math.round(animObj.items).toLocaleString()}`;

          const cockpitMeta = card.querySelector(".cockpit-meta");
          if (cockpitMeta && metaVal) {
            metaVal.innerText = `${percentOfGoal}%`;
            
            cockpitMeta.classList.remove("meta-success", "meta-warning", "meta-danger");
            if (percentOfGoal >= 100) cockpitMeta.classList.add("meta-success");
            else if (percentOfGoal >= 90) cockpitMeta.classList.add("meta-warning");
            else cockpitMeta.classList.add("meta-danger");
          }
        }
      });
    }
  });
}

function updateStatsCards() {
  // Stats cards removed — dashboard.js handles the full dashboard now
}


window.updatePlantGoal = function (event) {
  event.preventDefault();
  if (!window._alasCanEdit) return;

  const input = document.getElementById("plant-goal-input");
  const value = parseInt(input.value, 10);
  if (isNaN(value) || value <= 0) {
    alert("Por favor ingresa una meta válida mayor que 0.");
    return;
  }
  targetGoal = value;
  saveData();
  renderLeaderboard(false);
};

// ==========================================
// ADMIN VIEW
// ==========================================
window.openAdminDrawer = function () { switchView('admin'); };
window.closeAdminDrawer = function () {};

function renderAdminView() {
  renderAdminGrid();
}

function catHeaderHTML(cat, count) {
  var info = CATEGORIA_INFO[cat];
  return `<div class="cat-header" style="--cat:${info.color};--cat-soft:${info.soft}">
    <span class="cat-header__icon">${info.icon}</span>
    <span class="cat-header__title">${info.label}</span>
    <span class="cat-header__count">${count}</span>
  </div>`;
}

function admCatSelectHTML(picker, canEdit) {
  var cur = pickerCategoria(picker);
  if (!canEdit) {
    var ci = CATEGORIA_INFO[cur];
    return `<div class="adm-cat-badge" style="--cat:${ci.color};--cat-soft:${ci.soft}">${ci.icon}<span>${ci.label}</span></div>`;
  }
  return `<div class="adm-cat-select">` + CATEGORIAS.map(function (c) {
    var ci = CATEGORIA_INFO[c];
    var active = cur === c ? ' active' : '';
    return `<button type="button" class="adm-cat-opt${active}" style="--cat:${ci.color};--cat-soft:${ci.soft}" onclick="updatePickerCategoria('${picker.id}','${c}')">${ci.label}</button>`;
  }).join('') + `</div>`;
}

function renderAdminGrid() {
  var container = document.getElementById('admin-grid-container');
  if (!container) return;
  pickers.sort((a, b) => b.score - a.score);

  var canEdit = window._alasCanEdit;
  var html = '';

  if (canEdit) {
    html += `
      <div class="adm-newbar">
        <div class="adm-card adm-card-new" onclick="openNewPickerModal()">
          <div class="adm-new-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="adm-card-name" style="color:var(--text-muted);">Nuevo Preparador</span>
        </div>
      </div>
    `;
  }

  html += '<div class="adm-cols">';
  CATEGORIAS.forEach(function (cat) {
    var info = CATEGORIA_INFO[cat];
    var grupo = pickers.filter(function (p) { return pickerCategoria(p) === cat; });
    html += `<div class="adm-cat-col" style="--cat:${info.color};--cat-soft:${info.soft}">`;
    html += catHeaderHTML(cat, grupo.length);
    if (!grupo.length) { html += `<div class="cat-empty">Sin preparadores en esta categoría</div></div>`; return; }
    html += `<div class="adm-cat-cards">`;

    grupo.forEach(function (picker) {
      var imgSrc = picker.avatarType === 'preset'
        ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
        : picker.avatarValue;

      var meta = getPickerMeta(picker);
      var readonlyAttr = canEdit ? '' : 'readonly';
      var fmtItems = meta.metaItemsMes.toLocaleString('es-PY');

      html += `
        <div class="adm-card" data-id="${picker.id}">
          ${canEdit ? `<button class="adm-card-del" title="Eliminar preparador" onclick="deletePreparadorAdmin('${picker.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>` : ''}
          <div class="adm-card-photo">
            <img src="${imgSrc}" alt="${picker.name}">
            ${canEdit ? `<label class="adm-card-photo-edit" title="Cambiar foto">
              <input type="file" style="display:none" accept="image/*" onchange="updatePickerPhoto('${picker.id}', event)">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </label>` : ''}
          </div>
          <span class="adm-card-name" title="${picker.name}">${picker.name}</span>
          ${admCatSelectHTML(picker, canEdit)}
          <div class="adm-card-meta">
            <span class="adm-meta-label">Meta de ítems / mes</span>
            <div class="adm-meta-row">
              <span class="adm-meta-key">Ítems</span>
              <input type="text" inputmode="numeric" class="adm-meta-input" value="${fmtItems}"
                onfocus="metaFocus(this)" oninput="metaFormat(this)"
                onchange="updatePickerMeta('${picker.id}','metaItemsMes',this.value)" ${readonlyAttr}>
            </div>
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
  });
  html += '</div>';

  container.innerHTML = html;
}

window.updatePickerCategoria = async function (id, categoria) {
  if (!window._alasCanEdit) return;
  if (CATEGORIAS.indexOf(categoria) === -1) return;
  var picker = pickers.find(p => p.id === id);
  if (!picker || picker.categoria === categoria) return;
  picker.categoria = categoria;
  saveData();
  renderAdminGrid();
  renderLeaderboard(false);

  if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
    showToast('Guardando…', 'loading');
    var ok = await PickingAPI.updatePreparadorCategoria(picker.codigo, categoria);
    showToast(ok ? 'Categoría: ' + (CATEGORIA_INFO[categoria].label) : 'No se pudo guardar en la nube', ok ? 'success' : 'error');
  } else {
    showToast('Categoría guardada localmente', 'success');
  }
};

window.openNewPickerModal = function () {
  document.getElementById("modal-edit-id").value = "__new__";
  document.getElementById("modal-title").textContent = "Nuevo Preparador";
  document.getElementById("modal-name-input").value = "";
  document.getElementById("modal-score-input").value = "0";
  document.getElementById("modal-deleted-score-input").value = "0";

  var codInput = document.getElementById("modal-codigo-input");
  if (codInput) { codInput.value = ""; codInput.readOnly = false; codInput.style.opacity = ""; }

  var submitBtn = document.getElementById("modal-submit-btn");
  if (submitBtn) submitBtn.textContent = "Crear Preparador";

  var form = document.getElementById("modal-edit-form");
  form.dataset.avatarType = "preset";
  form.dataset.avatarValue = "avatar1";

  document.querySelectorAll("#modal-avatar-picker .avatar-option").forEach(opt => opt.classList.remove("selected"));
  var first = document.querySelector("#modal-avatar-picker .avatar-option[data-avatar='avatar1']");
  if (first) first.classList.add("selected");

  var fileLabel = document.querySelector("#modal-avatar-picker .file-upload-btn");
  if (fileLabel) { fileLabel.style.borderColor = "var(--text-muted)"; fileLabel.style.color = "var(--text-muted)"; }
  document.getElementById("modal-file-input").value = "";

  document.getElementById("edit-modal-overlay").classList.add("active");
};

// Redimensiona + comprime una imagen a un cuadrado de maxSize px (JPEG)
function resizeImageToDataURL(file, maxSize, cb) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height;
      // recorte cuadrado centrado
      var side = Math.min(w, h);
      var sx = (w - side) / 2, sy = (h - side) / 2;
      var canvas = document.createElement('canvas');
      canvas.width = maxSize;
      canvas.height = maxSize;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
      try {
        cb(canvas.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        cb(e.target.result); // fallback al original si falla el canvas
      }
    };
    img.onerror = function () { cb(e.target.result); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

window.updatePickerPhoto = function (id, event) {
  var file = event.target.files[0];
  if (!file || !window._alasCanEdit) return;
  resizeImageToDataURL(file, 256, function (dataUrl) {
    var picker = pickers.find(function (p) { return p.id === id; });
    if (!picker) return;
    picker.avatarType = 'uploaded';
    picker.avatarValue = dataUrl;
    saveData();
    renderAdminGrid();
    renderLeaderboard(false);

    // Persistir en Supabase
    if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
      PickingAPI.updatePreparadorFoto(picker.codigo, 'uploaded', dataUrl);
    }
  });
};

// ── Modal de confirmación reutilizable (rojo + blanco, animado) ──
function showConfirm(opts) {
  var overlay = document.getElementById('confirm-overlay');
  if (!overlay) { if (confirm(opts.message)) opts.onConfirm(); return; }

  var titleEl = document.getElementById('confirm-title');
  var msgEl = document.getElementById('confirm-msg');
  var okBtn = document.getElementById('confirm-ok');
  var cancelBtn = document.getElementById('confirm-cancel');

  if (titleEl) titleEl.textContent = opts.title || 'Confirmar';
  if (msgEl) msgEl.innerHTML = opts.message || '';
  if (okBtn) okBtn.textContent = opts.okLabel || 'Eliminar';

  function close() {
    overlay.classList.remove('active');
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    overlay.onclick = null;
  }

  okBtn.onclick = function () { close(); if (opts.onConfirm) opts.onConfirm(); };
  cancelBtn.onclick = close;
  overlay.onclick = function (e) { if (e.target === overlay) close(); };

  overlay.classList.add('active');
}

window.deletePreparadorAdmin = function (id) {
  if (!window._alasCanEdit) return;
  var picker = pickers.find(function (p) { return p.id === id; });
  if (!picker) return;

  showConfirm({
    title: 'Eliminar preparador',
    message: '¿Seguro que querés eliminar a <strong>' + picker.name + '</strong>? No aparecerá más en el ranking ni en la configuración.',
    okLabel: 'Eliminar',
    onConfirm: function () {
      var card = document.querySelector('.adm-card[data-id="' + id + '"]');
      var onDone = function () {
        pickers = pickers.filter(function (p) { return p.id !== id; });
        saveData();
        renderAdminGrid();
        renderLeaderboard(false);
        if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
          PickingAPI.deletePreparador(picker.codigo);
        }
      };
      if (card) {
        gsap.to(card, { opacity: 0, scale: 0.9, y: 8, duration: 0.25, ease: 'power2.in', onComplete: onDone });
      } else {
        onDone();
      }
    }
  });
};

// ==========================================
// AVATARES
// ==========================================
function selectPresetAvatar(element, avatarName) {
  document.querySelectorAll(".adm-pre, .avatar-option").forEach(opt => opt.classList.remove("selected"));
  element.classList.add("selected");
  selectedAvatarType = "preset";
  selectedAvatarValue = avatarName;
  updateAdminAvatarPreview();
}

function selectPresetAvatarModal(element, avatarName) {
  document.querySelectorAll("#modal-avatar-picker .avatar-option").forEach(opt => opt.classList.remove("selected"));
  element.classList.add("selected");
  const form = document.getElementById("modal-edit-form");
  form.dataset.avatarType = "preset";
  form.dataset.avatarValue = avatarName;
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.querySelectorAll(".adm-pre, .avatar-option").forEach(opt => opt.classList.remove("selected"));
    selectedAvatarType = "uploaded";
    selectedAvatarValue = e.target.result;
    updateAdminAvatarPreview();
  };
  reader.readAsDataURL(file);
}

function handleFileUploadModal(event) {
  const file = event.target.files[0];
  if (!file) return;
  resizeImageToDataURL(file, 256, function (dataUrl) {
    document.querySelectorAll("#modal-avatar-picker .avatar-option").forEach(opt => opt.classList.remove("selected"));
    const form = document.getElementById("modal-edit-form");
    form.dataset.avatarType = "uploaded";
    form.dataset.avatarValue = dataUrl;
    const fileLabel = document.querySelector("#modal-avatar-picker .file-upload-btn");
    fileLabel.style.borderColor = "#0B5F8D";
    fileLabel.style.color = "#0B5F8D";
  });
}

// ==========================================
// CRUD
// ==========================================
function handleFormSubmit(event) {
  event.preventDefault();
  if (!window._alasCanEdit) return;

  const nameInput = document.getElementById("picker-name-input");
  const scoreInput = document.getElementById("picker-score-input");
  const deletedScoreInput = document.getElementById("picker-deleted-score-input");

  const name = nameInput.value.trim();
  const score = parseInt(scoreInput.value, 10);
  const deletedScore = parseInt(deletedScoreInput.value, 10) || 0;
  if (!name || isNaN(score)) return;

  pickers.push({
    id: "picker_" + Date.now(), name, score, deletedScore,
    avatarType: selectedAvatarType, avatarValue: selectedAvatarValue
  });
  updatePickersListAndTrends(pickers);

  nameInput.value = "";
  scoreInput.value = "";
  deletedScoreInput.value = "";
  selectedAvatarType = "preset";
  selectedAvatarValue = "avatar1";

  document.querySelectorAll(".adm-pre").forEach(opt => opt.classList.remove("selected"));
  var firstPreset = document.querySelector(".adm-pre[data-avatar='avatar1']");
  if (firstPreset) firstPreset.classList.add("selected");
  var fileInput = document.getElementById("picker-file-input");
  if (fileInput) fileInput.value = "";
  updateAdminAvatarPreview();

  renderLeaderboard(false);
  renderAdminGrid();
}

function renderManageList() { renderAdminGrid(); }

function deletePicker(id) {
  if (!window._alasCanEdit) return;
  const pickerIndex = pickers.findIndex(p => p.id === id);
  if (pickerIndex === -1) return;

  const deletedPicker = pickers[pickerIndex];
  const element = document.querySelector(`.pillar-card[data-id="${id}"]`);
  const manageElement = document.querySelector(`.manage-picker-item[data-manage-id="${id}"]`);

  const onDone = () => {
    const nextPickers = pickers.filter(p => p.id !== id);
    deletedPickers.push(deletedPicker);
    updatePickersListAndTrends(nextPickers);
    renderLeaderboard(false);
    renderManageList();
    renderTrashList();
  };

  const targets = [];
  if (element) targets.push(element);
  if (manageElement) targets.push(manageElement);

  if (targets.length) {
    gsap.to(targets, { opacity: 0, scale: 0.8, x: 30, duration: 0.35, stagger: 0.05, onComplete: onDone });
  } else {
    onDone();
  }
}

function renderTrashList() {
  var container = document.getElementById("trash-list-container");
  var footer = document.getElementById("trash-footer");
  if (!container) return;

  if (deletedPickers.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-size:0.85rem;">La papelera está vacía</div>';
    if (footer) footer.style.display = "none";
    return;
  }

  if (footer) footer.style.display = window._alasCanEdit ? "block" : "none";
  var html = "";

  deletedPickers.forEach(picker => {
    var imgSrc = picker.avatarType === "preset"
      ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
      : picker.avatarValue;

    var canEdit = window._alasCanEdit;
    var restoreBtn = canEdit ? `<button class="btn" onclick="restorePicker('${picker.id}')"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Restaurar</button>` : '';
    var deleteBtn = canEdit ? `<button class="btn btn-danger" onclick="deletePickerPermanently('${picker.id}')"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Eliminar</button>` : '';

    html += `
      <div class="admin-trash-card" data-trash-id="${picker.id}">
        <div class="admin-card-avatar"><img src="${imgSrc}" alt="${picker.name}"></div>
        <span class="admin-card-name">${picker.name}</span>
        <div class="admin-card-stats">
          <div class="admin-card-stat"><span class="admin-card-stat-val">${picker.score}</span><span class="admin-card-stat-lbl">Picks/H</span></div>
        </div>
        <div class="admin-card-actions">${restoreBtn}${deleteBtn}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.restorePicker = function (id) {
  if (!window._alasCanEdit) return;
  const pickerIndex = deletedPickers.findIndex(p => p.id === id);
  if (pickerIndex === -1) return;

  const restoredPicker = deletedPickers[pickerIndex];
  const element = document.querySelector(`[data-trash-id="${id}"]`);

  const onDone = () => {
    deletedPickers = deletedPickers.filter(p => p.id !== id);
    pickers.push(restoredPicker);
    updatePickersListAndTrends(pickers);
    renderLeaderboard(false);
    renderManageList();
    renderTrashList();
  };

  if (element) {
    gsap.to(element, { opacity: 0, x: -30, duration: 0.3, onComplete: onDone });
  } else {
    onDone();
  }
};

window.deletePickerPermanently = function (id) {
  if (!window._alasCanEdit) return;
  if (!confirm("¿Estás seguro de que deseas eliminar permanentemente a este preparador? Esta acción no se puede deshacer.")) return;

  const element = document.querySelector(`[data-trash-id="${id}"]`);
  const onDone = () => {
    deletedPickers = deletedPickers.filter(p => p.id !== id);
    saveData();
    renderTrashList();
  };

  if (element) {
    gsap.to(element, { opacity: 0, scale: 0.8, duration: 0.3, onComplete: onDone });
  } else {
    onDone();
  }
};

window.emptyTrash = function () {
  if (!window._alasCanEdit) return;
  if (!confirm("¿Deseas vaciar toda la papelera? Todos los preparadores aquí guardados se eliminarán definitivamente.")) return;

  const items = document.getElementById("trash-list-container").querySelectorAll(".manage-picker-item");
  gsap.to(items, {
    opacity: 0, y: -15, duration: 0.3, stagger: 0.05,
    onComplete: () => {
      deletedPickers = [];
      saveData();
      renderTrashList();
    }
  });
};

// ==========================================
// METAS INDIVIDUALES
// ==========================================
// Items/monto reales (de la importación) o derivados (demo/fallback)
function pickerItems(p) {
  return (window._pickingFromDB && p.items != null) ? p.items : (p.score || 0) * 8;
}
function pickerMonto(p) {
  return (window._pickingFromDB && p.monto != null) ? p.monto : Math.round((p.score || 0) * 8 * ratePerItem * 7500);
}

function getPickerMeta(picker) {
  var defaultItems = targetGoal * 8;
  var defaultMonto = Math.round(defaultItems * ratePerItem * 7500);
  return {
    metaItemsMes: picker.metaItemsMes || defaultItems,
    metaMontoMes: picker.metaMontoMes || defaultMonto
  };
}

function getMetaPercent(picker) {
  var meta = getPickerMeta(picker);
  var totalItems = pickerItems(picker);
  if (meta.metaItemsMes <= 0) return 0;
  return Math.round((totalItems / meta.metaItemsMes) * 100);
}

function renderMetasList() {
  var container = document.getElementById("metas-list-container");
  if (!container) return;

  var globalInput = document.getElementById("meta-global-items");
  if (globalInput && !globalInput.value) {
    globalInput.value = targetGoal * 8;
  }

  if (pickers.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;font-size:0.8rem;color:var(--text-muted);">Sin preparadores activos</div>';
    return;
  }

  pickers.sort((a, b) => b.score - a.score);
  var html = "";

  pickers.forEach(picker => {
    var meta = getPickerMeta(picker);
    var totalItems = (window._pickingFromDB && picker.items != null) ? picker.items : picker.score * 8;
    var moneyNet = (window._pickingFromDB && picker.monto != null) ? picker.monto : Math.round(totalItems * ratePerItem * 7500);
    var pct = getMetaPercent(picker);

    var pctClass = pct >= 100 ? "above" : pct >= 80 ? "near" : "below";
    var progressColor = pct >= 100 ? "#10b981" : pct >= 80 ? "#f59e0b" : "#ef4444";
    var progressW = Math.min(pct, 100);

    var imgSrc = picker.avatarType === "preset"
      ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
      : picker.avatarValue;

    var readonlyAttr = window._alasCanEdit ? '' : 'readonly style="opacity:.5;cursor:not-allowed"';

    html += `
      <div class="meta-picker-card" data-meta-id="${picker.id}">
        <div class="meta-picker-header">
          <div class="manage-picker-avatar"><img src="${imgSrc}" alt="${picker.name}"></div>
          <span class="meta-picker-name">${picker.name}</span>
          <span class="meta-picker-pct ${pctClass}">${pct}%</span>
        </div>
        <div class="meta-inputs-row">
          <div class="meta-field">
            <label>Meta Items / Mes</label>
            <input type="number" value="${meta.metaItemsMes}" min="1"
              onchange="updatePickerMeta('${picker.id}','metaItemsMes',this.value)" ${readonlyAttr}>
          </div>
          <div class="meta-field">
            <label>Meta Monto Gs. / Mes</label>
            <input type="number" value="${meta.metaMontoMes}" min="1"
              onchange="updatePickerMeta('${picker.id}','metaMontoMes',this.value)" ${readonlyAttr}>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:0.68rem;color:var(--text-muted);">
          <span>Actual: ${totalItems.toLocaleString()} items · Gs. ${moneyNet.toLocaleString('es-PY')}</span>
        </div>
        <div class="meta-progress-bar">
          <div class="meta-progress-fill" style="width:${progressW}%;background:${progressColor};"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ── Formateo de inputs de meta (separador de miles) ──
window.metaFocus = function (el) { try { el.select(); } catch (e) {} };

window.metaFormat = function (el) {
  var digits = el.value.replace(/\D/g, '');
  if (!digits) { el.value = ''; return; }
  var selEnd = el.selectionStart;
  var digitsBefore = el.value.slice(0, selEnd).replace(/\D/g, '').length;
  var formatted = parseInt(digits, 10).toLocaleString('es-PY');
  el.value = formatted;
  // reposicionar cursor según dígitos antes del cursor
  var pos = formatted.length, count = 0;
  for (var i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted.charAt(i))) count++;
    if (count >= digitsBefore) { pos = i + 1; break; }
  }
  try { el.setSelectionRange(pos, pos); } catch (e) {}
};

window.updatePickerMeta = async function (id, field, value) {
  if (!window._alasCanEdit) return;
  var val = parseInt(String(value).replace(/\D/g, ''), 10);
  if (isNaN(val) || val <= 0) { showToast('Ingresá un número válido', 'error'); return; }

  var picker = pickers.find(p => p.id === id);
  if (!picker) return;
  picker[field] = val;
  saveData();
  renderLeaderboard(false);

  // Persistir en Supabase y confirmar
  if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
    showToast('Guardando…', 'loading');
    var ok = await PickingAPI.updatePreparadorMeta(picker.codigo, field, val);
    if (ok) {
      showToast('Meta guardada: ' + val.toLocaleString('es-PY') + ' ítems', 'success');
    } else {
      showToast('No se pudo guardar en la nube', 'error');
    }
  } else {
    showToast('Meta guardada localmente', 'success');
  }
};

// ── Toast de confirmación ──────────────────────────────────
var _toastTimer = null;
function showToast(message, type) {
  var el = document.getElementById('toast');
  if (!el) return;
  type = type || 'success';
  var icons = {
    success: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    loading: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" class="toast-spin"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>'
  };
  el.className = 'toast toast-' + type + ' show';
  el.innerHTML = (icons[type] || '') + '<span>' + message + '</span>';
  if (_toastTimer) clearTimeout(_toastTimer);
  if (type !== 'loading') {
    _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
}
window.showToast = showToast;

window.applyGlobalMeta = function () {
  if (!window._alasCanEdit) return;
  var input = document.getElementById("meta-global-items");
  var val = parseInt(input.value, 10);
  if (isNaN(val) || val <= 0) {
    alert("Ingresa un valor válido de items por mes.");
    return;
  }

  var montoDefault = Math.round(val * ratePerItem * 7500);
  pickers.forEach(p => {
    p.metaItemsMes = val;
    p.metaMontoMes = montoDefault;
  });
  saveData();
  renderMetasList();
  renderLeaderboard(false);
};

// ==========================================
// MODAL EDICIÓN
// ==========================================
function openEditModal(id) {
  if (!window._alasCanEdit) return;
  const picker = pickers.find(p => p.id === id);
  if (!picker) return;

  document.getElementById("modal-edit-id").value = picker.id;
  document.getElementById("modal-title").textContent = "Editar Preparador";
  document.getElementById("modal-name-input").value = picker.name;
  document.getElementById("modal-score-input").value = picker.score || 0;
  document.getElementById("modal-deleted-score-input").value = 0;

  var codInput = document.getElementById("modal-codigo-input");
  if (codInput) {
    codInput.value = picker.codigo || "";
    // El código es la clave de matcheo — no se cambia al editar
    codInput.readOnly = true;
    codInput.style.opacity = "0.6";
  }

  var submitBtn = document.getElementById("modal-submit-btn");
  if (submitBtn) submitBtn.textContent = "Guardar Cambios";

  const form = document.getElementById("modal-edit-form");
  form.dataset.avatarType = picker.avatarType;
  form.dataset.avatarValue = picker.avatarValue;

  document.querySelectorAll("#modal-avatar-picker .avatar-option").forEach(opt => opt.classList.remove("selected"));
  if (picker.avatarType === "preset") {
    const selectedOpt = document.querySelector(`#modal-avatar-picker .avatar-option[data-avatar='${picker.avatarValue}']`);
    if (selectedOpt) selectedOpt.classList.add("selected");
  }

  const fileLabel = document.querySelector("#modal-avatar-picker .file-upload-btn");
  if (picker.avatarType === "uploaded") {
    fileLabel.style.borderColor = "var(--accent-blue)";
    fileLabel.style.color = "var(--accent-blue)";
  } else {
    fileLabel.style.borderColor = "var(--text-muted)";
    fileLabel.style.color = "var(--text-muted)";
  }
  document.getElementById("modal-file-input").value = "";

  document.getElementById("edit-modal-overlay").classList.add("active");
}

function closeEditModal() {
  document.getElementById("edit-modal-overlay").classList.remove("active");
}

function handleModalSubmit(event) {
  event.preventDefault();
  if (!window._alasCanEdit) return;

  const id = document.getElementById("modal-edit-id").value;
  const name = document.getElementById("modal-name-input").value.trim();
  const score = parseInt(document.getElementById("modal-score-input").value, 10) || 0;
  const deletedScore = 0;
  const form = document.getElementById("modal-edit-form");
  const avatarType = form.dataset.avatarType;
  const avatarValue = form.dataset.avatarValue;
  var codInputEl = document.getElementById("modal-codigo-input");
  var codigoIngresado = codInputEl ? codInputEl.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

  if (!name) return;

  if (id === "__new__") {
    var newCodigo = codigoIngresado || name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || ('M' + Date.now().toString(36).toUpperCase());
    // Evitar colisión de código
    if (pickers.some(function (p) { return p.codigo === newCodigo; })) {
      alert('Ya existe un preparador con el código "' + newCodigo + '".');
      return;
    }
    var newPicker = {
      id: newCodigo, codigo: newCodigo, name: name, score: score, deletedScore: 0,
      items: 0, monto: 0, categoria: 'JUNIOR',
      avatarType: avatarType, avatarValue: avatarValue,
      metaItemsMes: targetGoal * 8, metaMontoMes: Math.round(targetGoal * 8 * ratePerItem * 7500)
    };
    pickers.push(newPicker);
    updatePickersListAndTrends(pickers);

    if (window.PickingAPI && PickingAPI.isReady()) {
      PickingAPI.upsertPreparador(newPicker);
    }
  } else {
    const pickerIndex = pickers.findIndex(p => p.id === id);
    if (pickerIndex === -1) return;
    var existingMeta = { metaItemsMes: pickers[pickerIndex].metaItemsMes, metaMontoMes: pickers[pickerIndex].metaMontoMes };
    pickers[pickerIndex] = { ...pickers[pickerIndex], name, score, deletedScore, avatarType, avatarValue, ...existingMeta };
    updatePickersListAndTrends(pickers);

    var edited = pickers.find(function (p) { return p.id === id; });
    if (edited && edited.codigo && window.PickingAPI && PickingAPI.isReady()) {
      PickingAPI.upsertPreparador(edited);
    }
  }

  closeEditModal();
  renderLeaderboard(false);
  renderAdminGrid();
}

// ==========================================
// MODO TV
// ==========================================
function setTVModeState(enableTV) {
  const existingFloating = document.getElementById("exit-tv-floating-btn");
  if (existingFloating) existingFloating.remove();

  if (enableTV) {
    document.body.classList.add("tv-mode");

    const controls = document.getElementById("header-controls");
    const buttonHTML = `
      <div class="floating-exit-tv" id="exit-tv-floating-btn">
        <button class="btn btn-primary" onclick="exitTVMode()" title="Volver al Panel">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 20h9M3 12h18M3 12l4-4M3 12l4 4"></path>
          </svg>
          Salir TV
        </button>
      </div>
    `;
    if (controls) {
      controls.insertAdjacentHTML("afterbegin", buttonHTML);
    } else {
      document.body.insertAdjacentHTML("beforeend", buttonHTML);
    }
    
    startPodiumAutoplay();
  } else {
    document.body.classList.remove("tv-mode");
    stopPodiumAutoplay();
    window._activeCategory = "all";
  }

  renderLeaderboard(true);
}

window.enterTVMode = function () { window.location.hash = "tv"; };
window.exitTVMode = function () { window.location.hash = ""; };

window.resetToMockData = function () {
  if (!window._alasCanEdit) return;
  if (!confirm("¿Deseas restaurar el ranking a la lista de demostración? Se perderán los cambios activos y la papelera.")) return;

  const container = document.getElementById("pillars-container");
  const items = container ? container.querySelectorAll(".pillar-card") : [];

  gsap.to(items, {
    opacity: 0, y: 20, duration: 0.4, stagger: 0.05,
    onComplete: () => {
      pickers = JSON.parse(JSON.stringify(MOCK_DATA));
      pickers.forEach((p, idx) => { p.prevRank = idx + 1; });
      deletedPickers = [];
      targetGoal = 200;
      saveData();
      renderLeaderboard(true);
      renderManageList();
      renderTrashList();
    }
  });
};

// openSummaryModal / closeSummaryModal — delegados a dashboard.js

// ── Variables y Funciones del Auto-ciclo y Filtros de Categorías ──
window._activeCategory = window._activeCategory || "all";
window._podiumAutoplay = window._podiumAutoplay !== undefined ? window._podiumAutoplay : false;
window._autoplayTimer = window._autoplayTimer || null;

function setPodiumActiveCategory(cat) {
  window._activeCategory = cat;
  if (cat !== "all" && !document.body.classList.contains("tv-mode")) {
    if (window._podiumAutoplay) {
      stopPodiumAutoplay();
    }
  }
  renderLeaderboard(true);
}

function togglePodiumAutoplay() {
  if (window._podiumAutoplay) {
    stopPodiumAutoplay();
  } else {
    startPodiumAutoplay();
  }
  renderLeaderboard(true);
}

function startPodiumAutoplay() {
  window._podiumAutoplay = true;
  if (window._autoplayTimer) clearInterval(window._autoplayTimer);
  
  if (window._activeCategory === "all" || window._activeCategory === "rest") {
    window._activeCategory = "PLENO";
  }
  
  window._autoplayTimer = setInterval(function() {
    const cats = ["PLENO", "JUNIOR", "APRENDIZ", "EMPAQUE", "rest"];
    let idx = cats.indexOf(window._activeCategory);
    idx = (idx + 1) % cats.length;
    window._activeCategory = cats[idx];
    
    const container = document.getElementById("pillars-container");
    if (container) {
      const exitItems = container.querySelectorAll(".pillar-card, .remaining-table tbody tr");
      if (exitItems.length > 0) {
        gsap.to(exitItems, {
          opacity: 0,
          y: -20,
          duration: 0.35,
          stagger: 0.03,
          ease: "power2.in",
          onComplete: () => {
            renderLeaderboard(true);
          }
        });
      } else {
        renderLeaderboard(true);
      }
    } else {
      renderLeaderboard(true);
    }
  }, 6000);
}

function stopPodiumAutoplay() {
  window._podiumAutoplay = false;
  if (window._autoplayTimer) {
    clearInterval(window._autoplayTimer);
    window._autoplayTimer = null;
  }
}

// Exportar a global de forma segura
window.setPodiumActiveCategory = setPodiumActiveCategory;
window.togglePodiumAutoplay = togglePodiumAutoplay;
window.startPodiumAutoplay = startPodiumAutoplay;
window.stopPodiumAutoplay = stopPodiumAutoplay;
