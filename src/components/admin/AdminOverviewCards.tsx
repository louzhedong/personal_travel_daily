import { useMemo } from 'react';
import type { AdminOverviewResponseDto } from '../../lib/api/types';
import { getAdminSummary } from '../../modules/admin/adminPageModel';

interface AdminOverviewCardsProps {
  overview: AdminOverviewResponseDto;
}

export default function AdminOverviewCards({ overview }: AdminOverviewCardsProps) {
  const summary = useMemo(() => getAdminSummary(overview), [overview]);

  // Keep card labels and tones stable after the split.
  // 在组件拆分后保持卡片文案与色调映射不变。
  const items = [
    { label: '系统用户', value: summary.accountCount, tone: 'blue' },
    { label: '行程', value: summary.tripCount, tone: 'green' },
    { label: '同行人', value: summary.companionCount, tone: 'teal' },
    { label: '旅行记录', value: summary.markerCount, tone: 'orange' },
    { label: '收藏攻略', value: summary.savedGuideCount, tone: 'sky' },
    { label: '攻略搜索', value: summary.guideSearchHistoryCount, tone: 'slate' },
    { label: '记录搜索', value: summary.markerSearchEventCount, tone: 'blue' },
  ];

  return (
    <section className="admin-summary-grid">
      {items.map((item) => (
        <article key={item.label} className={`card admin-summary-card admin-summary-card-${item.tone}`}>
          <span className="admin-summary-label">{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}
