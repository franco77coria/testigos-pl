-- =====================================================
-- MIGRACIÓN: Cambiar tabla municipios para almacenar puestos
-- Ahora cada fila es un PUESTO (punto de votación) con su cantidad de mesas
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Eliminar constraint UNIQUE de municipio (ya no es unique por municipio, sino por puesto)
ALTER TABLE municipios DROP CONSTRAINT IF EXISTS municipios_municipio_key;

-- Agregar columna puesto si no existe
ALTER TABLE municipios ADD COLUMN IF NOT EXISTS puesto TEXT NOT NULL DEFAULT '';
ALTER TABLE municipios ADD COLUMN IF NOT EXISTS departamento TEXT DEFAULT 'CUNDINAMARCA';
ALTER TABLE municipios ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Agregar constraint UNIQUE por municipio+puesto
ALTER TABLE municipios ADD CONSTRAINT municipios_municipio_puesto_key UNIQUE (municipio, puesto);
