-- =====================================================
-- MIGRACIÓN: Agregar columnas foto_camara_2 y foto_senado_2
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar segunda foto para cámara y senado
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS foto_camara_2 TEXT;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS foto_senado_2 TEXT;
