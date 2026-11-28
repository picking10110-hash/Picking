/* ============================================================
 * otif-geo.js — Servicio geográfico del mapa de Zonas
 * ------------------------------------------------------------
 * Cruza las localidades de SAP (otif_regiones: 'S11 -LUQUE') con
 * los distritos oficiales (paraguay-distritos.js, DGEEC 2012).
 *
 * Reglas (sin inventar ubicaciones):
 *  - Se normaliza el nombre (tildes, abreviaturas: STA., CNEL., …).
 *  - ALIAS solo traduce abreviaturas de SAP al nombre oficial del
 *    MISMO distrito (P.J. CABALLERO → Pedro Juan Caballero).
 *  - Se busca primero en el departamento de SAP y, si no está, en
 *    todo el país (nombre único). SAP codifica por letra y a veces
 *    difiere del mapa oficial (ej.: Fernando de la Mora = Central).
 *  - Colonias, cruces y nombres de departamento quedan como
 *    "pendiente de georreferenciación" (null).
 *
 * Las geometrías de distritos (~260 KB) se cargan recién cuando
 * el usuario entra a un departamento.
 * ============================================================ */
(function (root) {
  'use strict';

  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/Ñ/g, 'N')
      .replace(/\bCNEL\b\.?\s*/g, 'CORONEL ').replace(/\bGRAL\b\.?\s*/g, 'GENERAL ').replace(/\bSTA\b\.?\s*/g, 'SANTA ')
      .replace(/\bSTO\b\.?\s*/g, 'SANTO ').replace(/\bMCAL\b\.?\s*/g, 'MARISCAL ').replace(/\bTTE\b\.?\s*/g, 'TENIENTE ')
      .replace(/\bPTE\b\.?\s*/g, 'PRESIDENTE ').replace(/\bPDTE\b\.?\s*/g, 'PRESIDENTE ')
      .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  // Abreviaturas de SAP → nombre oficial del distrito (mismo lugar, otra escritura)
  var ALIAS = {
    'P J CABALLERO': 'Pedro Juan Caballero', 'M R ALONSO': 'Mariano Roque Alonso', 'J A SALDIVAR': 'J Augusto Saldivar',
    'SALTO DEL GUAIRA': 'Saltos Del Guaira', 'SAN PEDRO D YCUAMAN': 'San Pedro Del Ykuamandiyu', 'YASY CANY': 'Yasy Kañy',
    'GUAYAIBI': 'Guajayvi', 'GENERAL AQUINO': 'General Elizardo Aquino', 'YBY YA U': 'Yvy Ya´U', 'ITACURUBI D L CORDIL': 'Itacurubi De La Cordillera',
    'SANTANI': 'San Estanislao', 'JUAN LEON MALLORQUIN': 'Dr. Juan Leon Mallorquin', 'COLONIA OBLIGADO': 'Obligado', 'COLONIA FRAM': 'Fram',
    'STMA TRINIDAD': 'Trinidad', 'YATAYTY DEL NORTE': 'Yataity Del Norte', 'CORPUS CRISTI': 'Corpus Christi', 'YBYCUI': 'Yvycui',
    'RAUL A OVIEDO': 'Raul Arsenio Oviedo', 'EUGENIO A GARAY': 'General Eugenio A. Garay', 'PASO YOBAY': 'Paso Yobai',
    'TENIENTE MANUEL IRALA': 'Tte 1Ro Manuel Irala Fernandez', 'J E ESTIGARRIBIA': 'J Eulogio Estigarribia', 'DR J E ESTIGARRIBIA': 'J Eulogio Estigarribia',
    'MCAL ESTIGARRIBIA': 'Mariscal Estigarribia', 'CNEL OVIEDO': 'Coronel Oviedo', 'CIUDAD DEL ESTE CDE': 'Ciudad Del Este', 'CDE': 'Ciudad Del Este',
    'DR JUAN MANUEL FRUT': 'Dr. Juan Manuel Frutos', 'DOCTOR JUAN MANUEL FRUT': 'Dr. Juan Manuel Frutos', 'ITAPUA POTY': 'Itapua Poty'
  };
  // Nombres que existen en más de un lugar y SAP no aclara: no se cruzan de departamento
  var NO_CRUZAR = { 'GENERAL DIAZ': 1 };
  var IDX = null;   // { dep: { nombreNorm: nombreOficial } } + { nombreNorm: [dep...] }
  function indexar() {
    var D = root.PY_DISTRITOS; if (!D) return null;
    var porDep = {}, global = {};
    Object.keys(D).forEach(function (dep) {
      porDep[dep] = {};
      D[dep].forEach(function (d) { var n = norm(d.n); porDep[dep][n] = d.n; (global[n] = global[n] || []).push(dep); });
    });
    IDX = { porDep: porDep, global: global };
    return IDX;
  }
  var CACHE = {};
  /** Localidad SAP → { dep, n } (distrito oficial) o null si no se puede ubicar sin inventar. */
  function distritoDe(nombreSap, depSap) {
    var key = depSap + '|' + nombreSap;
    if (key in CACHE) return CACHE[key];
    if (!IDX && !indexar()) return null;
    var base = norm(String(nombreSap || '').split(/\s+-/)[0]);
    if (ALIAS[base]) base = norm(ALIAS[base]);
    var res = null, pd = IDX.porDep[depSap];
    if (pd && pd[base]) res = { dep: depSap, n: pd[base] };
    else if (!NO_CRUZAR[base] && IDX.global[base] && IDX.global[base].length === 1) { var dg = IDX.global[base][0]; res = { dep: dg, n: IDX.porDep[dg][base] }; }
    else if (pd && base.length > 4) {
      var cand = Object.keys(pd).filter(function (n) { return n.length > 4 && (base.indexOf(n + ' ') === 0 || n.indexOf(base + ' ') === 0); });
      if (cand.length === 1) res = { dep: depSap, n: pd[cand[0]] };
    }
    // SAP corta los nombres a 20 caracteres ('SANTA ROSA DEL AGUAR'): se completa si hay uno solo que empiece igual
    if (!res && base.length >= 17) {
      var enDep = pd ? Object.keys(pd).filter(function (n) { return n.indexOf(base) === 0; }) : [];
      if (enDep.length === 1) res = { dep: depSap, n: pd[enDep[0]] };
      else if (!enDep.length && !NO_CRUZAR[base]) {
        var g = Object.keys(IDX.global).filter(function (n) { return n.indexOf(base) === 0 && IDX.global[n].length === 1; });
        if (g.length === 1) { var dg2 = IDX.global[g[0]][0]; res = { dep: dg2, n: IDX.porDep[dg2][g[0]] }; }
      }
    }
    CACHE[key] = res;
    return res;
  }
  var CARGA = null;
  function cargar() {
    if (root.PY_DISTRITOS) { if (!IDX) indexar(); return Promise.resolve(root.PY_DISTRITOS); }
    if (CARGA) return CARGA;
    CARGA = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = 'paraguay-distritos.js';
      s.onload = function () { indexar(); ok(root.PY_DISTRITOS); };
      s.onerror = function () { CARGA = null; mal(new Error('No se pudo cargar el mapa de distritos')); };
      document.head.appendChild(s);
    });
    return CARGA;
  }

  var api = { norm: norm, distritoDe: distritoDe, cargar: cargar, listo: function () { return !!root.PY_DISTRITOS; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OtifGeo = api;
})(typeof window !== 'undefined' ? window : this);
