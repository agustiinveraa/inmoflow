# 🏘️ CRM Inmobiliario - MVP

Un sistema CRM completo para agentes inmobiliarios construido con Next.js y Supabase.

## ✅ Características del MVP

### 🔐 Autenticación
- ✅ Login y registro con email/contraseña
- ✅ Creación automática de perfil de usuario
- ✅ Gestión de sesiones con Supabase Auth

### 🏘️ Módulo de Propiedades
- ✅ Listado de propiedades en formato cards
- ✅ Crear nuevas propiedades (título, tipo, dirección, precio, descripción, estado)
- ✅ **📷 Subida de hasta 5 fotos por propiedad**
- ✅ Editar y eliminar propiedades
- ✅ Filtrar por estado (Disponible, Reservada, Vendida, Alquilada)
- ✅ Estados: Disponible, Reservado, Vendido, Alquilado
- ✅ Vista previa de imágenes en cards

### 👥 Módulo de Clientes (Leads)
- ✅ Lista de clientes con información de contacto
- ✅ Crear nuevos clientes (nombre, teléfono, email, notas)
- ✅ Sistema de gestión de leads
- ✅ Historial básico de interacciones

### 📅 Agenda de Visitas
- ✅ Programar visitas asociando cliente y propiedad
- ✅ Vista de visitas de hoy
- ✅ Lista de próximas visitas
- ✅ Gestión completa CRUD de visitas

### 📊 Dashboard
- ✅ Resumen de propiedades activas
- ✅ Número de clientes
- ✅ Visitas programadas
- ✅ Estadísticas generales

### ⚙️ Configuración
- ✅ Cambiar email de usuario
- ✅ Cambiar contraseña
- ✅ Gestión de cuenta
- ✅ Cerrar sesión

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd crm-inmobiliario
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia las variables de entorno y crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_de_supabase
```

### 4. Configurar la Base de Datos y Storage

1. Ve al SQL Editor en tu dashboard de Supabase
2. Ejecuta el archivo `supabase-policies.sql` para:
   - Crear las tablas necesarias
   - Configurar Row Level Security (RLS)
   - Establecer políticas de acceso
   - Crear triggers automáticos
   - Agregar columnas para imágenes

3. Configura el Storage para imágenes:
   - Ve a **Storage** > **New bucket**
   - Crea un bucket llamado `property-images` (público)
   - Sigue las instrucciones en `storage-setup.md`

### 5. Ejecutar el proyecto
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
crm-inmobiliario/
├── pages/
│   └── index.tsx              # Página principal con auth
├── src/
│   ├── components/
│   │   ├── Layout.tsx         # Layout principal con sidebar
│   │   ├── Dashboard.tsx      # Dashboard con estadísticas
│   │   ├── Properties.tsx     # Gestión de propiedades
│   │   ├── Clients.tsx        # Gestión de clientes
│   │   ├── Visits.tsx         # Agenda de visitas
│   │   └── Settings.tsx       # Configuración de cuenta
│   ├── lib/
│   │   └── supabaseClient.ts  # Cliente de Supabase configurado
│   └── types/
│       └── database.ts        # Tipos TypeScript de la BD
├── supabase-policies.sql      # Configuración de la base de datos
└── README.md
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales:

- **profiles**: Perfiles de usuario
- **clients**: Clientes y leads
- **properties**: Propiedades inmobiliarias
- **visits**: Visitas programadas

## 🎨 Características de Diseño

- **Responsive**: Funciona en móvil y desktop
- **Sidebar Navigation**: Navegación lateral intuitiva
- **Cards Layout**: Información organizada en cards
- **Modal Forms**: Formularios en ventanas modales
- **Color Coding**: Estados visuales con colores
- **Clean UI**: Interfaz limpia y profesional

## 🔧 Tecnologías Utilizadas

- **Frontend**: Next.js 13+ con TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: CSS-in-JS (inline styles)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL con Row Level Security

## 📱 Funcionalidades Móviles

El CRM está optimizado para dispositivos móviles:
- Layout responsive
- Sidebar colapsable
- Forms adaptables
- Touch-friendly buttons

## 🚀 Próximas Mejoras

### Fase 2:
- ✅ **Subida de fotos para propiedades**
- [ ] Calendario visual para visitas
- [ ] Filtros avanzados
- [ ] Matching automático cliente-propiedad
- [ ] Reportes y exportación

### Fase 3:
- [ ] Notificaciones push
- [ ] Chat integrado
- [ ] Geolocalización
- [ ] Integración con portales inmobiliarios
- [ ] API REST para integraciones

## 🔒 Seguridad

- Row Level Security (RLS) habilitado
- Políticas de acceso por usuario autenticado
- Validación en frontend y backend
- Gestión segura de sesiones

## 📞 Soporte

Para dudas o sugerencias sobre el MVP, puedes:
- Abrir un issue en el repositorio
- Contactar al equipo de desarrollo

---

**¡Tu CRM inmobiliario está listo para usar!** 🎉
