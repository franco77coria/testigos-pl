-- =====================================================
-- MIGRACIÓN: Agregar columna es_super a admins
-- Solo el super admin puede ver las estadísticas de votos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

ALTER TABLE admins ADD COLUMN IF NOT EXISTS es_super BOOLEAN DEFAULT false;

-- Marcar a Franco Coria como super admin
UPDATE admins SET es_super = true WHERE cedula = '42725129';
