import type { GuideSourceHealthDto } from '../../lib/api/types';

interface AdminGuideSourceHealthPanelProps {
  items: GuideSourceHealthDto[];
}

export default function AdminGuideSourceHealthPanel({
  items,
}: AdminGuideSourceHealthPanelProps) {
  return (
    <section className="admin-data-card">
      <div className="admin-section-title">
        <h3>来源健康度</h3>
      </div>
      {items.length === 0 ? (
        <div className="admin-empty-block">当前还没有来源健康度快照。</div>
      ) : (
        <div className="admin-stacked-list">
          {items.map((item) => (
            <div key={item.id} className="admin-list-row">
              <div>
                <strong>{item.sourceName}</strong>
                <p>{item.sourceDomain}</p>
              </div>
              <div>
                <strong>
                  成功 {item.recentSuccess} / 失败 {item.recentFailure}
                </strong>
                <p>{item.lastFailureReason ? `最近失败：${item.lastFailureReason}` : '最近暂无失败记录'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
