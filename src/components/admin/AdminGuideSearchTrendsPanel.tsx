import type { GuideSearchTrendPointDto } from '../../lib/api/types';

interface AdminGuideSearchTrendsPanelProps {
  items: GuideSearchTrendPointDto[];
}

export default function AdminGuideSearchTrendsPanel({
  items,
}: AdminGuideSearchTrendsPanelProps) {
  return (
    <section className="admin-data-card">
      <div className="admin-section-title">
        <h3>攻略搜索趋势</h3>
      </div>
      {items.length === 0 ? (
        <div className="admin-empty-block">最近 30 天还没有攻略搜索日志。</div>
      ) : (
        <div className="admin-stacked-list">
          {items.map((item) => (
            <div key={item.date} className="admin-list-row">
              <div>
                <strong>{item.date}</strong>
                <p>
                  成功 {item.successCount} · 无结果 {item.emptyCount} · 失败 {item.errorCount}
                </p>
              </div>
              <div>
                <strong>{item.totalCount}</strong>
                <p>
                  {item.topKeywords.length > 0
                    ? `Top: ${item.topKeywords
                        .map((keyword) => `${keyword.keyword} (${keyword.count})`)
                        .join(' / ')}`
                    : '暂无高频关键词'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
