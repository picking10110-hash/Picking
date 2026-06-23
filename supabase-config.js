/**
 * supabase-config.js — Cliente Supabase del módulo Productividad Picking
 * Proyecto dedicado: picking10110-hash (yvwslygebxuiivlzscpq)
 *
 * La anon key es pública por diseño. La seguridad real recae en RLS.
 * NUNCA poner aquí la service_role key.
 */
(function () {
  'use strict';

  var SUPABASE_URL  = 'https://yvwslygebxuiivlzscpq.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2d3NseWdlYnh1aWl2bHpzY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MzUwOTksImV4cCI6MjA5NzUxMTA5OX0.dxI7d__d-6AlyPj9epoZvn5ZiPPT-SJheViXf6y-rO4';

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
