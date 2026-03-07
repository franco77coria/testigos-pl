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

-- 5. Agregar columnas de conteo de votantes por hora
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votantes_8am INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votantes_11am INT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS votantes_1pm INT;

-- 6. Flags para bloquear datos ya guardados (una sola vez)
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS datos_8am_guardados BOOLEAN DEFAULT false;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS datos_11am_guardados BOOLEAN DEFAULT false;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS datos_1pm_guardados BOOLEAN DEFAULT false;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS datos_finales_guardados BOOLEAN DEFAULT false;

-- 7. Verificar que el campo updated_at existe
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- VERIFICACIÓN: Ejecutar esto después para comprobar 
-- que todas las columnas se crearon correctamente.
-- =====================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'resultados'
-- ORDER BY ordinal_position;
