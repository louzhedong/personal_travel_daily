import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FancySelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FancySelectProps {
  value: string;
  options: FancySelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  usePortal?: boolean;
}

export function FancySelect({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  ariaLabel,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  usePortal = false,
}: FancySelectProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open || !usePortal) {
      return;
    }

    const updateMenuRect = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setMenuRect({
        left: rect.left,
        top: rect.bottom + 6,
        width: rect.width,
      });
    };

    updateMenuRect();
    window.addEventListener('resize', updateMenuRect);
    window.addEventListener('scroll', updateMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateMenuRect);
      window.removeEventListener('scroll', updateMenuRect, true);
    };
  }, [open, usePortal]);

  const menu = open ? (
    <div
      className={`fancy-select-menu ${menuClassName}`.trim()}
      style={
        usePortal && menuRect
          ? {
              position: 'fixed',
              left: menuRect.left,
              top: menuRect.top,
              width: menuRect.width,
            }
          : undefined
      }
    >
      {options.length === 0 ? (
        <div className="fancy-select-empty">暂无可选项</div>
      ) : (
        options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            className={option.value === value ? 'fancy-select-option active' : 'fancy-select-option'}
            onClick={() => {
              if (option.disabled) {
                return;
              }
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))
      )}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`fancy-select ${className}`.trim()}>
      <button
        type="button"
        className={`field-control fancy-select-trigger ${triggerClassName}`.trim()}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className={selectedOption ? 'fancy-select-value' : 'fancy-select-placeholder'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={open ? 'fancy-select-arrow open' : 'fancy-select-arrow'}>▾</span>
      </button>

      {usePortal && menu ? createPortal(menu, document.body) : menu}
    </div>
  );
}

export default FancySelect;
