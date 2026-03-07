-- Migration v2: botones separados Cámara/Senado + tabla Analysis Center + CSV unificado
-- Correr esto en el SQL Editor de Supabase antes de deployar

-- 1. Nuevas columnas en la tabla resultados
ALTER TABLE resultados
  ADD COLUMN IF NOT EXISTS datos_camara_guardados boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS datos_senado_guardados boolean DEFAULT false;

-- 2. Tabla para acceso al Analysis Center (jefes de los líderes)
CREATE TABLE IF NOT EXISTS analysis_acceso (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cedula text UNIQUE NOT NULL,
  nombre text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analysis_acceso_cedula_idx ON analysis_acceso (cedula);

-- 3. Nuevas columnas en testigos (datos del CSV CNE)
ALTER TABLE testigos
  ADD COLUMN IF NOT EXISTS organizacion_politica text,
  ADD COLUMN IF NOT EXISTS tipo_testigo text,
  ADD COLUMN IF NOT EXISTS estado_testigo text,
  ADD COLUMN IF NOT EXISTS asiste text,
  ADD COLUMN IF NOT EXISTS lider text;
