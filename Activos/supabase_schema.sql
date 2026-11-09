-- ====================================================================
-- ESQUEMA Y DATOS INICIALES PARA CONTROL DE ACTIVOS POS EN SUPABASE
-- ====================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.
-- Crea las tablas con seguridad RLS abierta para el anon key y activa
-- la sincronización en tiempo real (Supabase Realtime por WebSockets).
-- ====================================================================

-- 1. TABLA: activos
CREATE TABLE IF NOT EXISTS public.activos (
    id TEXT PRIMARY KEY,
    barcode TEXT NOT NULL,
    tipo TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    serie TEXT,
    estado TEXT DEFAULT 'Operativo',
    ubicacion TEXT,
    notas TEXT,
    fecha TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: ubicaciones (Cuadros de Ubicación gestionables)
CREATE TABLE IF NOT EXISTS public.ubicaciones (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso público (Lectura, Inserción, Actualización y Eliminación con anon key)
DROP POLICY IF EXISTS "Acceso publico activos" ON public.activos;
CREATE POLICY "Acceso publico activos" ON public.activos
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico ubicaciones" ON public.ubicaciones;
CREATE POLICY "Acceso publico ubicaciones" ON public.ubicaciones
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Habilitar Realtime para reflejar cambios en tiempo real en todos los dispositivos
ALTER TABLE public.activos REPLICA IDENTITY FULL;
ALTER TABLE public.ubicaciones REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activos;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ubicaciones'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ubicaciones;
    END IF;
END $$;

-- 6. Insertar Cuadros de Ubicación iniciales
INSERT INTO public.ubicaciones (nombre) VALUES
    ('Caja 1'),
    ('Caja 2'),
    ('Caja 3'),
    ('Caja Rápida'),
    ('Mostrador / Pedidos'),
    ('Oficina / Servidor'),
    ('Tesorería / Caja Fuerte'),
    ('Almacén / Respaldo'),
    ('Mesa Técnica'),
    ('Sala de Espera')
ON CONFLICT (nombre) DO NOTHING;

-- 7. Insertar los 30 Activos iniciales del Punto de Venta
INSERT INTO public.activos (id, barcode, tipo, marca, modelo, serie, estado, ubicacion, notas, fecha) VALUES
    -- Teclados (5 unidades)
    ('ACT-001-01', 'ACT-001-01', 'Teclado', 'Dell, Ibue', 'Standard USB', 'SN-KB-001', 'Operativo', 'Caja 1 - Mostrador Principal', 'Teclado de ventas en Caja 1', '2026-11-01'),
    ('ACT-001-02', 'ACT-001-02', 'Teclado', 'Dell', 'KB216 USB', 'SN-KB-002', 'Operativo', 'Caja 2 - Mostrador', 'Teclado de ventas en Caja 2', '2026-11-01'),
    ('ACT-001-03', 'ACT-001-03', 'Teclado', 'Dell, Ibue', 'Standard USB', 'SN-KB-003', 'Operativo', 'Caja 3 - Mostrador', 'Teclado de ventas en Caja 3', '2026-11-01'),
    ('ACT-001-04', 'ACT-001-04', 'Teclado', 'Dell', 'KB216 USB', 'SN-KB-004', 'Operativo', 'Mostrador Central / Pedidos', 'Teclado para atención de pedidos', '2026-11-01'),
    ('ACT-001-05', 'ACT-001-05', 'Teclado', 'Ibue', 'Standard USB', 'SN-KB-005', 'Operativo', 'Almacén - Respaldo Técnico', 'Unidad de repuesto disponible', '2026-11-01'),
    
    -- Ticketeras (5 unidades)
    ('ACT-002-01', 'ACT-002-01', 'Ticketera', 'Dell', '3nStar RPT008', '3N-RPT-8891', 'Operativo', 'Caja 1 - Ventas', 'Impresora térmica de recibos Caja 1', '2026-11-01'),
    ('ACT-002-02', 'ACT-002-02', 'Ticketera', 'Dell', '3nStar RPT008', '3N-RPT-8892', 'Operativo', 'Caja 2 - Ventas', 'Impresora térmica de recibos Caja 2', '2026-11-01'),
    ('ACT-002-03', 'ACT-002-03', 'Ticketera', 'Dell', '3nStar RPT008', '3N-RPT-8893', 'Operativo', 'Caja 3 - Ventas', 'Impresora térmica de recibos Caja 3', '2026-11-01'),
    ('ACT-002-04', 'ACT-002-04', 'Ticketera', 'Dell', '3nStar RPT008', '3N-RPT-8894', 'Operativo', 'Mostrador de Pedidos', 'Impresora de comandas y facturas', '2026-11-01'),
    ('ACT-002-05', 'ACT-002-05', 'Ticketera', 'Dell', '3nStar RPT008', '3N-RPT-8895', 'Operativo', 'Almacén - Respaldo', 'Ticketera de reemplazo en caja original', '2026-11-01'),
    
    -- Desktops (2 unidades)
    ('ACT-003-01', 'ACT-003-01', 'Desktop', 'DELL', 'OptiPlex i7 9ena gen', 'DL-OPT-9701', 'Operativo', 'Servidor / Oficina Principal', 'Servidor principal con base de datos local', '2026-11-01'),
    ('ACT-003-02', 'ACT-003-02', 'Desktop', 'DELL', 'OptiPlex i7 9ena gen', 'DL-OPT-9702', 'Operativo', 'Oficina de Administración', 'Equipo de gerencia y facturación', '2026-11-01'),
    
    -- TV (1 unidad)
    ('ACT-004', 'ACT-004', 'TV', 'Samsung', 'Smart 43 UHD', 'SAM-TV-430', 'Operativo', 'Sala de Espera / Clientes', 'Pantalla publicitaria y turno de atención', '2026-11-01'),
    
    -- Pantallas de Ventas (4 unidades)
    ('ACT-005-01', 'ACT-005-01', 'Pantalla de ventas', 'HP', 'HP RP7, modelo 7800', 'HP-RP7-7801', 'Operativo', 'Caja 1 - Frontal', 'Terminal táctil principal All-in-One', '2026-11-01'),
    ('ACT-005-02', 'ACT-005-02', 'Pantalla de ventas', 'HP', 'HP RP7, modelo 7800', 'HP-RP7-7802', 'Operativo', 'Caja 2 - Frontal', 'Terminal táctil All-in-One Caja 2', '2026-11-01'),
    ('ACT-005-03', 'ACT-005-03', 'Pantalla de ventas', 'HP', 'HP RP7, modelo 7800', 'HP-RP7-7803', 'Operativo', 'Caja 3 - Frontal', 'Terminal táctil All-in-One Caja 3', '2026-11-01'),
    ('ACT-006', 'ACT-006', 'Pantalla de ventas', 'Bematech', 'Bematech SB9015', 'BEM-SB-9015', 'Operativo', 'Caja Rápida / Mostrador', 'Terminal táctil secundario', '2026-11-01'),
    
    -- Monitor (1 unidad)
    ('ACT-007', 'ACT-007', 'Monitor', 'LG', '24MK430H', 'LG-MON-240', 'Operativo', 'Oficina de Administración', 'Monitor de supervisión y control', '2026-11-01'),
    
    -- Controles de Caja / Gavetas (4 unidades)
    ('ACT-008-01', 'ACT-008-01', 'Control de caja', 'Logic Controls', '000-028', 'LC-CTL-028-1', 'Operativo', 'Caja 1 - Gaveta de Dinero', 'Gaveta conectada a ticketera con apertura auto', '2026-11-01'),
    ('ACT-008-02', 'ACT-008-02', 'Control de caja', 'Logic Controls', '000-028', 'LC-CTL-028-2', 'Operativo', 'Caja 2 - Gaveta de Dinero', 'Gaveta de dinero Caja 2', '2026-11-01'),
    ('ACT-008-03', 'ACT-008-03', 'Control de caja', 'Logic Controls', '000-028', 'LC-CTL-028-3', 'Operativo', 'Caja 3 - Gaveta de Dinero', 'Gaveta de dinero Caja 3', '2026-11-01'),
    ('ACT-008-04', 'ACT-008-04', 'Control de caja', 'Logic Controls', '000-028', 'LC-CTL-028-4', 'Operativo', 'Caja Rápida / Mostrador', 'Gaveta de dinero de soporte', '2026-11-01'),
    
    -- Contadores de Dinero (2 unidades)
    ('ACT-009', 'ACT.009', 'ContadorMonedas', 'Generico', 'CS-500', 'CS-500-11', 'Operativo', 'Tesorería / Caja Fuerte', 'Contadora clasificadora de monedas', '2026-11-01'),
    ('ATC-010', 'ATC-010', 'ContadorBilletes', 'Generico', 'Bill Counter V30', 'BC-V30-99', 'Operativo', 'Tesorería / Caja Fuerte', 'Detector de billetes falsos UV/MG', '2026-11-01'),
    
    -- Cajas de Cargadores (6 unidades)
    ('ATC-011-01', 'ATC-011-01', 'CajadeCargadores', 'motorola', 'Multi-dock 6x', 'MOT-CHG-6-1', 'Operativo', 'Mesa Técnica 1', 'Estación de carga para radios y terminales', '2026-11-01'),
    ('ATC-011-02', 'ATC-011-02', 'CajadeCargadores', 'motorola', 'Multi-dock 6x', 'MOT-CHG-6-2', 'Operativo', 'Mesa Técnica 2', 'Estación de carga secundaria', '2026-11-01'),
    ('ATC-011-03', 'ATC-011-03', 'CajadeCargadores', 'motorola', 'Dock Estándar', 'MOT-CHG-6-3', 'Operativo', 'Caja 1', 'Cargador individual de terminal punto de venta', '2026-11-01'),
    ('ATC-011-04', 'ATC-011-04', 'CajadeCargadores', 'motorola', 'Dock Estándar', 'MOT-CHG-6-4', 'Operativo', 'Caja 2', 'Cargador individual de terminal punto de venta', '2026-11-01'),
    ('ATC-011-05', 'ATC-011-05', 'CajadeCargadores', 'motorola', 'Dock Estándar', 'MOT-CHG-6-5', 'Operativo', 'Almacén Central A', 'Cargador en reserva', '2026-11-01'),
    ('ATC-011-06', 'ATC-011-06', 'CajadeCargadores', 'motorola', 'Dock Estándar', 'MOT-CHG-6-6', 'Operativo', 'Almacén Central B', 'Cargador en reserva', '2026-11-01')
ON CONFLICT (id) DO UPDATE SET
    barcode = EXCLUDED.barcode,
    tipo = EXCLUDED.tipo,
    marca = EXCLUDED.marca,
    modelo = EXCLUDED.modelo,
    serie = EXCLUDED.serie,
    estado = EXCLUDED.estado,
    ubicacion = EXCLUDED.ubicacion,
    notas = EXCLUDED.notas,
    fecha = EXCLUDED.fecha,
    updated_at = NOW();
