import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// iOS-style easing curves
export const easing = {
  // iOS standard ease
  ios: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  // iOS ease-in-out (más suave)
  iosInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  // iOS bounce (para elementos que aparecen)
  iosBounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  // iOS smooth (ultra suave)
  iosSmooth: "cubic-bezier(0.4, 0.0, 0.2, 1)",
};

// Hook para animaciones de entrada
export const useEntranceAnimation = (dependencies: React.DependencyList = []) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      gsap.fromTo(elementRef.current, 
        {
          opacity: 0,
          y: 20,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: easing.iosSmooth,
        }
      );
    }
  }, dependencies);

  return elementRef;
};

// Hook para animaciones de hover
export const useHoverAnimation = () => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale: 1.02,
        duration: 0.3,
        ease: easing.iosInOut,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.3,
        ease: easing.iosInOut,
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return elementRef;
};

// Hook para animaciones de stagger (elementos que aparecen en secuencia)
export const useStaggerAnimation = (dependencies: React.DependencyList = []) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const children = containerRef.current.children;
      
      gsap.fromTo(children,
        {
          opacity: 0,
          y: 30,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: easing.iosSmooth,
          stagger: 0.1, // Cada elemento aparece 0.1s después del anterior
        }
      );
    }
  }, dependencies);

  return containerRef;
};

// Hook para animaciones de modal/overlay
export const useModalAnimation = (isOpen: boolean) => {
  const overlayRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (overlayRef.current && modalRef.current) {
      if (isOpen) {
        // Animación de entrada
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(modalRef.current, { opacity: 0, scale: 0.9, y: 50 });
        
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: easing.iosInOut,
        });
        
        gsap.to(modalRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: easing.iosBounce,
          delay: 0.1,
        });
      } else {
        // Animación de salida
        gsap.to(modalRef.current, {
          opacity: 0,
          scale: 0.95,
          y: 30,
          duration: 0.25,
          ease: easing.iosInOut,
        });
        
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: easing.iosInOut,
          delay: 0.1,
        });
      }
    }
  }, [isOpen]);

  return { overlayRef, modalRef };
};

// Hook para animaciones de dropdown
export const useDropdownAnimation = (isOpen: boolean) => {
  const dropdownRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (dropdownRef.current) {
      if (isOpen) {
        gsap.fromTo(dropdownRef.current,
          {
            opacity: 0,
            scaleY: 0.95,
            y: -10,
          },
          {
            opacity: 1,
            scaleY: 1,
            y: 0,
            duration: 0.25,
            ease: easing.iosSmooth,
            transformOrigin: "top center",
          }
        );

        // Animar los children con stagger
        const children = dropdownRef.current.children;
        if (children.length > 0) {
          gsap.fromTo(children,
            {
              opacity: 0,
              x: -10,
            },
            {
              opacity: 1,
              x: 0,
              duration: 0.2,
              ease: easing.iosInOut,
              stagger: 0.03,
              delay: 0.1,
            }
          );
        }
      }
    }
  }, [isOpen]);

  return dropdownRef;
};

// Hook para animaciones de botones
export const useButtonAnimation = () => {
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;

    const handleMouseDown = () => {
      gsap.to(element, {
        scale: 0.96,
        duration: 0.1,
        ease: easing.iosInOut,
      });
    };

    const handleMouseUp = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.2,
        ease: easing.iosBounce,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.2,
        ease: easing.iosInOut,
      });
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return buttonRef;
};

// Hook para animaciones de formularios
export const useFormAnimation = () => {
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (formRef.current) {
      const inputs = formRef.current.querySelectorAll('input, textarea, select, [role="combobox"]');
      
      gsap.fromTo(inputs,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: easing.iosSmooth,
          stagger: 0.05, // Cada input aparece 50ms después del anterior
        }
      );
    }
  }, []);

  return formRef;
};

// Hook para animaciones de inputs individuales (focus/blur)
export const useInputAnimation = () => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;

    const handleFocus = () => {
      gsap.to(element, {
        scale: 1.02,
        duration: 0.2,
        ease: easing.iosInOut,
      });
    };

    const handleBlur = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.2,
        ease: easing.iosInOut,
      });
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, []);

  return inputRef;
};

// Hook para animaciones de calendario
export const useCalendarAnimation = () => {
  const calendarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (calendarRef.current) {
      const cells = calendarRef.current.querySelectorAll('[data-calendar-cell]');
      
      gsap.fromTo(cells,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: easing.iosSmooth,
          stagger: {
            grid: [6, 7], // 6 filas, 7 columnas (calendario)
            from: "start",
            amount: 0.4,
          },
        }
      );
    }
  }, []);

  return calendarRef;
};

// Utilidad para animaciones personalizadas
export const animateElement = {
  // Slide in desde diferentes direcciones
  slideInUp: (element: HTMLElement, duration = 0.4) => {
    return gsap.fromTo(element,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration, ease: easing.iosSmooth }
    );
  },
  
  slideInDown: (element: HTMLElement, duration = 0.4) => {
    return gsap.fromTo(element,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration, ease: easing.iosSmooth }
    );
  },
  
  slideInLeft: (element: HTMLElement, duration = 0.4) => {
    return gsap.fromTo(element,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration, ease: easing.iosSmooth }
    );
  },
  
  slideInRight: (element: HTMLElement, duration = 0.4) => {
    return gsap.fromTo(element,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration, ease: easing.iosSmooth }
    );
  },
  
  // Fade with scale
  fadeInScale: (element: HTMLElement, duration = 0.5) => {
    return gsap.fromTo(element,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration, ease: easing.iosBounce }
    );
  },
  
  // Slide out
  slideOut: (element: HTMLElement, direction = 'up', duration = 0.3) => {
    const movements = {
      up: { y: -30 },
      down: { y: 30 },
      left: { x: -30 },
      right: { x: 30 }
    };
    
    return gsap.to(element, {
      opacity: 0,
      ...movements[direction as keyof typeof movements],
      duration,
      ease: easing.iosInOut
    });
  }
};
