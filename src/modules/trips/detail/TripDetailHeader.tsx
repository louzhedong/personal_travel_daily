import type { TripDetailResponseDto } from '../../../lib/api/types';
import type { AuthAccount } from '../../../types';
import { formatTripDetailDateRange } from '../tripDetailPageModel';

interface TripDetailHeaderProps {
  account: AuthAccount;
  data: TripDetailResponseDto | null;
  displayCoverUrl?: string;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
  onOpenEditor: () => void;
  onOpenTripStory?: (tripId: string) => void;
  onOpenMemoryCapsules?: () => void;
  onOpenDeleteDialog: () => void;
}

export default function TripDetailHeader({
  account,
  data,
  displayCoverUrl,
  tripId,
  onNavigateBack,
  onLogout,
  onOpenEditor,
  onOpenTripStory,
  onOpenMemoryCapsules,
  onOpenDeleteDialog,
}: TripDetailHeaderProps) {
  return (
    <section className="trip-detail-hero card">
      <div className="trip-detail-hero-copy">
        <span className="hero-kicker">行程详情</span>
        <h1>{data?.trip.name ?? '正在载入行程...'}</h1>
        <p>
          {data
            ? `${formatTripDetailDateRange(data.trip.startsAt, data.trip.endsAt)} · 当前账号 ${account.name}`
            : '从统计中心钻取后，可在这里回看某个具体行程的记录、攻略和照片。'}
        </p>
        <div className="trip-detail-hero-actions">
          <button type="button" className="ghost-button trip-detail-action-button trip-detail-action-button-secondary" onClick={onNavigateBack}>
            返回统计中心
          </button>
          {data ? (
            <button type="button" className="ghost-button trip-detail-action-button trip-detail-action-button-primary" onClick={onOpenEditor}>
              编辑行程
            </button>
          ) : null}
          {data && onOpenTripStory ? (
            <button
              type="button"
              className="ghost-button trip-detail-action-button trip-detail-action-button-secondary"
              onClick={() => onOpenTripStory(tripId)}
            >
              查看故事页
            </button>
          ) : null}
          {data && onOpenMemoryCapsules ? (
            <button
              type="button"
              className="ghost-button trip-detail-action-button trip-detail-action-button-secondary"
              onClick={onOpenMemoryCapsules}
            >
              创建胶囊
            </button>
          ) : null}
          {data ? (
            <button type="button" className="ghost-button trip-detail-action-button trip-detail-action-button-danger" onClick={onOpenDeleteDialog}>
              删除行程
            </button>
          ) : null}
          <button type="button" className="ghost-button trip-detail-action-button trip-detail-action-button-subtle" onClick={() => void onLogout()}>
            退出登录
          </button>
        </div>
      </div>
      {data?.trip.note || displayCoverUrl ? (
        <aside className="trip-detail-note-card">
          {displayCoverUrl ? <img src={displayCoverUrl} alt={`${data?.trip.name ?? '当前行程'}封面`} className="trip-detail-note-cover" /> : null}
          {data?.trip.coverImageUrl ? <span className="trip-detail-note-eyebrow">Trip Cover</span> : null}
          {data?.trip.note ? <strong>{data.trip.note}</strong> : <span className="trip-detail-note-empty">当前行程暂未填写备注</span>}
        </aside>
      ) : null}
    </section>
  );
}
