/* ============================================================
 * otif-worker.js — Lee y procesa el Excel de SAP en segundo plano
 * ------------------------------------------------------------
 * Un Excel de ~17.000 líneas tarda varios segundos en leerse.
 * Hacerlo acá (Web Worker) deja libre la pantalla para que la
 * animación de carga siga fluida. Usa el mismo otif-import.js.
 * ============================================================ */
/* global importScripts, XLSX, OtifImport */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'otif-import.js');

self.onmessage = function (e) {
  try {
    self.postMessage({ t: 'fase', fase: 'leer' });
    var wb = XLSX.read(e.data.buf, { type: 'array' });
    self.postMessage({ t: 'fase', fase: 'procesar' });
    var res = OtifImport.parsear(XLSX, wb);
    self.postMessage({ t: 'fin', res: res });
  } catch (err) {
    self.postMessage({ t: 'error', msg: err && err.message ? err.message : String(err) });
  }
};
