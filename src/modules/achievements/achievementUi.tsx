import Dialog from '../../components/ui/Dialog';
import type { AppToastTone } from '../../components/ui/AppToast';
import type { StatsAchievementDto } from '../../lib/api/types';
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_RARITY_LABELS,
  ACHIEVEMENT_STATUS_LABELS,
  getAchievementPeriodLabel,
  getAchievementProgress,
} from './achievementsPageModel';
import { useAchievementShareCard } from './useAchievementShareCard';

export function AchievementCard({
  achievement,
  onClick,
  showPeriod = false,
}: {
  achievement: StatsAchievementDto;
  onClick: (achievement: StatsAchievementDto) => void;
  showPeriod?: boolean;
}) {
  const progress = getAchievementProgress(achievement);

  return (
    <button
      type="button"
      className={`stats-achievement-card is-${achievement.status} is-${achievement.rarity}`}
      onClick={() => onClick(achievement)}
    >
      <div className="stats-achievement-card-top">
        <span className="stats-achievement-category">{ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}</span>
        <div className="stats-achievement-chip-row">
          <span className={`stats-achievement-rarity is-${achievement.rarity}`}>
            {ACHIEVEMENT_RARITY_LABELS[achievement.rarity]}
          </span>
          <span className="stats-achievement-status">{ACHIEVEMENT_STATUS_LABELS[achievement.status]}</span>
        </div>
      </div>
      <strong>{achievement.title}</strong>
      <p>{achievement.description}</p>
      {showPeriod ? <span className="stats-achievement-period">{getAchievementPeriodLabel(achievement)}</span> : null}
      {achievement.nextHint && achievement.status !== 'unlocked' ? (
        <span className="stats-achievement-next-hint">{achievement.nextHint}</span>
      ) : null}
      <div className="stats-achievement-progress-row">
        <span>
          {achievement.progressValue}/{achievement.progressTarget} {achievement.unit}
        </span>
        <span>{progress}%</span>
      </div>
      <div className="stats-achievement-track" aria-hidden="true">
        <div className="stats-achievement-fill" style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

export function AchievementDetailDialog({
  achievement,
  onClose,
  accountName,
  showToast,
}: {
  achievement: StatsAchievementDto | null;
  onClose: () => void;
  accountName: string;
  showToast?: (message: string, tone?: AppToastTone) => void;
}) {
  const saveShareCard = useAchievementShareCard({ accountName, showToast });

  return (
    <Dialog
      open={!!achievement}
      title={achievement?.title ?? '旅行成就'}
      eyebrow="Achievement Detail"
      description={
        achievement ? (
          <span>
            {ACHIEVEMENT_STATUS_LABELS[achievement.status]} · {achievement.progressValue}/{achievement.progressTarget}{' '}
            {achievement.unit}
          </span>
        ) : undefined
      }
      onClose={onClose}
    >
      {achievement ? (
        <div className="stats-achievement-detail">
          <div className="stats-achievement-detail-meta">
            <span className={`stats-achievement-rarity is-${achievement.rarity}`}>
              {ACHIEVEMENT_RARITY_LABELS[achievement.rarity]}
            </span>
            <span>{ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}</span>
            <span>{getAchievementPeriodLabel(achievement)}</span>
          </div>
          <p>{achievement.description}</p>
          <div className="stats-achievement-detail-track">
            <div style={{ width: `${getAchievementProgress(achievement)}%` }} />
          </div>
          <strong>
            {achievement.status === 'unlocked'
              ? '达成证据'
              : `还差 ${
                  achievement.remainingValue ?? Math.max(achievement.progressTarget - achievement.progressValue, 0)
                } ${achievement.unit}`}
          </strong>
          {achievement.nextHint && achievement.status !== 'unlocked' ? (
            <p className="stats-achievement-detail-hint">{achievement.nextHint}</p>
          ) : null}
          {(achievement.evidence?.length ?? 0) > 0 ? (
            <div className="stats-achievement-evidence-list">
              {achievement.evidence?.map((item) => (
                <article key={`${item.label}-${item.value}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="stats-empty">当前筛选条件下还没有可展示的支撑记录。</div>
          )}
          {achievement.firstUnlockedAt ? (
            <span className="stats-achievement-unlocked-at">首次解锁：{new Date(achievement.firstUnlockedAt).toLocaleString('zh-CN')}</span>
          ) : null}
          <button
            type="button"
            className="ghost-button stats-achievement-share-button"
            onClick={() => saveShareCard(achievement)}
            disabled={achievement.status === 'locked'}
            title={achievement.status === 'locked' ? '达成后可解锁分享卡' : undefined}
          >
            保存分享卡
          </button>
        </div>
      ) : null}
    </Dialog>
  );
}
