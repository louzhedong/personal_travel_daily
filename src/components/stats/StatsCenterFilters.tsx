import FancySelect from '../ui/FancySelect';
import type { StatsOverviewResponseDto } from '../../lib/api/types';
import type { StatsUiFilters } from '../../modules/stats/statsCenterModel';

interface StatsCenterFiltersProps {
  filters: StatsUiFilters;
  data: StatsOverviewResponseDto;
  onChange: (nextFilters: StatsUiFilters) => void;
}

export default function StatsCenterFilters({ filters, data, onChange }: StatsCenterFiltersProps) {
  return (
    <section className="stats-center-filters">
      <FancySelect
        value={filters.year}
        onChange={(value) => onChange({ ...filters, year: value })}
        placeholder="全部年份"
        ariaLabel="按年份筛选统计中心"
        options={[
          { value: 'all', label: '全部年份' },
          ...data.availableYears.map((year) => ({ value: year, label: `${year} 年` })),
        ]}
      />
      <FancySelect
        value={filters.scope}
        onChange={(value) => onChange({ ...filters, scope: value as StatsUiFilters['scope'] })}
        placeholder="全部范围"
        ariaLabel="按范围筛选统计中心"
        options={[
          { value: 'all', label: '全部范围' },
          { value: 'domestic', label: '国内' },
          { value: 'international', label: '国际' },
        ]}
      />
      <FancySelect
        value={filters.companionId}
        onChange={(value) => onChange({ ...filters, companionId: value })}
        placeholder="全部旅伴"
        ariaLabel="按旅伴筛选统计中心"
        options={[
          { value: 'all', label: '全部旅伴' },
          ...data.companions.map((companion) => ({
            value: companion.id,
            label: companion.name,
          })),
        ]}
      />
      <FancySelect
        value={filters.tripId}
        onChange={(value) => onChange({ ...filters, tripId: value })}
        placeholder="全部行程"
        ariaLabel="按行程筛选统计中心"
        options={[
          { value: 'all', label: '全部行程' },
          { value: 'unassigned', label: '未归入行程' },
          ...data.trips.map((trip) => ({
            value: trip.id,
            label: trip.name,
          })),
        ]}
      />
    </section>
  );
}
