-- Migration: Tablas lideres y analistas + columnas en testigos
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla analistas
CREATE TABLE IF NOT EXISTS analistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analistas_cedula ON analistas(cedula);
ALTER TABLE analistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access analistas" ON analistas FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla lideres
CREATE TABLE IF NOT EXISTS lideres (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT,
  cedula_analista TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lideres_cedula ON lideres(cedula);
CREATE INDEX IF NOT EXISTS idx_lideres_cedula_analista ON lideres(cedula_analista);
ALTER TABLE lideres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access lideres" ON lideres FOR ALL USING (true) WITH CHECK (true);

-- 3. Agregar columnas a testigos
ALTER TABLE testigos ADD COLUMN IF NOT EXISTS cedula_lider TEXT;
ALTER TABLE testigos ADD COLUMN IF NOT EXISTS cedula_analista TEXT;
CREATE INDEX IF NOT EXISTS idx_testigos_cedula_lider ON testigos(cedula_lider);
CREATE INDEX IF NOT EXISTS idx_testigos_cedula_analista ON testigos(cedula_analista);
