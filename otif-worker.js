/* ============================================================
 * otif-worker.js — Lee y procesa el Excel de SAP en segundo plano
 * ------------------------------------------------------------
 * Hacerlo acá (Web Worker) deja libre la pantalla para que la
 * animación de carga siga fluida. Usa el mismo otif-import.js.
 *
 * Lectura: primero por partes (otif-xlsx.js), que aguanta el
 * export de un mes completo (~400 MB de XML). Si el navegador no
 * lo soporta o el archivo no es .xlsx, cae a SheetJS.
 * ============================================================ */
/* global importScripts, XLSX, OtifImport, OtifXlsx */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'otif-import.js', 'otif-xlsx.js');

function esZip(buf) { var b = new Uint8Array(buf, 0, Math.min(4, buf.byteLength)); return b[0] === 0x50 && b[1] === 0x4b; }

self.onmessage = async function (e) {
  try {
    var buf = e.data.buf, res = null;
    self.postMessage({ t: 'fase', fase: 'leer' });
    if (OtifXlsx.soportado() && esZip(buf)) {
      try {
        var lt = await OtifXlsx.leerFilas(new Blob([buf]), {
          columnas: OtifImport.COLUMNAS,
          alProgreso: function (p) { self.postMessage({ t: 'prog', p: p }); }
        });
        self.postMessage({ t: 'fase', fase: 'procesar' });
        res = lt.ok ? OtifImport.parsearFilas(lt.filas, lt.columnas) : { ok: false, error: lt.error };
      } catch (eS) {
        res = null;                                  // xlsx raro: probamos con SheetJS
      }
    }
    if (!res) {
      var wb = XLSX.read(buf, { type: 'array' });
      self.postMessage({ t: 'fase', fase: 'procesar' });
      res = OtifImport.parsear(XLSX, wb);
    }
    self.postMessage({ t: 'fin', res: res });
  } catch (err) {
    self.postMessage({ t: 'error', msg: err && err.message ? err.message : String(err) });
  }
};
