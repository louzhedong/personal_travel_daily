import { useEffect, useMemo, useRef, useState } from 'react';

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
}

interface CalendarDay {
  date: Date;
  value: string;
  day: number;
  inMonth: boolean;
  disabled: boolean;
}

const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
const todayValue = formatDateValue(new Date());

function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayValue(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return '年 / 月 / 日';
  }

  return `${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${String(date.getDate()).padStart(2, '0')}`;
}

function getMonthLabel(date: Date) {
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
}

function getInitialMonth(value: string, min?: string, max?: string) {
  return parseDateValue(value) ?? parseDateValue(min) ?? parseDateValue(max) ?? new Date();
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function compareMonth(a: Date, b: Date) {
  return a.getFullYear() * 12 + a.getMonth() - (b.getFullYear() * 12 + b.getMonth());
}

function buildCalendarDays(month: Date, min?: string, max?: string): CalendarDay[] {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const minValue = min || '';
  const maxValue = max || '';

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const value = formatDateValue(date);

    return {
      date,
      value,
      day: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
      disabled: Boolean((minValue && value < minValue) || (maxValue && value > maxValue)),
    };
  });
}

export default function DateField({
  value,
  onChange,
  ariaLabel,
  min,
  max,
  className = '',
  disabled = false,
}: DateFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value, min, max));
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth, min, max), [visibleMonth, min, max]);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);
  const canGoPrev = !minDate || compareMonth(addMonths(visibleMonth, -1), minDate) >= 0;
  const canGoNext = !maxDate || compareMonth(addMonths(visibleMonth, 1), maxDate) <= 0;
  const todayDisabled = Boolean((min && todayValue < min) || (max && todayValue > max));

  useEffect(() => {
    if (value) {
      const nextMonth = parseDateValue(value);
      if (nextMonth) {
        setVisibleMonth(nextMonth);
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handlePickDate = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  const handleToday = () => {
    const date = parseDateValue(todayValue);
    if (date) {
      setVisibleMonth(date);
    }
    handlePickDate(todayValue);
  };

  return (
    <div ref={rootRef} className={`date-field ${value ? '' : 'empty'} ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="date-field-trigger"
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className="date-field-display">{formatDisplayValue(value)}</span>
        <span className="date-field-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M7 4v3M17 4v3M5 9h14M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="date-picker-panel" role="dialog" aria-label={`${ariaLabel}选择器`}>
          <div className="date-picker-header">
            <strong>{getMonthLabel(visibleMonth)}</strong>
            <div className="date-picker-nav">
              <button
                type="button"
                className="date-picker-icon-button"
                disabled={!canGoPrev}
                aria-label="上个月"
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              >
                ‹
              </button>
              <button
                type="button"
                className="date-picker-icon-button"
                disabled={!canGoNext}
                aria-label="下个月"
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              >
                ›
              </button>
            </div>
          </div>

          <div className="date-picker-weekdays" aria-hidden="true">
            {weekLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="date-picker-grid">
            {calendarDays.map((day) => (
              <button
                key={day.value}
                type="button"
                disabled={day.disabled}
                aria-label={day.value}
                className={[
                  'date-picker-day',
                  day.inMonth ? '' : 'outside',
                  day.value === value ? 'selected' : '',
                  day.value === todayValue ? 'today' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handlePickDate(day.value)}
              >
                {day.day}
              </button>
            ))}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="date-picker-text-button" onClick={() => handlePickDate('')}>
              清除
            </button>
            <button
              type="button"
              className="date-picker-text-button"
              disabled={todayDisabled}
              onClick={handleToday}
            >
              今天
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
