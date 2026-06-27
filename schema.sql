-- ============================================================
-- PRODUCTIVIDAD PICKING — Schema Supabase
-- Proyecto: picking10110-hash (yvwslygebxuiivlzscpq)
-- Ejecutar en Supabase Studio → SQL Editor
-- Idempotente: se puede correr varias veces sin romper nada.
-- ============================================================

-- ── 1. PREPARADORES (perfiles maestros) ─────────────────────
create table if not exists public.preparadores (
  id              uuid primary key default gen_random_uuid(),
  codigo          text unique not null,              -- ej: GROJAS, ECABRERA
  nombre          text not null,                     -- ej: GUILLERMO ROJAS
  avatar_type     text not null default 'preset',    -- 'preset' | 'uploaded'
  avatar_value    text not null default 'avatar1',   -- nombre preset o base64/URL
  meta_monto_mes  bigint not null default 18000000,  -- meta mensual en Gs.
  meta_items_mes  integer not null default 1600,     -- meta mensual en ítems
  categoria       text not null default 'JUNIOR',    -- PLENO | JUNIOR | APRENDIZ
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Migración idempotente: agrega categoria si la tabla ya existía
alter table public.preparadores add column if not exists categoria text not null default 'JUNIOR';

-- ── 2. IMPORTACIONES (cada carga de Excel) ──────────────────
create table if not exists public.importaciones (
  id              uuid primary key default gen_random_uuid(),
  periodo         text not null,                     -- 'YYYY-MM' ej: '2026-06'
  nombre_archivo  text,
  fecha_carga     timestamptz not null default now(),
  total_monto     bigint not null default 0,
  total_items     numeric not null default 0,
  total_lineas    integer not null default 0,
  total_pedidos   integer not null default 0,
  total_preparadores integer not null default 0
);

create index if not exists idx_importaciones_periodo on public.importaciones (periodo);

-- ── 3. PRODUCTIVIDAD (datos por preparador por importación) ──
create table if not exists public.productividad (
  id              uuid primary key default gen_random_uuid(),
  importacion_id  uuid not null references public.importaciones(id) on delete cascade,
  periodo         text not null,                     -- denormalizado para filtrar rápido
  preparador_codigo text not null,                   -- ej: GROJAS
  preparador_nombre text not null,
  lineas          integer not null default 0,
  items           numeric not null default 0,
  monto           bigint not null default 0,
  pedidos         integer not null default 0,
  ticket_promedio bigint not null default 0,
  items_por_pedido integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_productividad_periodo on public.productividad (periodo);
create index if not exists idx_productividad_importacion on public.productividad (importacion_id);
create index if not exists idx_productividad_codigo on public.productividad (preparador_codigo);

-- ── 4. PREMIOS PRIMERO (1º en llegar a 100% por categoría/período) ──
-- Se bloquea cronológicamente: la PRIMERA importación que detecta a alguien
-- ≥100% en una categoría fija al ganador (on conflict do nothing).
create table if not exists public.premios_primero (
  periodo           text not null,                   -- 'YYYY-MM'
  categoria         text not null,                   -- PLENO | JUNIOR | APRENDIZ
  preparador_codigo text not null,
  preparador_nombre text,
  meta_pct          integer not null default 0,
  created_at        timestamptz not null default now(),
  primary key (periodo, categoria)
);

-- ── Trigger updated_at en preparadores ──────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_preparadores_updated on public.preparadores;
create trigger trg_preparadores_updated
  before update on public.preparadores
  for each row execute function public.set_updated_at();

-- ============================================================
-- RLS — Row Level Security
-- Módulo interno detrás del SSO del Launcher. Política permisiva
-- para anon (lectura/escritura), igual que Calculadora de Flete.
-- ============================================================
alter table public.preparadores  enable row level security;
alter table public.importaciones enable row level security;
alter table public.productividad enable row level security;
alter table public.premios_primero enable row level security;

-- preparadores
drop policy if exists "anon_all_preparadores" on public.preparadores;
create policy "anon_all_preparadores" on public.preparadores
  for all to anon using (true) with check (true);

-- importaciones
drop policy if exists "anon_all_importaciones" on public.importaciones;
create policy "anon_all_importaciones" on public.importaciones
  for all to anon using (true) with check (true);

-- productividad
drop policy if exists "anon_all_productividad" on public.productividad;
create policy "anon_all_productividad" on public.productividad
  for all to anon using (true) with check (true);

-- premios_primero
drop policy if exists "anon_all_premios_primero" on public.premios_primero;
create policy "anon_all_premios_primero" on public.premios_primero
  for all to anon using (true) with check (true);

-- ============================================================
-- SEED — preparadores iniciales (los 17 del diccionario)
-- Solo inserta si no existen (por codigo único).
-- ============================================================
insert into public.preparadores (codigo, nombre) values
  ('ETRIGO',    'HENRI TRIGO'),
  ('ADUO',      'ALEX DUO'),
  ('RZORRILLA', 'ROBERTO ZORRILLA'),
  ('GROJAS',    'GUILLERMO ROJAS'),
  ('JMORALES',  'JUAN MORALES'),
  ('RGRACIA',   'ROBERTO GRACIA'),
  ('ICABRERA',  'IVAN CABRERA'),
  ('EFLEITAS',  'EDUARDO FLEITAS'),
  ('ECABRERA',  'ELIAS CABRERA'),
  ('IPAREDES',  'ISMAEL PAREDES'),
  ('ROVELAR',   'RAFAEL OVELAR'),
  ('KGONZALES', 'KEVIN GONZALEZ'),
  ('LBRANDELL', 'LISANDRO BRANDELL'),
  ('DSOSA',     'DARWIN SOSA'),
  ('VIAQUINO',  'VICTOR AQUINO'),
  ('MNUNEZ',    'MAURICIO NUÑEZ'),
  ('FROMAN',    'FEDERICO ROMAN')
on conflict (codigo) do nothing;
