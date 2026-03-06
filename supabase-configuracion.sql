-- =====================================================
-- TABLA DE CONFIGURACIÓN - TESTIGOS PL
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Tabla de configuración key-value
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON configuracion FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);
