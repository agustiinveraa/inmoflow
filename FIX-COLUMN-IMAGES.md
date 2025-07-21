# 🚨 Error: Columna 'images' no encontrada en tabla 'properties'

## El problema:
Error PGRST204: "Could not find the 'images' column of 'properties' in the schema cache"

## ✅ Solución rápida:

### 1. Ve al SQL Editor de Supabase
1. **Abre tu dashboard de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a "SQL Editor"** (en el menú lateral izquierdo)

### 2. Ejecuta este comando SQL
Copia y pega exactamente este comando:

```sql
-- Agregar columna para imágenes si no existe
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];
```

### 3. Verifica que se agregó la columna
1. Ve a **Table Editor** en el menú lateral
2. Selecciona la tabla **properties**
3. Deberías ver una nueva columna llamada **images** de tipo **text[]**

### 4. Prueba crear una propiedad nuevamente
Ahora ya debería funcionar sin errores.

## 🔍 Explicación técnica:
- La columna `images` almacena un array de URLs de las imágenes
- Es de tipo `TEXT[]` (array de texto)
- Por defecto está vacía: `ARRAY[]::TEXT[]`

## ⚠️ Importante:
Este comando es seguro de ejecutar porque usa `IF NOT EXISTS`, así que no causará errores si ya existe la columna.

## 📱 Resultado esperado:
Podrás crear propiedades con imágenes sin el error PGRST204.
