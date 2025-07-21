-- Políticas de seguridad RLS para el CRM Inmobiliario
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 0. Agregar columna property_type si no existe
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'piso';

-- 0.1. Agregar columna para imágenes
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para la tabla profiles
-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Políticas para la tabla clients
-- Los usuarios autenticados pueden ver y gestionar todos los clientes
CREATE POLICY "Authenticated users can view clients" ON public.clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON public.clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON public.clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Políticas para la tabla properties
-- Los usuarios autenticados pueden ver y gestionar todas las propiedades
CREATE POLICY "Authenticated users can view properties" ON public.properties
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert properties" ON public.properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update properties" ON public.properties
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete properties" ON public.properties
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Políticas para la tabla visits
-- Los usuarios autenticados pueden ver y gestionar todas las visitas
CREATE POLICY "Authenticated users can view visits" ON public.visits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert visits" ON public.visits
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update visits" ON public.visits
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete visits" ON public.visits
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Función para crear automáticamente el perfil cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para ejecutar la función cuando se crea un nuevo usuario
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Opcional: Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_properties_client_id ON public.properties(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_property_id ON public.visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_client_id ON public.visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(visit_date);

-- 9. Configuración del Storage para imágenes de propiedades
-- ⚠️ IMPORTANTE: PRIMERO crear el bucket desde la interfaz de Supabase Storage
-- 
-- Pasos previos OBLIGATORIOS:
-- 1. Ve a Storage en tu dashboard de Supabase
-- 2. Haz clic en "Create bucket"
-- 3. Nombre: property-images
-- 4. Public bucket: ✅ MARCADO (muy importante)
-- 5. Una vez creado el bucket, ejecutar las políticas de abajo:

-- Política para que usuarios autenticados puedan subir imágenes
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

-- Política para que usuarios autenticados puedan ver imágenes
CREATE POLICY "Authenticated users can view property images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

-- Política para que usuarios autenticados puedan actualizar sus imágenes
CREATE POLICY "Authenticated users can update property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

-- Política para que usuarios autenticados puedan eliminar imágenes
CREATE POLICY "Authenticated users can delete property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );
