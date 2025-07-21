# Configuración del Storage para Imágenes de Propiedades

## ⚠️ IMPORTANTE: Crear el bucket ANTES de ejecutar las políticas

### 1. Crear el bucket de Storage (OBLIGATORIO)
1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Navega a **Storage** en el menú lateral
4. Haz clic en **"Create bucket"** (NO "New bucket")
5. Configura el bucket:
   - **Name**: `property-images` (exactamente así)
   - **Public bucket**: ✅ **DEBE estar marcado** (muy importante)
   - **File size limit**: 5MB (opcional)
   - **Allowed MIME types**: `image/*` (opcional)
6. Haz clic en **"Create bucket"**

### 2. Verificar que el bucket fue creado
- En Storage deberías ver el bucket `property-images` listado
- Debe mostrar como "Public" al lado del nombre

### 2. Ejecutar las políticas SQL
Después de crear el bucket, ve al **SQL Editor** y ejecuta estas consultas:

```sql
-- Agregar columna para imágenes
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Políticas para el Storage
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view property images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' AND
        auth.role() = 'authenticated'
    );
```
```

### 3. Configurar CORS (si es necesario)
Si experimentas problemas con CORS, puedes configurar las políticas CORS en Supabase:

1. Ve a **Settings** > **API**
2. En la sección **CORS Origins** agrega:
   - `http://localhost:3000` (para desarrollo)
   - Tu dominio de producción

### 4. Verificar la configuración
Para verificar que todo funciona correctamente:

1. Reinicia tu aplicación: `npm run dev`
2. Intenta crear una nueva propiedad con imágenes
3. Las imágenes deberían subirse automáticamente al bucket `property-images`

## Características implementadas:

✅ **Subida múltiple**: Hasta 5 imágenes por propiedad
✅ **Validaciones**: Tamaño máximo 5MB, solo imágenes
✅ **Vista previa**: Muestra las imágenes antes de guardar
✅ **Eliminación**: Permite eliminar imágenes individuales
✅ **Imagen principal**: La primera imagen se marca como principal
✅ **Optimización**: Las imágenes se almacenan en Supabase Storage
✅ **URL públicas**: Las imágenes son accesibles directamente

## Límites y consideraciones:

- **Máximo 5 imágenes** por propiedad (configurable)
- **Tamaño máximo**: 5MB por imagen
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Storage**: Las imágenes se almacenan en Supabase Storage
- **Costos**: Ten en cuenta los límites de storage de tu plan de Supabase

## Próximas mejoras posibles:

- Redimensionamiento automático de imágenes
- Compresión de imágenes
- Carga progresiva (lazy loading)
- Galería con zoom
- Reordenamiento de imágenes por drag & drop
