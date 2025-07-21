# 🚨 Solución al Error: "TenantNotFound" - Bucket no existe

## El problema:
El error `TenantNotFound` indica que el bucket `property-images` no existe en tu proyecto de Supabase.

## ✅ Solución paso a paso:

### 1. Crear el bucket de Storage

1. **Ve a tu dashboard de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a Storage** (en el menú lateral izquierdo)
4. **Haz clic en "Create bucket"**
5. **Configura el bucket:**
   ```
   Name: property-images
   Public bucket: ✅ (IMPORTANTE: Debe estar marcado)
   File size limit: 5MB (opcional)
   Allowed MIME types: image/* (opcional)
   ```
6. **Haz clic en "Create bucket"**

### 2. Verificar que el bucket fue creado
En la sección Storage deberías ver el bucket `property-images` listado.

### 3. Añadir la columna 'images' a la tabla properties
**⚠️ PASO CRÍTICO:** Primero debes añadir la columna que falta en tu tabla properties.

En el **SQL Editor** de Supabase, ejecuta:

```sql
-- Agregar columna para imágenes (EJECUTAR PRIMERO)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
```

### 4. Aplicar las políticas de seguridad del Storage
Una vez creado el bucket Y añadida la columna, ejecuta estas políticas en el **SQL Editor**:

```sql
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
```

### 5. Reiniciar la aplicación
```bash
npm run dev
```

### 6. Probar la subida de imágenes
Ahora debería funcionar correctamente la subida de imágenes.

## ⚠️ Puntos importantes:

- **El bucket DEBE ser público** para que las imágenes sean accesibles
- **La columna 'images' DEBE existir** en la tabla properties antes de crear propiedades
- **Las políticas solo funcionan DESPUÉS** de crear el bucket
- **El nombre debe ser exactamente** `property-images`

## 🔍 Verificación:
Si sigues teniendo problemas, verifica:
1. Que el bucket existe y es público
2. Que la columna 'images' existe en la tabla properties (puedes verificar en Table Editor)
3. Que tu usuario está autenticado
4. Que las políticas se ejecutaron sin errores

## 📱 Resultado esperado:
Una vez completados estos pasos, podrás subir imágenes y verlas en las propiedades sin errores.
