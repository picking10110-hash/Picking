/**
 * supabase-config.js — Cliente Supabase del módulo Productividad Picking
 * Proyecto compartido con Items Borrados: lcc1alasdeposito-a11y (zglcxunmohgtnwhwuhoq)
 * Migrado desde yvwslygebxuiivlzscpq el 2026-11-26 (ese proyecto se libera).
 *
 * La anon key es pública por diseño. La seguridad real recae en RLS.
 * NUNCA poner aquí la service_role key.
 */
(function () {
  'use strict';

  var SUPABASE_URL  = 'https://zglcxunmohgtnwhwuhoq.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbGN4dW5tb2hndG53aHd1aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjE4MzEsImV4cCI6MjA5NDY5NzgzMX0.aeHx1WmjYy1rGfaCRQDAms1UdmebgNvYGB0WxTDCuxA';

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.warn('[Picking] supabase-js no cargado todavía.');
    window.__pickingDB = null;
    return;
  }

  window.__pickingDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false }
  });

  console.info('[Picking] Supabase conectado:', SUPABASE_URL);
})();
