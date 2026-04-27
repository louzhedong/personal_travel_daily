import FancySelect from '../ui/FancySelect';
import {
  MARKER_BUDGET_LEVEL_OPTIONS,
  MARKER_MOOD_OPTIONS,
  MARKER_TAG_OPTIONS,
  MARKER_TRANSPORT_OPTIONS,
  MARKER_WEATHER_OPTIONS,
} from '../../lib/markerMetadata';
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
      <FancySelect
        value={filters.tag}
        onChange={(value) => onChange({ ...filters, tag: value as StatsUiFilters['tag'] })}
        placeholder="全部标签"
        ariaLabel="按标签筛选统计中心"
        options={[{ value: 'all', label: '全部标签' }, ...MARKER_TAG_OPTIONS]}
      />
      <FancySelect
        value={filters.mood}
        onChange={(value) => onChange({ ...filters, mood: value as StatsUiFilters['mood'] })}
        placeholder="全部心情"
        ariaLabel="按心情筛选统计中心"
        options={[{ value: 'all', label: '全部心情' }, ...MARKER_MOOD_OPTIONS]}
      />
      <FancySelect
        value={filters.weather}
        onChange={(value) => onChange({ ...filters, weather: value as StatsUiFilters['weather'] })}
        placeholder="全部天气"
        ariaLabel="按天气筛选统计中心"
        options={[{ value: 'all', label: '全部天气' }, ...MARKER_WEATHER_OPTIONS]}
      />
      <FancySelect
        value={filters.transport}
        onChange={(value) => onChange({ ...filters, transport: value as StatsUiFilters['transport'] })}
        placeholder="全部交通方式"
        ariaLabel="按交通方式筛选统计中心"
        options={[{ value: 'all', label: '全部交通方式' }, ...MARKER_TRANSPORT_OPTIONS]}
      />
      <FancySelect
        value={filters.budgetLevel}
        onChange={(value) => onChange({ ...filters, budgetLevel: value as StatsUiFilters['budgetLevel'] })}
        placeholder="全部预算级别"
        ariaLabel="按预算级别筛选统计中心"
        options={[{ value: 'all', label: '全部预算级别' }, ...MARKER_BUDGET_LEVEL_OPTIONS]}
      />
    </section>
  );
}
