import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { useDropdownAnimation, useButtonAnimation } from '../hooks/useGSAP';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function Dropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  disabled = false 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useButtonAnimation();
  const dropdownListRef = useDropdownAnimation(isOpen);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 
          rounded-full text-black dark:text-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 
          focus:border-transparent outline-none text-left
          flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-black/20 dark:hover:border-white/20 cursor-pointer'}
          ${isOpen ? 'ring-2 ring-black/20 dark:ring-white/20' : ''}
        `}
        style={{ transition: 'none' }} // Desactivar CSS transitions para que GSAP tenga control
      >
        <span className={selectedOption ? 'text-black dark:text-white' : 'text-black/60 dark:text-white/60'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icons.ChevronDown 
          className={`w-4 h-4 text-black/60 dark:text-white/60 ${isOpen ? 'rotate-180' : ''}`}
          style={{ 
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        />
      </button>

      {isOpen && (
        <div 
          ref={dropdownListRef as React.RefObject<HTMLDivElement>}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-3xl shadow-lg max-h-60 overflow-hidden"
          style={{ opacity: 0 }} // Iniciamos invisible para que GSAP controle la animación
        >
          <div className="max-h-60 overflow-auto py-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 
                  text-sm
                  ${value === option.value 
                    ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white font-medium' 
                    : 'text-black/80 dark:text-white/80'
                  }
                  first:rounded-t-3xl last:rounded-b-3xl
                `}
                style={{ transition: 'background-color 0.15s ease' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
