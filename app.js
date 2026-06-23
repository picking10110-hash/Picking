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
  window._alasCanEdit = (role === 'admin' || role === 'supervisor');

  var btnAdmin = document.getElementById('btn-admin-panel');
  var roleBadge = document.getElementById('admin-role-badge');

  if (!window._alasCanEdit) {
    if (btnAdmin) {
      btnAdmin.textContent = 'Ver Ranking';
      btnAdmin.title = 'Solo visualización — no tienes permisos de edición';
    }
  }

  if (roleBadge && role !== 'admin') {
    roleBadge.textContent = role === 'supervisor' ? 'Solo lectura' : 'Sin permisos';
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
  // ── DEV BYPASS: simula sesión SSO para pruebas locales ──
  var DEV_BYPASS = true;
  var ssoUser;
  if (DEV_BYPASS) {
    ssoUser = { name: 'Dev Admin', email: 'dev@alas.local', role: 'admin', permissions: [] };
  } else {
    ssoUser = await waitForAlasAuth();
    if (!ssoUser) {
      var url = (window.ALAS_SSO_CONFIG || {}).launcherUrl || 'https://launcher-tawny.vercel.app';
      window.location.replace(url);
      return;
    }
  }

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
            metaMontoMes: r.meta_monto_mes
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

async function refreshPeriodoSelector() {
  var nav = document.getElementById('periodo-nav');
  if (!nav) return;
  if (!window.PickingAPI || !PickingAPI.isReady()) { nav.style.display = 'none'; return; }

  _periodos = (await PickingAPI.getPeriodos()) || [];
  if (!_periodos.length) { nav.style.display = 'none'; return; }

  if (!currentPeriodo || _periodos.indexOf(currentPeriodo) === -1) {
    currentPeriodo = _periodos[0];
  }
  nav.style.display = 'flex';
  updatePeriodoUI();
}

function updatePeriodoUI() {
  var label = document.getElementById('periodoLabel');
  var prev = document.getElementById('periodoPrevBtn');
  var next = document.getElementById('periodoNextBtn');
  var todo = document.getElementById('periodoTodoBtn');

  if (_periodoTodo) {
    if (label) label.textContent = 'Todos los meses';
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    if (todo) todo.classList.add('is-active');
    return;
  }

  if (todo) todo.classList.remove('is-active');
  if (label) label.textContent = fmtPeriodoLabel(currentPeriodo);

  // _periodos está en orden descendente (más nuevo primero)
  var idx = _periodos.indexOf(currentPeriodo);
  if (next) next.disabled = (idx <= 0);                       // no hay mes más nuevo
  if (prev) prev.disabled = (idx >= _periodos.length - 1);    // no hay mes más viejo
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
};

async function mergeProductividadTodo() {
  if (!window.PickingAPI || !PickingAPI.isReady()) return;
  const rows = await PickingAPI.getProductividad(null); // todos los períodos
  if (!rows) return;
  const sums = {};
  rows.forEach(function (r) {
    const c = r.preparador_codigo;
    if (!sums[c]) sums[c] = { items: 0, monto: 0 };
    sums[c].items += Number(r.items) || 0;
    sums[c].monto += Number(r.monto) || 0;
  });
  pickers.forEach(function (p) {
    const s = sums[p.codigo];
    if (s) {
      p.items = s.items;
      p.monto = s.monto;
      p.score = Math.round(p.items / 8);
    } else {
      p.items = 0; p.monto = 0; p.score = 0;
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
      p.items = Number(r.items) || 0;
      p.monto = Number(r.monto) || 0;
      p.score = Math.round(p.items / 8);
    } else {
      p.items = 0; p.monto = 0; p.score = 0;
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

  // Roster real pero sin datos del mes → invitar a importar
  if (window._pickingFromDB && pickers.every(function (p) { return !p.items; })) {
    container.innerHTML = `
      <div class="empty-state" style="margin:auto; text-align: center; padding: 60px; color: var(--text-muted); background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color); max-width: 460px;">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">📊</div>
        <p style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);">Sin datos de productividad${currentPeriodo ? ' para ' + currentPeriodo : ''}</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Andá a <strong>Cargar Datos</strong> e importá el Excel (WMS + SAP) del mes para ver el ranking.</p>
      </div>
    `;
    return;
  }

  let html = "";
  const podiumPickers = pickers.slice(0, 6);

  podiumPickers.forEach((picker, index) => {
    const rank = index + 1;

    let imgSrc = picker.avatarType === "preset"
      ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
      : picker.avatarValue;

    const percentOfGoal = getMetaPercent(picker);

    const baseHeightPercent = (Math.min(picker.score, targetGoal) / targetGoal) * 70;
    const extraHeightPercent = (Math.max(0, picker.score - targetGoal) / targetGoal) * 70;

    const totalItems = (window._pickingFromDB && picker.items != null) ? picker.items : picker.score * 8;
    const moneyValuePYG = (window._pickingFromDB && picker.monto != null) ? picker.monto : Math.round(totalItems * ratePerItem * 7500);

    const moneyHeightPercent = (picker.score / targetGoal) * 70;

    const baseItems = Math.min(picker.score, targetGoal) * 8;
    const extraItems = Math.max(0, picker.score - targetGoal) * 8;

    let metaClass = "meta-danger";
    if (percentOfGoal >= 100) metaClass = "meta-success";
    else if (percentOfGoal >= 90) metaClass = "meta-warning";

    const currentRank = rank;
    const prevRank = picker.prevRank !== undefined ? picker.prevRank : currentRank;

    let trendClass = "stable";
    let trendSymbol = "▬";
    let trendTitle = "Posición estable";

    if (prevRank > currentRank) {
      trendClass = "up";
      trendSymbol = "▲";
      trendTitle = `Subió ${prevRank - currentRank} posiciones`;
    } else if (prevRank < currentRank) {
      trendClass = "down";
      trendSymbol = "▼";
      trendTitle = `Bajó ${currentRank - prevRank} posiciones`;
    }

    const pickerMetaItems = getPickerMeta(picker).metaItemsMes;

    html += `
      <div class="pillar-card rank-${rank}" data-id="${picker.id}" data-meta-items="${pickerMetaItems}">
        <div class="pillar-avatar-container">
          <div class="avatar-3d-card-wrapper">
            <div class="avatar-3d-card">
              <img class="avatar-3d-img" src="${imgSrc}" alt="${picker.name}">
              <div class="avatar-3d-shine"></div>
            </div>
            <div class="rank-medal-badge">${rank}</div>
            <div class="rank-trend-indicator trend-${trendClass}" title="${trendTitle}">${trendSymbol}</div>
          </div>
        </div>

        <div class="pillar-dual-columns">
          ${rank <= 3 ? `<div class="podium-pedestal-base rank-${rank}-pedestal"></div>` : ""}
          <div class="pillar-3d-square pillar-monto" title="Monto Alcanzado Ganado en Guaraníes">
            <div class="pillar-segment segment-monto" style="--monto-height: ${isInitial ? 0 : moneyHeightPercent}%"></div>
          </div>
          <div class="pillar-3d-square pillar-items" title="Items preparados">
            <div class="pillar-segment segment-base ${baseItems === 0 ? 'is-empty' : ''}" style="--segment-height: ${isInitial ? 0 : baseHeightPercent}%"></div>
            <div class="pillar-segment segment-extra ${extraItems === 0 ? 'is-empty' : ''}" style="--segment-height: ${isInitial ? 0 : extraHeightPercent}%"></div>
          </div>
        </div>

        <div class="pillar-info">
          <span class="pillar-name" title="${picker.name}">${picker.name}</span>
          <div class="pillar-metrics-box">
            <div class="metric-chip chip-monto">
              <span class="chip-label">Monto Alcanzado</span>
              <span class="chip-value monto-val" data-target="${moneyValuePYG}" data-current="${isInitial ? 0 : moneyValuePYG}">Gs. ${isInitial ? 0 : moneyValuePYG.toLocaleString('es-PY')}</span>
            </div>
            <div class="metric-chip chip-items">
              <span class="chip-label">Items Preparados</span>
              <span class="chip-value items-val" data-target="${totalItems}" data-current="${isInitial ? 0 : totalItems}">${isInitial ? 0 : totalItems.toLocaleString()} U</span>
            </div>
            <div class="metric-chip chip-meta ${metaClass}">
              <span class="chip-label">Meta Alcanzada</span>
              <span class="chip-value meta-val">${isInitial ? 0 : percentOfGoal}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  const cards = container.querySelectorAll(".pillar-card");
  if (isInitial) {
    gsap.set(cards, { opacity: 0, y: 50, scale: 0.9 });
    gsap.to(cards, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.7, stagger: 0.08, ease: "back.out(1.2)",
      onComplete: () => { animateBarsAndNumbers(container); }
    });
  } else {
    animateBarsAndNumbers(container);
  }
}

function animateBarsAndNumbers(container) {
  const cards = container.querySelectorAll(".pillar-card");

  cards.forEach(card => {
    const montoSeg = card.querySelector(".pillar-segment.segment-monto");
    const baseSeg = card.querySelector(".pillar-segment.segment-base");
    const extraSeg = card.querySelector(".pillar-segment.segment-extra");
    const metaVal = card.querySelector(".meta-val");
    const montoVal = card.querySelector(".monto-val");
    const itemsVal = card.querySelector(".items-val");

    if (montoVal && itemsVal) {
      const targetMonto = parseInt(montoVal.dataset.target, 10);
      const targetItems = parseInt(itemsVal.dataset.target, 10);
      const currentMonto = parseInt(montoVal.dataset.current || "0", 10);
      const currentItems = parseInt(itemsVal.dataset.current || "0", 10);

      const animObj = { monto: currentMonto, items: currentItems };

      gsap.to(animObj, {
        monto: targetMonto, items: targetItems,
        duration: 1.4, ease: "power3.out",
        onUpdate: () => {
          montoVal.dataset.current = Math.round(animObj.monto).toString();
          itemsVal.dataset.current = Math.round(animObj.items).toString();

          const currentScoreVal = animObj.items / 8;
          const baseScoreVal = Math.min(currentScoreVal, targetGoal);
          const extraScoreVal = Math.max(0, currentScoreVal - targetGoal);

          const montoHeight = (currentScoreVal / targetGoal) * 70;
          const baseHeight = (baseScoreVal / targetGoal) * 70;
          const extraHeight = (extraScoreVal / targetGoal) * 70;
          const cardMetaItems = parseInt(card.dataset.metaItems, 10) || (targetGoal * 8);
          const percentOfGoal = cardMetaItems > 0 ? Math.round((Math.round(animObj.items) / cardMetaItems) * 100) : 0;

          if (montoSeg) montoSeg.style.setProperty("--monto-height", montoHeight + "%");
          if (baseSeg) {
            baseSeg.style.setProperty("--segment-height", baseHeight + "%");
            baseSeg.classList.toggle("is-empty", baseHeight <= 0);
          }
          if (extraSeg) {
            extraSeg.style.setProperty("--segment-height", extraHeight + "%");
            extraSeg.classList.toggle("is-empty", extraHeight <= 0);
          }

          montoVal.innerText = `Gs. ${Math.round(animObj.monto).toLocaleString('es-PY')}`;
          itemsVal.innerText = `${Math.round(animObj.items).toLocaleString()} U`;

          const chipMeta = card.querySelector(".chip-meta");
          if (chipMeta && metaVal) {
            metaVal.innerText = `${percentOfGoal}%`;
            chipMeta.classList.remove("meta-success", "meta-warning", "meta-danger");
            metaVal.style.color = "";
            if (percentOfGoal >= 100) chipMeta.classList.add("meta-success");
            else if (percentOfGoal >= 90) chipMeta.classList.add("meta-warning");
            else chipMeta.classList.add("meta-danger");
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

function renderAdminGrid() {
  var container = document.getElementById('admin-grid-container');
  if (!container) return;
  pickers.sort((a, b) => b.score - a.score);

  var canEdit = window._alasCanEdit;
  var html = '';

  if (canEdit) {
    html += `
      <div class="adm-card adm-card-new" onclick="openNewPickerModal()">
        <div class="adm-new-icon">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <span class="adm-card-name" style="color:var(--text-muted);">Nuevo Preparador</span>
      </div>
    `;
  }

  pickers.forEach((picker) => {
    var imgSrc = picker.avatarType === 'preset'
      ? (PRESET_AVATARS[picker.avatarValue] || PRESET_AVATARS.avatar1)
      : picker.avatarValue;

    var meta = getPickerMeta(picker);
    var montoFmt = 'Gs. ' + meta.metaMontoMes.toLocaleString('es-PY');
    var readonlyAttr = canEdit ? '' : 'readonly';

    html += `
      <div class="adm-card" data-id="${picker.id}">
        <div class="adm-card-photo">
          <img src="${imgSrc}" alt="${picker.name}">
          ${canEdit ? `<label class="adm-card-photo-edit">
            <input type="file" style="display:none" accept="image/*" onchange="updatePickerPhoto('${picker.id}', event)">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </label>` : ''}
        </div>
        <span class="adm-card-name">${picker.name}</span>
        <div class="adm-card-meta">
          <span class="adm-meta-label">Meta mensual</span>
          <div class="adm-meta-input-wrap">
            <span class="adm-meta-prefix">Gs.</span>
            <input type="number" class="adm-meta-input" value="${meta.metaMontoMes}"
              onchange="updatePickerMeta('${picker.id}','metaMontoMes',this.value)" ${readonlyAttr}>
          </div>
          <div class="adm-meta-input-wrap" style="margin-top:4px;">
            <span class="adm-meta-prefix" style="font-size:0.6rem;">Ítems</span>
            <input type="number" class="adm-meta-input" value="${meta.metaItemsMes}"
              onchange="updatePickerMeta('${picker.id}','metaItemsMes',this.value)" ${readonlyAttr}>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.openNewPickerModal = function () {
  document.getElementById("modal-edit-id").value = "__new__";
  document.getElementById("modal-title").textContent = "Nuevo Preparador";
  document.getElementById("modal-name-input").value = "";
  document.getElementById("modal-score-input").value = "";
  document.getElementById("modal-deleted-score-input").value = "";

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

window.updatePickerPhoto = function (id, event) {
  var file = event.target.files[0];
  if (!file || !window._alasCanEdit) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var picker = pickers.find(function (p) { return p.id === id; });
    if (!picker) return;
    picker.avatarType = 'uploaded';
    picker.avatarValue = e.target.result;
    saveData();
    renderAdminGrid();
    renderLeaderboard(false);

    // Persistir en Supabase
    if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
      PickingAPI.updatePreparadorFoto(picker.codigo, 'uploaded', e.target.result);
    }
  };
  reader.readAsDataURL(file);
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
  const reader = new FileReader();
  reader.onload = function (e) {
    document.querySelectorAll("#modal-avatar-picker .avatar-option").forEach(opt => opt.classList.remove("selected"));
    const form = document.getElementById("modal-edit-form");
    form.dataset.avatarType = "uploaded";
    form.dataset.avatarValue = e.target.result;
    const fileLabel = document.querySelector("#modal-avatar-picker .file-upload-btn");
    fileLabel.style.borderColor = "var(--accent-blue)";
    fileLabel.style.color = "var(--accent-blue)";
  };
  reader.readAsDataURL(file);
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
function getPickerMeta(picker) {
  var defaultItems = targetGoal * 8;
  var defaultMonto = Math.round(defaultItems * ratePerItem * 7500);
  return {
    metaItemsMes: picker.metaItemsMes || defaultItems,
    metaMontoMes: picker.metaMontoMes || defaultMonto
  };
}

function getPickerNetMonto(picker) {
  var netItems = (picker.score - (picker.deletedScore || 0)) * 8;
  return Math.round(netItems * ratePerItem * 7500);
}

function getMetaPercent(picker) {
  var meta = getPickerMeta(picker);
  var totalItems = picker.score * 8;
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

window.updatePickerMeta = function (id, field, value) {
  if (!window._alasCanEdit) return;
  var val = parseInt(value, 10);
  if (isNaN(val) || val <= 0) return;

  var picker = pickers.find(p => p.id === id);
  if (!picker) return;
  picker[field] = val;
  saveData();
  renderLeaderboard(false);

  // Persistir en Supabase
  if (picker.codigo && window.PickingAPI && PickingAPI.isReady()) {
    PickingAPI.updatePreparadorMeta(picker.codigo, field, val);
  }
};

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
  document.getElementById("modal-name-input").value = picker.name;
  document.getElementById("modal-score-input").value = picker.score;
  document.getElementById("modal-deleted-score-input").value = picker.deletedScore !== undefined ? picker.deletedScore : 0;

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
  const score = parseInt(document.getElementById("modal-score-input").value, 10);
  const deletedScore = parseInt(document.getElementById("modal-deleted-score-input").value, 10) || 0;
  const form = document.getElementById("modal-edit-form");
  const avatarType = form.dataset.avatarType;
  const avatarValue = form.dataset.avatarValue;

  if (!name || isNaN(score)) return;

  if (id === "__new__") {
    var newCodigo = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || ('M' + Date.now().toString(36).toUpperCase());
    // Evitar colisión de código
    if (pickers.some(function (p) { return p.codigo === newCodigo; })) {
      newCodigo = newCodigo.slice(0, 8) + Date.now().toString(36).slice(-4).toUpperCase();
    }
    var newPicker = {
      id: newCodigo, codigo: newCodigo, name: name, score: score, deletedScore: 0,
      items: score * 8, monto: Math.round(score * 8 * ratePerItem * 7500),
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

    document.body.insertAdjacentHTML("beforeend", `
      <div class="floating-exit-tv" id="exit-tv-floating-btn">
        <button class="btn btn-primary" onclick="exitTVMode()" title="Volver al Panel">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 20h9M3 12h18M3 12l4-4M3 12l4 4"></path>
          </svg>
          Salir TV
        </button>
      </div>
    `);
  } else {
    document.body.classList.remove("tv-mode");
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
