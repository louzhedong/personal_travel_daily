import { useState } from 'react';
import type { GuideSourceHealthDto } from '../../lib/api/types';
import { updateGuideSourcePreference } from '../../lib/api/guideSourceHealthApi';
import FancySelect from '../ui/FancySelect';

interface AdminGuideSourceHealthPanelProps {
  items: GuideSourceHealthDto[];
  onUpdated?: (item: GuideSourceHealthDto) => void;
}

export default function AdminGuideSourceHealthPanel({
  items,
  onUpdated = () => {},
}: AdminGuideSourceHealthPanelProps) {
  const [savingKey, setSavingKey] = useState('');
  const priorityOptions = [
    { value: '-3', label: '强降权' },
    { value: '-1', label: '轻降权' },
    { value: '0', label: '常规' },
    { value: '1', label: '轻升权' },
    { value: '3', label: '强升权' },
  ];

  const handlePriorityChange = async (item: GuideSourceHealthDto, value: string) => {
    const priorityWeight = Number(value);
    setSavingKey(item.id);
    try {
      const response = await updateGuideSourcePreference({
        sourceName: item.sourceName,
        sourceDomain: item.sourceDomain,
        priorityWeight,
        demotionReason: priorityWeight < 0 ? item.suggestion?.reason : undefined,
      });
      onUpdated(response.item);
    } finally {
      setSavingKey('');
    }
  };

  return (
    <section className="admin-data-card">
      <div className="admin-section-title">
        <h3>来源优先级与健康度</h3>
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
                {item.quality ? (
                  <p>
                    质量分 {item.quality.score} · {item.quality.reasons.join(' / ')}
                  </p>
                ) : null}
                {item.suggestion ? <p>{`${item.suggestion.label}：${item.suggestion.reason}`}</p> : null}
              </div>
              <div className="admin-source-priority-controls">
                <FancySelect
                  ariaLabel={`${item.sourceName} 来源优先级`}
                  value={String(item.priorityWeight ?? 0)}
                  options={priorityOptions}
                  onChange={(value) => void handlePriorityChange(item, value)}
                  placeholder="优先级"
                  triggerClassName="admin-source-priority-trigger"
                  menuClassName="admin-source-priority-menu"
                />
                <span>{savingKey === item.id ? '保存中...' : item.demotionReason ?? '后台可调整优先级，不删除来源'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
