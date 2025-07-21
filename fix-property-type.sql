-- Comando para agregar la columna property_type a la tabla properties
-- Ejecuta esto en el SQL Editor de Supabase

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'piso';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'properties' AND table_schema = 'public';
