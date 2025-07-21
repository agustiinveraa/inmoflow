# Configuración Multi-tenant con Administradores

## Cambios Implementados

### 1. Base de Datos
Se ha actualizado el esquema para incluir administradores de agencia:

```sql
-- Tabla profiles ahora incluye:
agency_admin boolean NOT NULL DEFAULT false
```

### 2. Sistema de Autenticación
- **Registro público DESHABILITADO**: Solo los administradores pueden crear usuarios
- **Login simplificado**: Solo se muestra el formulario de inicio de sesión
- **Acceso controlado**: Solo usuarios con perfiles existentes pueden acceder

### 3. Gestión de Usuarios
Se ha agregado un componente `UserManagement` que permite a los administradores:
- Ver todos los usuarios de su agencia
- Crear nuevos usuarios (requiere service role key)
- Alternar permisos de administrador
- Eliminar usuarios (limitado sin service role key)

### 4. Control de Acceso
- El menú "Usuarios" solo se muestra a administradores (`agency_admin = true`)
- Todas las operaciones están restringidas por agencia
- Verificación de permisos en cada acción

## Configuración Inicial

### 1. Crear Agencia y Administrador Inicial

Para empezar a usar el sistema, necesitas crear al menos una agencia y un administrador:

```sql
-- 1. Crear una agencia inicial
INSERT INTO agencies (name) VALUES ('Agencia Principal');

-- 2. Crear un usuario manualmente en Supabase Auth Dashboard
--    Dashboard > Authentication > Users > "Add user"
--    Email: admin@tuagencia.com
--    Password: (tu contraseña segura)

-- 3. Después del registro, crear su perfil como administrador
--    (Reemplaza USER_ID_FROM_AUTH con el ID real del usuario creado)
INSERT INTO profiles (id, full_name, phone, agency_id, agency_admin)
VALUES (
  'USER_ID_FROM_AUTH', -- Copiar del panel de Authentication
  'Nombre del Administrador',
  '+34 600 000 000',
  (SELECT id FROM agencies WHERE name = 'Agencia Principal'),
  true  -- Este es el administrador
);
```

### 2. PROBLEMA ACTUAL: Error 403 al crear usuarios

❌ **El componente UserManagement actual NO FUNCIONA** porque intenta usar `supabase.auth.admin.createUser()` sin tener configurado el service role key.

### 3. Configurar Service Role Key (OBLIGATORIO para crear usuarios)

Para solucionar el error 403 y poder crear usuarios desde la interfaz:

#### Paso 1: Obtener Service Role Key
1. Ve a Supabase Dashboard > Settings > API
2. Copia el **"service_role"** key (NO la anon key)
3. ⚠️ **NUNCA expongas esta clave en el frontend**

#### Paso 2: Configurar Variables de Entorno
Crea/actualiza tu archivo `.env.local` en la raíz del proyecto:

```env
# Claves públicas (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Clave privada para operaciones admin (NUEVA - REQUERIDA)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

#### Paso 3: Reiniciar servidor
```bash
npm run dev
```

#### Paso 4: Crear usuarios manualmente (ALTERNATIVA TEMPORAL)
Mientras configuras el service role, puedes crear usuarios manualmente:

1. Supabase Dashboard > Authentication > Users > "Add user"
2. Después, crear el perfil en SQL Editor:
```sql
INSERT INTO profiles (id, full_name, phone, agency_id, agency_admin)
VALUES (
  'NUEVO_USER_ID',
  'Nombre del Usuario',
  'Teléfono',
  (SELECT id FROM agencies WHERE name = 'Agencia Principal'),
  false  -- false = usuario normal, true = admin
);
```

### 3. Row Level Security (RLS)

⚠️ **IMPORTANTE**: Las políticas RLS deben aplicarse cuidadosamente para evitar recursión infinita.

```sql
-- Habilitar RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- POLÍTICA PARA PROFILES (SIN RECURSIÓN)
-- Los usuarios pueden ver/editar solo su propio perfil
CREATE POLICY "Users can access their own profile" ON profiles
FOR ALL USING (id = auth.uid());

-- POLÍTICA PARA AGENCIES 
-- Los usuarios pueden ver solo su agencia (usando el perfil del usuario autenticado)
CREATE POLICY "Users can only access their agency" ON agencies
FOR SELECT USING (
  id = (
    SELECT p.agency_id 
    FROM profiles p 
    WHERE p.id = auth.uid()
  )
);

-- FUNCIÓN AUXILIAR PARA OBTENER AGENCY_ID DEL USUARIO
-- Esto evita repetir la subconsulta en cada política
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT agency_id FROM profiles WHERE id = auth.uid();
$$;

-- POLÍTICAS PARA OTRAS TABLAS (USANDO LA FUNCIÓN AUXILIAR)
CREATE POLICY "Users can only access clients from their agency" ON clients
FOR ALL USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can only access properties from their agency" ON properties
FOR ALL USING (agency_id = get_user_agency_id());

CREATE POLICY "Users can only access visits from their agency" ON visits
FOR ALL USING (agency_id = get_user_agency_id());
```

### 4. Solución de Problemas

Si ya aplicaste las políticas problemáticas y tienes el error de recursión:

```sql
-- 1. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can only access their agency" ON agencies;
DROP POLICY IF EXISTS "Users can only access profiles from their agency" ON profiles;
DROP POLICY IF EXISTS "Users can only access clients from their agency" ON clients;
DROP POLICY IF EXISTS "Users can only access properties from their agency" ON properties;
DROP POLICY IF EXISTS "Users can only access visits from their agency" ON visits;

-- 2. Aplicar las políticas corregidas (ver arriba)

-- 3. Si necesitas acceso temporal mientras corriges:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- (Recuerda volver a habilitarlo después)
```

## Flujo de Trabajo

### Para Administradores
1. Iniciar sesión con cuenta admin
2. Ir a "Usuarios" en el menú lateral
3. Crear nuevos usuarios con email, contraseña y permisos
4. Gestionar roles (admin/usuario normal)

### Para Usuarios Normales
1. Iniciar sesión con credenciales proporcionadas por admin
2. Acceso completo a CRM (clientes, propiedades, visitas)
3. Sin acceso a gestión de usuarios

## Limitaciones Actuales

1. **Service Role Key**: Se requiere para operaciones admin completas
2. **Email en Lista**: Sin service role, no se muestran emails de usuarios
3. **Eliminación**: Sin service role, solo se elimina el perfil, no la cuenta auth

## Próximas Mejoras

1. Implementar invitaciones por email
2. Configurar service role key para funcionalidad completa
3. Agregar roles más granulares
4. Implementar auditoria de acciones admin
