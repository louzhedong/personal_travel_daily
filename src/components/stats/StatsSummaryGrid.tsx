import type { StatsOverviewResponseDto } from '../../lib/api/types';
import { buildStatsSummaryItems } from '../../modules/stats/statsCenterModel';

interface StatsSummaryGridProps {
  data: StatsOverviewResponseDto;
}

export default function StatsSummaryGrid({ data }: StatsSummaryGridProps) {
  const items = buildStatsSummaryItems(data);

  return (
    <section className="stats-summary-grid">
      {items.map((item) => (
        <article key={item.label} className="card stats-summary-card">
          <span className="stats-summary-label">{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}
