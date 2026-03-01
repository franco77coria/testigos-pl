-- =====================================================
-- SCHEMA SUPABASE - TESTIGOS PL
-- Proyecto: qevfqhionzigkqttjejy
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Tabla de testigos (importada desde CSV)
CREATE TABLE IF NOT EXISTS testigos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre1 TEXT NOT NULL DEFAULT '',
  nombre2 TEXT,
  apellido1 TEXT NOT NULL DEFAULT '',
  apellido2 TEXT,
  nombre_completo TEXT NOT NULL DEFAULT '',
  celular TEXT,
  correo TEXT,
  departamento TEXT DEFAULT 'CUNDINAMARCA',
  municipio TEXT NOT NULL DEFAULT '',
  puesto TEXT NOT NULL DEFAULT '',
  dd TEXT,
  mm TEXT,
  zz TEXT,
  pp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de municipios / semáforo (importada desde CSV)
CREATE TABLE IF NOT EXISTS municipios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio TEXT UNIQUE NOT NULL,
  mesas INT DEFAULT 0,
  testigos INT DEFAULT 0,
  votantes INT DEFAULT 0,
  mesas_por_testigo FLOAT,
  meta INT DEFAULT 0,
  testigos_a_conseguir INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de asignaciones mesa-testigo
CREATE TABLE IF NOT EXISTS mesa_asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  testigo_cedula TEXT NOT NULL,
  mesa_numero INT NOT NULL,
  municipio TEXT NOT NULL DEFAULT '',
  puesto TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de resultados (una fila por mesa por testigo)
CREATE TABLE IF NOT EXISTS resultados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  testigo_cedula TEXT NOT NULL,
  mesa_numero INT NOT NULL,
  municipio TEXT DEFAULT '',
  puesto TEXT DEFAULT '',
  cantidad_votantes_mesa INT,
  votantes_10am INT,
  votantes_1pm INT,
  votos_alex_p INT,
  votos_camara_cun_pl INT,
  votos_oscar_sanchez_senado INT,
  votos_senado_pl INT,
  foto_camara TEXT,
  foto_senado TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testigo_cedula, mesa_numero)
);

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_testigos_cedula ON testigos(cedula);
CREATE INDEX IF NOT EXISTS idx_testigos_municipio ON testigos(municipio);
CREATE INDEX IF NOT EXISTS idx_resultados_cedula ON resultados(testigo_cedula);
CREATE INDEX IF NOT EXISTS idx_resultados_estado ON resultados(estado);
CREATE INDEX IF NOT EXISTS idx_asignaciones_cedula ON mesa_asignaciones(testigo_cedula);
CREATE INDEX IF NOT EXISTS idx_asignaciones_municipio ON mesa_asignaciones(municipio);

-- 6. Desactivar RLS (acceso controlado por API routes server-side)
ALTER TABLE testigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa_asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para service_role (API routes usan service key)
CREATE POLICY "Service role full access" ON testigos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON municipios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mesa_asignaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON resultados FOR ALL USING (true) WITH CHECK (true);

-- 7. Storage bucket para fotos de actas
-- (Ejecutar desde el dashboard de Supabase > Storage > Create bucket)
-- Nombre: fotos-actas
-- Public: true
-- Max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png
