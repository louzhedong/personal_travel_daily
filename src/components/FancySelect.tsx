import { useEffect, useMemo, useRef, useState } from 'react';

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
  className?: string;
  triggerClassName?: string;
}

export function FancySelect({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  triggerClassName = '',
}: FancySelectProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={rootRef} className={`fancy-select ${className}`.trim()}>
      <button
        type="button"
        className={`field-control fancy-select-trigger ${triggerClassName}`.trim()}
        disabled={disabled}
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

      {open ? (
        <div className="fancy-select-menu">
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
      ) : null}
    </div>
  );
}

export default FancySelect;
