import { useEffect, useState } from 'react';
import TripChecklistBoard from '../../components/trips/TripChecklistBoard';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import {
  createTripChecklistItem,
  deleteTripChecklistItem,
  fetchTripChecklist,
  fetchTripDetail,
  updateTripChecklistItem,
} from '../../lib/api/tripsApi';
import type { CreateTripChecklistItemInput, TripDetailResponseDto, UpdateTripChecklistItemInput } from '../../lib/api/types';
import type { AuthAccount, TripChecklistGroup, TripChecklistSummary } from '../../types';

interface TripChecklistPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
}

const EMPTY_SUMMARY: TripChecklistSummary = {
  total: 0,
  preDepartureCount: 0,
  inTransitCount: 0,
  doneCount: 0,
};

const EMPTY_GROUPS: TripChecklistGroup[] = [];

export default function TripChecklistPage({
  account,
  tripId,
  onNavigateBack,
  onLogout,
}: TripChecklistPageProps) {
  const [detail, setDetail] = useState<TripDetailResponseDto | null>(null);
  const [summary, setSummary] = useState<TripChecklistSummary>(EMPTY_SUMMARY);
  const [groups, setGroups] = useState<TripChecklistGroup[]>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const syncChecklist = (nextSummary: TripChecklistSummary, nextGroups: TripChecklistGroup[]) => {
    setSummary(nextSummary);
    setGroups(nextGroups);
  };

  const reloadChecklist = async () => {
    const response = await fetchTripChecklist(tripId);
    syncChecklist(response.summary, response.groups);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTripDetail(tripId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setDetail(response);
        syncChecklist(response.checklistSummary, response.checklistGroups);
        setErrorMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setDetail(null);
        setErrorMessage(error instanceof Error ? error.message : '行前清单加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const wrapMutation = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      await reloadChecklist();
      setFeedbackMessage(successMessage);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '行前清单更新失败');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateItem = async (input: CreateTripChecklistItemInput) =>
    wrapMutation(async () => {
      await createTripChecklistItem(tripId, input);
    }, '已新增一条行前清单。');

  const handleUpdateItem = async (itemId: string, input: UpdateTripChecklistItemInput) =>
    wrapMutation(async () => {
      await updateTripChecklistItem(tripId, itemId, input);
    }, '已更新这条清单。');

  const handleDeleteItem = async (itemId: string) =>
    wrapMutation(async () => {
      await deleteTripChecklistItem(tripId, itemId);
    }, '已删除这条清单。');

  if (loading) {
    return <RoutePageSkeleton variant="checklist" />;
  }

  return (
    <main className="trip-detail-stage">
      <div className="trip-detail-shell">
        <section className="trip-detail-hero card">
          <div className="trip-detail-hero-copy">
            <span className="hero-kicker">行前清单</span>
            <h1>{detail?.trip.name ?? '正在载入行前清单...'}</h1>
            <p>
              {detail
                ? `${detail.trip.startsAt} - ${detail.trip.endsAt} · 当前账号 ${account.name}`
                : '把攻略提炼出来的准备事项和路上提醒集中管理。'}
            </p>
            <div className="trip-detail-hero-actions">
              <button type="button" className="ghost-button" onClick={onNavigateBack}>
                返回行程详情
              </button>
              <button type="button" className="ghost-button" onClick={() => void onLogout()}>
                退出登录
              </button>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="card trip-detail-state-card trip-detail-state-card-error">
            <strong>行前清单加载失败</strong>
            <p>{errorMessage}</p>
          </section>
        ) : null}

        <section className="card trip-detail-panel trip-detail-panel-fixed">
          <div className="trip-detail-panel-scroll">
            <TripChecklistBoard
              activeCompanionId={detail?.companions[0]?.id ?? account.id}
              summary={summary}
              groups={groups}
              loading={loading}
              busy={busy}
              feedbackMessage={feedbackMessage}
              emptyMessage="还没有行前清单，可以先从攻略搜索结果生成，也可以在这里手动补充。"
              onCreateItem={handleCreateItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
