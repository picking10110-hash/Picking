-- ============================================================
-- REPORTE DE PEDIDOS EN TIEMPO Y FORMA (OTIF) — Schema Supabase
-- Proyecto: picking10110-hash (yvwslygebxuiivlzscpq)
-- Fuente: export SAP de pedidos/entregas (132 columnas, 1 fila = pedido + posición)
-- Ejecutar en Supabase Studio → SQL Editor. Idempotente.
-- ============================================================

-- ── 1. IMPORTACIONES (cada Excel subido) ────────────────────
create table if not exists public.otif_importaciones (
  id             uuid primary key default gen_random_uuid(),
  archivo        text,
  cargado_en     timestamptz not null default now(),
  cargado_por    text,
  filas          integer not null default 0,
  pedidos        integer not null default 0,
  entregas       integer not null default 0,
  pedidos_nuevos integer not null default 0,
  carga_desde    date,               -- rango de "Fecha Carga" del Excel
  carga_hasta    date
);

-- ── 2. REGIONES (Region SAP → departamento → zona) ───────────
-- La letra del código SAP es el departamento (A=Asunción, S=Central, ...).
-- Editable: el SLA se busca por departamento y zona.
create table if not exists public.otif_regiones (
  region_cod   text primary key,     -- 'S11'
  nombre       text not null,        -- 'LUQUE'
  departamento text not null,
  zona         text not null         -- 'Capital' | 'Interior'
);

-- ── 3. PEDIDOS (datos que no cambian entre líneas del pedido) ─
create table if not exists public.otif_pedidos (
  doc_vtas        text primary key,  -- Doc.vtas.
  fecha_carga     timestamptz not null,  -- Fecha Carga + Hora Carga (inicio del reloj)
  clase_doc       text,              -- ClDoc (ZCRE, ZCOS, ZDEV...)
  cond_exp        text,              -- Cond.exp. (01 capital, 14 interior, 08 salón...)
  cond_pago       text,
  region_cod      text,              -- de Region 'S11 -LUQUE' → 'S11'
  cliente_cod     text,              -- Solic.
  cliente_nombre  text,              -- Nombre
  grupo_cliente   text,              -- Desc.Gr.Cli.
  vendedor_cod    text,              -- Nº pers.
  vendedor_nombre text,              -- Nombre_1
  grupo_vendedor  text,              -- GrVendedor
  oficina_venta   text,              -- Ofic.vta.
  sector          text,
  creado_por      text,              -- Creado (GDWVENTAS, ALIADOWEB, usuario)
  motivo_pedido   text,              -- Mot.Ped
  ped_cliente     text,              -- Ped.Cliente
  estado          text,              -- Denominación (Concluido/a, En curso, Pendiente)
  importacion_id  uuid references public.otif_importaciones(id) on delete set null,
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_otif_pedidos_carga  on public.otif_pedidos (fecha_carga);
create index if not exists idx_otif_pedidos_region on public.otif_pedidos (region_cod);

-- ── 4. ENTREGAS (una por despacho; acá viven las etapas) ─────
create table if not exists public.otif_entregas (
  entrega          text primary key,
  doc_vtas         text not null references public.otif_pedidos(doc_vtas) on delete cascade,
  almacen          text,             -- LDAL Ferretería, LDFA Hierros...
  puesto_exped     text,
  cond_real        text,             -- Cond.Real (1A, 1B, 2A...)
  ts_creacion      timestamptz,      -- Fech.Creac.Entrega + hora
  ts_preparacion   timestamptz,
  ts_control       timestamptz,
  ts_empaque       timestamptz,
  ts_factura       timestamptz,      -- la más temprana si hay varias facturas
  nro_factura      text,
  ts_transporte    timestamptz,      -- asignación de transporte
  ts_manifiesto    timestamptz,
  nro_manifiesto   text,
  transporte       text,
  ts_entrega       timestamptz,      -- entrega al cliente (registrada)
  ts_ult_etapa     timestamptz,
  ult_etapa        smallint,         -- 2 control, 3 empaque, 4 chofer, 5 registrada, 6 no entregado
  etapa_desc       text,
  motivo_etapa     text,
  usuario_control  text,
  usuario_empaque  text,
  usuario_transp   text,
  usuario_entrega  text,
  bultos           integer,
  importacion_id   uuid references public.otif_importaciones(id) on delete set null,
  actualizado_en   timestamptz not null default now()
);
create index if not exists idx_otif_entregas_pedido  on public.otif_entregas (doc_vtas);
create index if not exists idx_otif_entregas_entrega on public.otif_entregas (ts_entrega);

-- ── 5. MATERIALES (catálogo: la descripción se guarda una sola vez) ─
create table if not exists public.otif_materiales (
  material      text primary key,
  descripcion   text,
  jerarquia     text,                -- JquíaProd
  es_produccion boolean generated always as (material ~* '^LA.*FAA?$') stored
);

-- ── 6. LÍNEAS (pedido + posición; base del "completo") ───────
-- Incluye las líneas que NUNCA se entregaron (entrega = null),
-- con su motivo de rechazo (Stock sin existencia, Cuenta atrasada...).
create table if not exists public.otif_lineas (
  doc_vtas        text not null references public.otif_pedidos(doc_vtas) on delete cascade,
  pos             integer not null,
  entrega         text,              -- null = no se entregó
  material        text,
  unidad          text,
  cant_pedida     numeric not null default 0,  -- Ctd.ped.
  cant_entregada  numeric not null default 0,  -- Cant.Entreg.
  cant_facturada  numeric not null default 0,  -- Cant.Fact.
  precio          numeric not null default 0,
  desc_pct        numeric not null default 0,
  motivo_rechazo  text,              -- Descr. Mot. Rech.
  importacion_id  uuid references public.otif_importaciones(id) on delete set null,
  primary key (doc_vtas, pos)
);
create index if not exists idx_otif_lineas_entrega on public.otif_lineas (entrega);

-- ── 7. CONFIGURACIÓN (una sola fila, editable desde Parámetros) ─
create table if not exists public.otif_config (
  id              smallint primary key default 1 check (id = 1),
  data            jsonb not null,
  actualizado_en  timestamptz not null default now(),
  actualizado_por text
);

-- ============================================================
-- RLS — mismo criterio que el resto de los módulos del ecosistema:
-- detrás del SSO del Launcher, anon lee y escribe.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['otif_importaciones','otif_regiones','otif_pedidos','otif_entregas',
                           'otif_materiales','otif_lineas','otif_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anon_all_%s" on public.%I', t, t);
    execute format('create policy "anon_all_%s" on public.%I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;

-- ============================================================
-- SEED — configuración inicial (tomada del Tablero OTIF actual)
-- ============================================================
insert into public.otif_config (id, data) values (1, '{
  "unidad_otif": "pedido",
  "medir_desde": "carga",
  "horas_habiles": true,
  "clases_doc_incluidas": ["ZCRE","ZCOS"],
  "calendario": { "dias": [null,[435,1020],[435,1020],[435,1020],[435,1020],[435,1020],[435,690]] },
  "feriados": ["2026-01-01","2026-03-02","2026-04-02","2026-04-03","2026-05-01","2026-05-14","2026-05-15",
               "2026-06-12","2026-06-20","2026-06-30","2026-08-15","2026-09-29","2026-12-08","2026-12-25"],
  "sla_default": 7,
  "sla_zona":  { "Capital": 3, "Interior": 7 },
  "sla_departamento": {
    "Asuncion": 2.5, "Central": 2.5, "Chaco": 2.5, "Cordillera": 5,
    "Concepcion": 10, "Amambay": 10, "Neembucu": 10,
    "Alto Parana": 7, "Itapua": 7, "San Pedro": 7, "Canindeyu": 7, "Caaguazu": 7,
    "Paraguari": 7, "Caazapa": 7, "Misiones": 7, "Guaira": 7 },
  "sla_condicion": {},
  "meta_otif": 85,
  "condiciones_retiro": ["08","09"]
}'::jsonb)
on conflict (id) do nothing;

-- SEED — 190 regiones del export SAP (departamento según la letra del código)
insert into public.otif_regiones (region_cod, nombre, departamento, zona) values
  ('A01', 'ASUNCION', 'Asuncion', 'Capital'),
  ('A05', 'FERNANDO DE LA MORA', 'Asuncion', 'Capital'),
  ('A08', 'J.A. SALDIVAR', 'Asuncion', 'Capital'),
  ('A09', 'SAN ANTONIO', 'Asuncion', 'Capital'),
  ('B02', 'ARROYITO', 'Concepcion', 'Interior'),
  ('B04', 'BELEN', 'Concepcion', 'Interior'),
  ('B08', 'CONCEPCION', 'Concepcion', 'Interior'),
  ('B11', 'HORQUETA', 'Concepcion', 'Interior'),
  ('B16', 'LORETO', 'Concepcion', 'Interior'),
  ('B30', 'TACUATI', 'Concepcion', 'Interior'),
  ('B32', 'SAN PEDRO POTY', 'Concepcion', 'Interior'),
  ('B33', 'YBY YA''U', 'Concepcion', 'Interior'),
  ('C01', 'AMAMBAY', 'Amambay', 'Interior'),
  ('C02', 'BELLA VISTA', 'Amambay', 'Interior'),
  ('C03', 'BELLA VISTA NORTE', 'Amambay', 'Interior'),
  ('C06', 'P.J. CABALLERO', 'Amambay', 'Interior'),
  ('C08', 'CAPITAN BADO', 'Amambay', 'Interior'),
  ('C09', 'KARAPA I', 'Amambay', 'Interior'),
  ('D01', 'SAN PEDRO D. YCUAMAN', 'San Pedro', 'Interior'),
  ('D02', '25 DE DICIEMBRE', 'San Pedro', 'Interior'),
  ('D04', 'CAPIIBARY', 'San Pedro', 'Interior'),
  ('D05', 'CHORE', 'San Pedro', 'Interior'),
  ('D07', 'COLONIA RIO VERDE', 'San Pedro', 'Interior'),
  ('D08', 'COLONIA VOLENDAM', 'San Pedro', 'Interior'),
  ('D09', 'CRUCE LIBERACION', 'San Pedro', 'Interior'),
  ('D13', 'GENERAL AQUINO', 'San Pedro', 'Interior'),
  ('D15', 'GENERAL RESQUIN', 'San Pedro', 'Interior'),
  ('D16', 'GUAYAIBI', 'San Pedro', 'Interior'),
  ('D17', 'ITACURUBI DEL ROSARI', 'San Pedro', 'Interior'),
  ('D18', 'JUGUA  REY', 'San Pedro', 'Interior'),
  ('D21', 'LIMA', 'San Pedro', 'Interior'),
  ('D27', 'PUERTO ANTEQUERA', 'San Pedro', 'Interior'),
  ('D29', 'SANTA ROSA DEL AGUAR', 'San Pedro', 'Interior'),
  ('D31', 'SAN ESTANISLAO', 'San Pedro', 'Interior'),
  ('D32', 'SANTANI', 'San Pedro', 'Interior'),
  ('D34', 'STA.ROSA DEL AGUARAY', 'San Pedro', 'Interior'),
  ('D35', 'UNION', 'San Pedro', 'Interior'),
  ('D38', 'YATAYTY DEL NORTE', 'San Pedro', 'Interior'),
  ('D41', 'NARANJITO', 'San Pedro', 'Interior'),
  ('E02', 'KATUETE', 'Canindeyu', 'Interior'),
  ('E03', 'CORPUS CRISTI', 'Canindeyu', 'Interior'),
  ('E05', 'CRUCE GUARANI', 'Canindeyu', 'Interior'),
  ('E06', 'CURUGUATY', 'Canindeyu', 'Interior'),
  ('E07', 'LA PALOMA', 'Canindeyu', 'Interior'),
  ('E08', 'MARACANA -CANINDEYU', 'Canindeyu', 'Interior'),
  ('E09', 'PUENTE KYHA', 'Canindeyu', 'Interior'),
  ('E10', 'SALTO DEL GUAIRA', 'Canindeyu', 'Interior'),
  ('E12', 'YASY CANY', 'Canindeyu', 'Interior'),
  ('E14', 'YPEHU', 'Canindeyu', 'Interior'),
  ('E18', 'YBYRAROBANA', 'Canindeyu', 'Interior'),
  ('F02', 'TAVAPY', 'Alto Parana', 'Interior'),
  ('F04', 'CIUDAD DEL ESTE', 'Alto Parana', 'Interior'),
  ('F11', 'COLONIA RAUL PENA', 'Alto Parana', 'Interior'),
  ('F16', 'HERNANDARIAS', 'Alto Parana', 'Interior'),
  ('F17', 'IRUÑA', 'Alto Parana', 'Interior'),
  ('F18', 'ITAKYRY', 'Alto Parana', 'Interior'),
  ('F19', 'JUAN E. O''LEARY', 'Alto Parana', 'Interior'),
  ('F20', 'JUAN LEON MALLORQUIN', 'Alto Parana', 'Interior'),
  ('F22', 'MBARACAYU', 'Alto Parana', 'Interior'),
  ('F23', 'MINGA GUAZU', 'Alto Parana', 'Interior'),
  ('F24', 'MINGA PORA', 'Alto Parana', 'Interior'),
  ('F26', 'NARANJAL', 'Alto Parana', 'Interior'),
  ('F28', 'NUEVA ESPERANZA', 'Alto Parana', 'Interior'),
  ('F30', 'PRESIDENTE FRANCO', 'Alto Parana', 'Interior'),
  ('F33', 'SAN CRISTOBAL', 'Alto Parana', 'Interior'),
  ('F35', 'SANTA FE - ALTO PARA', 'Alto Parana', 'Interior'),
  ('F38', 'SAN ALBERTO', 'Alto Parana', 'Interior'),
  ('F39', 'SANTA RITA', 'Alto Parana', 'Interior'),
  ('F40', 'SANTA ROSA DEL MONDA', 'Alto Parana', 'Interior'),
  ('F44', 'TRONCAL 3', 'Alto Parana', 'Interior'),
  ('G01', 'CAAGUAZU', 'Caaguazu', 'Interior'),
  ('G02', 'CAMPO 9 - CAAGUAZU', 'Caaguazu', 'Interior'),
  ('G04', 'CAMPO 8', 'Caaguazu', 'Interior'),
  ('G06', 'CARAYAO', 'Caaguazu', 'Interior'),
  ('G07', 'CECILIO BAEZ', 'Caaguazu', 'Interior'),
  ('G09', 'COLONIA BERGTHAL', 'Caaguazu', 'Interior'),
  ('G12', 'CORONEL OVIEDO', 'Caaguazu', 'Interior'),
  ('G15', 'JOSE DOMINGO OCAMPOS', 'Caaguazu', 'Interior'),
  ('G22', 'NUEVA LONDRES', 'Caaguazu', 'Interior'),
  ('G24', 'RAUL A. OVIEDO', 'Caaguazu', 'Interior'),
  ('G25', 'REPATRIACION', 'Caaguazu', 'Interior'),
  ('G28', 'SAN JOSE DE LOS ARRO', 'Caaguazu', 'Interior'),
  ('G31', 'SIMON BOLIVAR (CAAGU', 'Caaguazu', 'Interior'),
  ('G33', 'VAQUERIA', 'Caaguazu', 'Interior'),
  ('G37', '3 DE FEBRERO', 'Caaguazu', 'Interior'),
  ('H05', 'ATYRA', 'Cordillera', 'Interior'),
  ('H06', 'CAACUPE', 'Cordillera', 'Interior'),
  ('H08', 'CARAGUATAY', 'Cordillera', 'Interior'),
  ('H09', 'CORDILLERA', 'Cordillera', 'Interior'),
  ('H10', 'EMBOSCADA', 'Cordillera', 'Interior'),
  ('H11', 'EUSEBIO AYALA', 'Cordillera', 'Interior'),
  ('H12', 'ISLA PUCU', 'Cordillera', 'Interior'),
  ('H13', 'ITACURUBI D.L.CORDIL', 'Cordillera', 'Interior'),
  ('H14', 'LOMA GRANDE', 'Cordillera', 'Interior'),
  ('H15', 'NUEVA COLOMBIA - COR', 'Cordillera', 'Interior'),
  ('H16', 'PIRIBEBUY', 'Cordillera', 'Interior'),
  ('H17', 'SAN BERNARDINO', 'Cordillera', 'Interior'),
  ('H19', 'TOBATI', 'Cordillera', 'Interior'),
  ('I01', 'ACAHAY', 'Paraguari', 'Interior'),
  ('I02', 'CAAPUCU', 'Paraguari', 'Interior'),
  ('I04', 'CARAPEGUA', 'Paraguari', 'Interior'),
  ('I06', 'LA COLMENA', 'Paraguari', 'Interior'),
  ('I07', 'MBUYAPEY', 'Paraguari', 'Interior'),
  ('I08', 'PARAGUARI', 'Paraguari', 'Interior'),
  ('I09', 'PIRAYU', 'Paraguari', 'Interior'),
  ('I10', 'QUIINDY', 'Paraguari', 'Interior'),
  ('I14', 'YAGUARON', 'Paraguari', 'Interior'),
  ('I15', 'YBYCUI', 'Paraguari', 'Interior'),
  ('J03', 'BUENA VISTA', 'Guaira', 'Interior'),
  ('J04', 'COLONIA INDEPENDENCI', 'Guaira', 'Interior'),
  ('J07', 'EUGENIO A. GARAY', 'Guaira', 'Interior'),
  ('J10', 'GUAIRA', 'Guaira', 'Interior'),
  ('J12', 'ITURBE', 'Guaira', 'Interior'),
  ('J14', 'MBOCAYATY', 'Guaira', 'Interior'),
  ('J16', 'MAURICIO JOSE TROCHE', 'Guaira', 'Interior'),
  ('J18', 'NUMI', 'Guaira', 'Interior'),
  ('J20', 'SAN JUAN NEPOMUCENO', 'Guaira', 'Interior'),
  ('J22', 'TAVAI', 'Guaira', 'Interior'),
  ('J24', 'VILLARRICA', 'Guaira', 'Interior'),
  ('K02', 'CAAZAPA', 'Caazapa', 'Interior'),
  ('K03', 'FULGENCIO YEGROS', 'Caazapa', 'Interior'),
  ('K04', 'YUTY', 'Caazapa', 'Interior'),
  ('L03', 'BELLA VISTA SUR', 'Itapua', 'Interior'),
  ('L05', 'CAMBYRETA', 'Itapua', 'Interior'),
  ('L06', 'CAPITAN MEZA', 'Itapua', 'Interior'),
  ('L07', 'CAPITAN MIRANDA', 'Itapua', 'Interior'),
  ('L09', 'CARMEN DEL PARANA', 'Itapua', 'Interior'),
  ('L11', 'COLONIA FRAM', 'Itapua', 'Interior'),
  ('L12', 'COLONIA OBLIGADO', 'Itapua', 'Interior'),
  ('L13', 'CORONEL BOGADO', 'Itapua', 'Interior'),
  ('L14', 'EDELIRA', 'Itapua', 'Interior'),
  ('L15', 'ENCARNACION', 'Itapua', 'Interior'),
  ('L16', 'GENERAL ARTIGAS', 'Itapua', 'Interior'),
  ('L17', 'GENERAL DELGADO', 'Itapua', 'Interior'),
  ('L18', 'HOHENAU', 'Itapua', 'Interior'),
  ('L19', 'ITAPUA', 'Itapua', 'Interior'),
  ('L21', 'JESUS', 'Itapua', 'Interior'),
  ('L24', 'LA PAZ', 'Itapua', 'Interior'),
  ('L25', 'MA.AUXILIADORA', 'Itapua', 'Interior'),
  ('L26', 'MAYOR OTANO', 'Itapua', 'Interior'),
  ('L27', 'NATALIO', 'Itapua', 'Interior'),
  ('L31', 'PIRAPO', 'Itapua', 'Interior'),
  ('L32', 'PIRAPEY', 'Itapua', 'Interior'),
  ('L35', 'SAN COSME Y DAMIAN', 'Itapua', 'Interior'),
  ('L38', 'SAN PEDRO DEL PARANA', 'Itapua', 'Interior'),
  ('L39', 'SAN RAFAEL', 'Itapua', 'Interior'),
  ('L40', 'STMA.TRINIDAD', 'Itapua', 'Interior'),
  ('L42', 'TOMAS ROMERO PEREIRA', 'Itapua', 'Interior'),
  ('L44', 'ALTO VERA', 'Itapua', 'Interior'),
  ('L45', 'CARONAY', 'Itapua', 'Interior'),
  ('M01', 'MISIONES', 'Misiones', 'Interior'),
  ('M03', 'SAN IGNACIO', 'Misiones', 'Interior'),
  ('M04', 'SAN JUAN BAUTISTA', 'Misiones', 'Interior'),
  ('M09', 'SANTIAGO', 'Misiones', 'Interior'),
  ('M10', 'SAN PATRICIO MISIONE', 'Misiones', 'Interior'),
  ('M11', 'SANTA ROSA MISIONES', 'Misiones', 'Interior'),
  ('M13', 'VILLA FLORIDA', 'Misiones', 'Interior'),
  ('M14', 'YABEBYRY', 'Misiones', 'Interior'),
  ('M15', 'AYOLAS', 'Misiones', 'Interior'),
  ('N01', 'PILAR', 'Neembucu', 'Interior'),
  ('N02', 'ALBERDI', 'Neembucu', 'Interior'),
  ('N04', 'CERRITO - PILAR', 'Neembucu', 'Interior'),
  ('N07', 'SAN JUAN NEEMBUCU', 'Neembucu', 'Interior'),
  ('N13', 'MAYOR MARTINEZ', 'Neembucu', 'Interior'),
  ('R03', 'BOQUERON', 'Chaco', 'Interior'),
  ('R05', 'CHACO', 'Chaco', 'Interior'),
  ('R07', 'COLONIA FERNHEIM', 'Chaco', 'Interior'),
  ('R14', 'FILADELFIA', 'Chaco', 'Interior'),
  ('R19', 'LOMA PLATA', 'Chaco', 'Interior'),
  ('R21', 'NANAWA', 'Chaco', 'Interior'),
  ('R25', 'PDTE. HAYES', 'Chaco', 'Interior'),
  ('R30', 'VILLA HAYES', 'Chaco', 'Interior'),
  ('R31', 'BENJAMIN ACEVAL', 'Chaco', 'Interior'),
  ('S01', 'AREGUA', 'Central', 'Capital'),
  ('S02', 'CAPIATA', 'Central', 'Capital'),
  ('S03', 'GUARAMBARE', 'Central', 'Capital'),
  ('S06', 'ITA', 'Central', 'Capital'),
  ('S07', 'ITAUGUA', 'Central', 'Capital'),
  ('S08', 'LAMBARE', 'Central', 'Capital'),
  ('S09', 'LIMPIO', 'Central', 'Capital'),
  ('S10', 'LOMA PYTA', 'Central', 'Capital'),
  ('S11', 'LUQUE', 'Central', 'Capital'),
  ('S12', 'M.R. ALONSO', 'Central', 'Capital'),
  ('S13', 'NEMBY', 'Central', 'Capital'),
  ('S15', 'SAN LORENZO', 'Central', 'Capital'),
  ('S16', 'VILLA ELISA', 'Central', 'Capital'),
  ('S17', 'VILLETA', 'Central', 'Capital'),
  ('S18', 'YPACARAI', 'Central', 'Capital'),
  ('S19', 'YPANE', 'Central', 'Capital'),
  ('S20', 'ZEBALLOS CUE', 'Central', 'Capital')
on conflict (region_cod) do nothing;
