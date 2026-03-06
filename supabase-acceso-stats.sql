-- =====================================================
-- MIGRACIÓN: Tabla de acceso a estadísticas
-- El super admin puede dar acceso a otras personas
-- Ejecutar en Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS estadisticas_acceso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula TEXT UNIQUE NOT NULL,
  nombre TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + policy
ALTER TABLE estadisticas_acceso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON estadisticas_acceso FOR ALL USING (true) WITH CHECK (true);
