# 🎨 Animaciones GSAP para CRM Inmobiliario

## 📱 **Filosofía iOS - Animaciones Ultra Suaves**

Hemos implementado un sistema completo de animaciones usando GSAP que replica la suavidad y fluidez de iOS de Apple. Todas las animaciones utilizan curvas de easing personalizadas inspiradas en iOS.

## 🛠️ **Hooks Disponibles**

### 1. **useEntranceAnimation()**
Animación de entrada para páginas completas.
```tsx
const pageRef = useEntranceAnimation();
return <div ref={pageRef}>Contenido</div>;
```
- **Efecto**: Fade in + slide up + scale ligero
- **Duración**: 0.6s con easing iOS smooth

### 2. **useStaggerAnimation(dependencies)**
Animaciones escalonadas para listas de elementos.
```tsx
const listRef = useStaggerAnimation([items.length]);
return (
  <div ref={listRef}>
    {items.map(item => <div key={item.id}>{item.name}</div>)}
  </div>
);
```
- **Efecto**: Cada hijo aparece 0.1s después del anterior
- **Ideal para**: Cards, listas, grids

### 3. **useModalAnimation(isOpen)**
Animación específica para modales y overlays.
```tsx
const { overlayRef, modalRef } = useModalAnimation(showModal);
return showModal && (
  <div ref={overlayRef} className="overlay">
    <div ref={modalRef} className="modal">Contenido</div>
  </div>
);
```
- **Entrada**: Fade overlay + bounce modal desde abajo
- **Salida**: Fade out suave con scale down

### 4. **useDropdownAnimation(isOpen)**
Animación para dropdowns y menús desplegables.
```tsx
const dropdownRef = useDropdownAnimation(isOpen);
return isOpen && (
  <div ref={dropdownRef}>
    {options.map(option => <button key={option.id}>{option.label}</button>)}
  </div>
);
```
- **Efecto**: Scale Y desde arriba + stagger en opciones
- **Transformorigin**: Top center para naturalidad

### 5. **useButtonAnimation()**
Animaciones de interacción para botones.
```tsx
const buttonRef = useButtonAnimation();
return <button ref={buttonRef}>Click me</button>;
```
- **mousedown**: Scale down a 0.96
- **mouseup**: Bounce back con iOS bounce easing
- **mouseleave**: Return smooth

### 6. **useHoverAnimation()**
Hover suave para cualquier elemento.
```tsx
const hoverRef = useHoverAnimation();
return <div ref={hoverRef}>Hover me</div>;
```
- **hover**: Scale up a 1.02
- **leave**: Return smooth

## 🎯 **Curvas de Easing iOS**

```tsx
export const easing = {
  ios: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  iosInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  iosBounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  iosSmooth: "cubic-bezier(0.4, 0.0, 0.2, 1)",
};
```

## ⚡ **Utilidades Animatelement**

Para animaciones puntuales y programáticas:

```tsx
import { animateElement } from '../hooks/useGSAP';

// Slide in desde diferentes direcciones
animateElement.slideInUp(element);
animateElement.slideInDown(element);
animateElement.slideInLeft(element);
animateElement.slideInRight(element);

// Fade con scale
animateElement.fadeInScale(element);

// Slide out
animateElement.slideOut(element, 'up');
```

## 🏆 **Implementación Actual**

### ✅ **Componentes con Animaciones GSAP:**

1. **Dropdown.tsx**
   - Botón con animación de press
   - Lista desplegable con scale Y suave
   - Opciones con hover y stagger
   - Chevron rotation iOS-style

2. **Visits.tsx**
   - Página con entrance animation
   - Modal con animaciones iOS de overlay
   - Grid de visitas con stagger
   - Botón "Nueva Visita" con press animation

3. **Dashboard.tsx**
   - Entrada de página suave
   - Cards de estadísticas con stagger
   - Lista de actividad reciente animada

## 🎨 **Características Destacadas**

### **Suavidad iOS**
- Curvas de easing auténticas de iOS
- Duraciones optimizadas (0.2s-0.6s)
- Transform origin natural

### **Performance**
- GSAP maneja las transformaciones
- CSS transitions deshabilitadas donde corresponde
- GPU acceleration automática

### **Responsivo**
- Animaciones que respetan reduced motion
- Escalas sutiles (1.01, 1.02)
- Stagger timing optimizado

### **Consistencia**
- Mismas duraciones en toda la app
- Easing unificado
- Patrones de animación coherentes

## 🚀 **Próximos Pasos**

Para completar el sistema iOS-style:

1. **Properties.tsx** - Agregar animaciones a la vista de propiedades
2. **Clients.tsx** - Animaciones para la gestión de clientes
3. **UserManagement.tsx** - Animaciones para configuración
4. **Page transitions** - Transiciones entre vistas
5. **Loading states** - Animaciones de carga iOS-style

## 💡 **Tips de Uso**

1. **Usa `style={{ transition: 'none' }}`** en elementos controlados por GSAP
2. **Inicia elementos invisibles** con `opacity: 0` para que GSAP los controle
3. **Referencias de TypeScript** usa `as React.RefObject<HTMLElement>`
4. **Dependencies en hooks** actualiza cuando cambien los datos para re-animar

## 🎯 **Resultado**

Una experiencia de usuario que rivaliza con aplicaciones nativas de iOS, con animaciones fluidas, naturales y profesionales que hacen que la aplicación se sienta premium y moderna.
