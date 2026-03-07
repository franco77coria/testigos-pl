-- =====================================================
-- MIGRACIÓN: Actualizar columnas de la tabla resultados
-- para que coincidan con el código de la aplicación.
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columnas de Cámara de Representantes (7 candidatos)
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l101 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l102 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l103 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l104 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l105 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l106 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_l107 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_camara_partido INT;

-- 2. Agregar columnas de Senado (5 candidatos)
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_1 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_2 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_3 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_4 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_5 INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votos_senado_partido INT;

-- 3. Agregar columna de confirmación E-14
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS confirmacion_e14 BOOLEAN DEFAULT false;

-- 4. Agregar columnas de fotos extras (segundo foto cámara/senado)
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS foto_camara_2 TEXT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS foto_senado_2 TEXT;

-- 5. Verificar que el campo updated_at existe
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- VERIFICACIÓN: Ejecutar esto después para comprobar 
-- que todas las columnas se crearon correctamente.
-- =====================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'resultados'
-- ORDER BY ordinal_position;
