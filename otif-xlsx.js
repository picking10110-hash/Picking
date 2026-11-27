/* ============================================================
 * otif-xlsx.js — Lector de .xlsx por partes (streaming)
 * ------------------------------------------------------------
 * El export de SAP de un mes completo trae una hoja de ~400 MB
 * de XML sin comprimir. SheetJS la arma entera como un solo texto
 * y el navegador no la soporta: la hoja se pierde ("no tiene
 * hojas"). Este lector descomprime la hoja de a pedazos con el
 * DecompressionStream nativo y arma solo las columnas que usa el
 * importador, sin tener nunca el XML completo en memoria.
 *
 * Devuelve filas iguales a XLSX.utils.sheet_to_json(ws,
 * { defval: null, raw: true }): mismo nombre de columnas
 * (duplicadas → "Nombre_1"), strings tal cual y números como Number.
 * Funciona en navegador, Web Worker y Node 18+.
 * ============================================================ */
(function (root) {
  'use strict';

  function soportado() {
    return typeof DecompressionStream === 'function' && typeof TextDecoder === 'function' && typeof Blob === 'function';
  }

  // ── ZIP: directorio central → { nombre: { off, csize, method } } ──
  async function leerZip(blob) {
    var tam = blob.size, desde = Math.max(0, tam - 65557);
    var cola = new DataView(await blob.slice(desde, tam).arrayBuffer());
    var eocd = -1;
    for (var i = cola.byteLength - 22; i >= 0; i--) if (cola.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('El archivo no es un Excel .xlsx válido.');
    var n = cola.getUint16(eocd + 10, true), cdSize = cola.getUint32(eocd + 12, true), cdOff = cola.getUint32(eocd + 16, true);
    var cd = new DataView(await blob.slice(cdOff, cdOff + cdSize).arrayBuffer()), dec = new TextDecoder();
    var ents = {}, p = 0;
    for (var k = 0; k < n && p + 46 <= cd.byteLength; k++) {
      if (cd.getUint32(p, true) !== 0x02014b50) break;
      var method = cd.getUint16(p + 10, true), csize = cd.getUint32(p + 20, true);
      var nl = cd.getUint16(p + 28, true), xl = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true), off = cd.getUint32(p + 42, true);
      var nombre = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nl));
      ents[nombre] = { off: off, csize: csize, method: method };
      p += 46 + nl + xl + cl;
    }
    return ents;
  }

  // Stream de texto de una parte del zip; alProgreso(bytesComprimidosLeídos)
  async function streamParte(blob, e, alProgreso) {
    var lh = new DataView(await blob.slice(e.off, e.off + 30).arrayBuffer());
    if (lh.getUint32(0, true) !== 0x04034b50) throw new Error('Excel dañado (cabecera interna).');
    var ini = e.off + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    var s = blob.slice(ini, ini + e.csize).stream();
    if (alProgreso) {
      var leidos = 0;
      s = s.pipeThrough(new TransformStream({ transform: function (ch, ctl) { leidos += ch.byteLength; alProgreso(leidos); ctl.enqueue(ch); } }));
    }
    if (e.method === 8) s = s.pipeThrough(new DecompressionStream('deflate-raw'));
    else if (e.method !== 0) throw new Error('Excel con compresión no soportada.');
    return s;
  }
  async function textoParte(blob, e) {
    var rd = (await streamParte(blob, e)).getReader(), dec = new TextDecoder('utf-8'), out = '';
    for (;;) { var r = await rd.read(); if (r.done) break; out += dec.decode(r.value, { stream: true }); }
    return out + dec.decode();
  }

  // ── XML ──
  function unesc(s) {
    if (s.indexOf('&') >= 0) s = s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, c) {
      if (c === 'amp') return '&'; if (c === 'lt') return '<'; if (c === 'gt') return '>'; if (c === 'quot') return '"'; if (c === 'apos') return "'";
      return String.fromCodePoint(c[1] === 'x' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10));
    });
    if (s.indexOf('_x') >= 0) s = s.replace(/_x([0-9a-fA-F]{4})_/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); });
    return s;
  }
  // Texto de un <si>/<is>: concatena los <t> (sin las guías fonéticas <rPh>)
  function textoRico(x) {
    x = x.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
    var out = '', re = /<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g, m;
    while ((m = re.exec(x))) out += m[1] || '';
    return unesc(out);
  }
  function compartidos(xml) {
    var sst = [], re = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g, m;
    while ((m = re.exec(xml))) sst.push(m[1] ? textoRico(m[1]) : '');
    return sst;
  }
  function attr(a, nombre) { var m = a.match(new RegExp('\\b' + nombre + '="([^"]*)"')); return m ? m[1] : null; }
  var RE_T = /\bt="(\w+)"/, RE_R = /\br="([A-Z]+)/;
  function colIdx(ref) { var n = 0; for (var i = 0; i < ref.length; i++) { var c = ref.charCodeAt(i); if (c < 65 || c > 90) break; n = n * 26 + c - 64; } return n - 1; }

  // Primera hoja del libro (igual que SheetNames[0])
  async function rutaPrimeraHoja(blob, ents) {
    var wbE = ents['xl/workbook.xml'];
    if (!wbE) throw new Error('El archivo no es un Excel .xlsx válido.');
    var wb = await textoParte(blob, wbE), sh = wb.match(/<sheet\b[^>]*>/);
    if (!sh) return null;
    var rid = attr(sh[0], 'r:id'), relE = ents['xl/_rels/workbook.xml.rels'];
    if (rid && relE) {
      var rels = await textoParte(blob, relE), re = /<Relationship\b[^>]*>/g, m;
      while ((m = re.exec(rels))) if (attr(m[0], 'Id') === rid) {
        var t = attr(m[0], 'Target'); if (!t) break;
        t = t.charAt(0) === '/' ? t.slice(1) : 'xl/' + t;
        if (ents[t]) return t;
      }
    }
    return ents['xl/worksheets/sheet1.xml'] ? 'xl/worksheets/sheet1.xml' : null;
  }

  /**
   * Lee la primera hoja como filas de objetos.
   * opts.columnas: nombres a conservar (el resto se descarta; null = todas)
   * opts.alProgreso(fraccion 0..1)
   */
  async function leerFilas(fuente, opts) {
    opts = opts || {};
    var blob = fuente instanceof Blob ? fuente : new Blob([fuente]);
    var ents = await leerZip(blob);
    var ruta = await rutaPrimeraHoja(blob, ents);
    if (!ruta) return { ok: false, error: 'El archivo no tiene hojas.' };
    var sst = ents['xl/sharedStrings.xml'] ? compartidos(await textoParte(blob, ents['xl/sharedStrings.xml'])) : [];

    var hoja = ents[ruta], total = hoja.csize || 1, ultimoAviso = 0;
    var avisar = opts.alProgreso ? function (b) { var f = b / total; if (f - ultimoAviso >= .01 || f >= 1) { ultimoAviso = f; opts.alProgreso(Math.min(1, f)); } } : null;
    var rd = (await streamParte(blob, hoja, avisar)).getReader(), dec = new TextDecoder('utf-8');

    var quiero = opts.columnas ? new Set(opts.columnas) : null;
    var cab = null, mapa = null, nombres = null, filas = [];
    var reRow = /<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g, reC = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

    function valor(a, cuerpo) {
      if (!cuerpo) return null;
      var mt = RE_T.exec(a), t = mt ? mt[1] : null;
      if (t === 'inlineStr') { var is = cuerpo.match(/<is>([\s\S]*?)<\/is>/); return is ? textoRico(is[1]) : null; }
      var v = cuerpo.match(/<v>([\s\S]*?)<\/v>/); if (!v) return null;
      var s = v[1];
      if (t === 's') { var x = sst[+s]; return x === undefined ? null : x; }
      if (t === 'str') return unesc(s);
      if (t === 'b') return s.trim() === '1';
      if (t === 'e') return null;
      var n = parseFloat(s); return isNaN(n) ? unesc(s) : n;
    }
    function celdas(cuerpo) {
      var out = [], m, col = -1; reC.lastIndex = 0;
      while ((m = reC.exec(cuerpo))) {
        var mr = RE_R.exec(m[1]); col = mr ? colIdx(mr[1]) : col + 1;
        out.push([col, m[1], m[2]]);
      }
      return out;
    }
    function procesarFila(cuerpo) {
      if (!cuerpo) return;
      var cs = celdas(cuerpo);
      if (!cab) {                                   // cabecera: mismos nombres que sheet_to_json
        cab = []; var vistos = {};
        cs.forEach(function (c) {
          var v = valor(c[1], c[2]); var nom = v == null || v === '' ? '__EMPTY' : String(v);
          if (vistos[nom]) { var k = 1; while (vistos[nom + '_' + k]) k++; nom = nom + '_' + k; }
          vistos[nom] = 1; cab[c[0]] = nom;
        });
        mapa = {}; nombres = [];
        cab.forEach(function (nom, i) { if (nom && (!quiero || quiero.has(nom))) { mapa[i] = nom; nombres.push(nom); } });
        return;
      }
      var fila = null;
      for (var j = 0; j < cs.length; j++) {
        var nom = mapa[cs[j][0]]; if (!nom) continue;
        var v = valor(cs[j][1], cs[j][2]); if (v == null) continue;
        if (!fila) { fila = {}; for (var q = 0; q < nombres.length; q++) fila[nombres[q]] = null; }
        fila[nom] = v;
      }
      if (fila) filas.push(fila);                   // filas en blanco se omiten (como sheet_to_json)
    }

    var buf = '';
    for (;;) {
      var r = await rd.read();
      buf += r.done ? dec.decode() : dec.decode(r.value, { stream: true });
      var fin = buf.lastIndexOf('</row>');
      if (fin >= 0) {
        var seg = buf.slice(0, fin + 6); buf = buf.slice(fin + 6);
        reRow.lastIndex = 0; var m;
        while ((m = reRow.exec(seg))) procesarFila(m[1]);
      }
      if (r.done) break;
    }
    if (!cab) return { ok: false, error: 'La hoja está vacía.' };
    // Si no hubo datos, devolvemos igual la cabecera para validar columnas
    return { ok: true, filas: filas, columnas: nombres };
  }

  var api = { soportado: soportado, leerFilas: leerFilas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OtifXlsx = api;
})(typeof self !== 'undefined' ? self : this);
