import FancySelect from '../ui/FancySelect';
import type { AdminAccountNodeDto } from '../../lib/api/types';
import {
  ADMIN_QUALITY_SEVERITY_LABELS,
  ADMIN_QUALITY_TYPE_LABELS,
  type AdminQualityFilters,
  type AdminQualitySeverityFilter,
  type AdminQualityTypeFilter,
} from '../../modules/admin/adminPageModel';

interface AdminQualityFiltersPanelProps {
  accounts: AdminAccountNodeDto[];
  filters: AdminQualityFilters;
  summary: string;
  onChange: (filters: AdminQualityFilters) => void;
  onReset: () => void;
}

export default function AdminQualityFiltersPanel({
  accounts,
  filters,
  summary,
  onChange,
  onReset,
}: AdminQualityFiltersPanelProps) {
  return (
    <section className="admin-quality-filters">
      <div className="admin-quality-filters-heading">
        <div>
          <h3>问题筛选</h3>
          <p>{summary}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onReset}>
          重置
        </button>
      </div>

      <div className="admin-quality-filter-grid">
        <FancySelect
          value={filters.severity}
          placeholder="严重程度"
          ariaLabel="严重程度"
          options={[
            { value: 'all', label: '全部严重程度' },
            ...Object.entries(ADMIN_QUALITY_SEVERITY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) =>
            onChange({
              ...filters,
              severity: value as AdminQualitySeverityFilter,
            })
          }
          usePortal
        />
        <FancySelect
          value={filters.type}
          placeholder="问题类型"
          ariaLabel="问题类型"
          options={[
            { value: 'all', label: '全部问题类型' },
            ...Object.entries(ADMIN_QUALITY_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(value) =>
            onChange({
              ...filters,
              type: value as AdminQualityTypeFilter,
            })
          }
          usePortal
        />
        <FancySelect
          value={filters.accountId}
          placeholder="账号"
          ariaLabel="账号"
          options={[
            { value: 'all', label: '全部账号' },
            ...accounts.map((account) => ({
              value: account.id,
              label: account.name,
            })),
          ]}
          onChange={(value) =>
            onChange({
              ...filters,
              accountId: value,
            })
          }
          usePortal
        />
        <label className="admin-quality-search">
          <input
            className="field-control"
            value={filters.keyword}
            placeholder="搜索问题、账号或目标"
            aria-label="关键词"
            onChange={(event) =>
              onChange({
                ...filters,
                keyword: event.target.value,
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
