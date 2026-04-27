import type { ReactNode } from 'react';
import FancySelect from '../ui/FancySelect';
import type { Scope } from '../../types';

/**
 * Top filter toolbar (scope tabs + year select) with an optional batch slot.
 * 时间线顶部工具条：范围 tab + 年份筛选；整理模式下通过 slot 嵌入批量工具条。
 */

export type TimelineScopeFilter = Scope | 'all';
export type TimelineYearFilter = 'all' | string;

export interface TimelineToolbarProps {
  scopeFilter: TimelineScopeFilter;
  onScopeFilterChange: (value: TimelineScopeFilter) => void;
  yearFilter: TimelineYearFilter;
  onYearFilterChange: (value: TimelineYearFilter) => void;
  yearOptions: string[];
  // 整理模式下嵌入的批量工具条 / batch toolbar slot when selection mode on
  batchSlot?: ReactNode;
}

export default function TimelineToolbar({
  scopeFilter,
  onScopeFilterChange,
  yearFilter,
  onYearFilterChange,
  yearOptions,
  batchSlot,
}: TimelineToolbarProps) {
  return (
    <div className="trip-timeline-toolbar">
      <div className="saved-guides-filter-row" role="tablist" aria-label="时间线范围筛选">
        {([
          ['all', '全部'],
          ['domestic', '国内'],
          ['international', '国际'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={scopeFilter === value}
            className={scopeFilter === value ? 'guide-filter-chip active' : 'guide-filter-chip'}
            onClick={() => onScopeFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="trip-timeline-year-filter">
        <span className="trip-timeline-year-label">时间范围</span>
        <FancySelect
          value={yearFilter}
          onChange={onYearFilterChange}
          placeholder="全部年份"
          ariaLabel="按年份筛选时间线"
          className="trip-timeline-year-fancy"
          triggerClassName="trip-timeline-year-trigger"
          options={[
            { value: 'all', label: '全部年份' },
            ...yearOptions.map((year) => ({
              value: year,
              label: year,
            })),
          ]}
        />
      </label>
      {batchSlot}
    </div>
  );
}
