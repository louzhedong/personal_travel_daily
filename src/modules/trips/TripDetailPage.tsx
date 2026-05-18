import { useEffect, useMemo, useState } from 'react';
import TripChecklistBoard from '../../components/trips/TripChecklistBoard';
import TripPlanningCalendarBoard from '../../components/trips/TripPlanningCalendarBoard';
import TripPlanningBoard from '../../components/trips/TripPlanningBoard';
import TravelIcon from '../../components/ui/TravelIcon';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RoutePageSkeleton from '../../components/ui/RoutePageSkeleton';
import TripDetailEditorDialog from './detail/TripDetailEditorDialog';
import TripDetailHeader from './detail/TripDetailHeader';
import TripExpensePanel from '../expenses/TripExpensePanel';
import {
  createTripChecklistItem,
  createTripPlanningItem,
  createTripPlanningItemFromWishlist,
  convertTripPlanningItemToMarker,
  deleteTrip,
  deleteTripChecklistItem,
  deleteTripPlanningItem,
  fetchTripChecklist,
  fetchTripDetail,
  fetchTripPlanning,
  fetchTripPlanningSchedule,
  importWishlistToTripPlanningSchedule,
  updateTrip,
  updateTripChecklistItem,
  updateTripPhotoCuration,
  updateTripPlanningItem,
  updateTripPlanningItemSchedule,
} from '../../lib/api/tripsApi';
import {
  createTripExpense,
  deleteTripExpense,
  fetchTripExpenses,
  updateTripExpense,
} from '../../lib/api/expensesApi';
import { fetchWishlistItems } from '../../lib/api/wishlistApi';
import {
  MARKER_BUDGET_LEVEL_LABELS,
  MARKER_TAG_LABELS,
  MARKER_TRANSPORT_LABELS,
  MARKER_WEATHER_LABELS,
} from '../../lib/markerMetadata';
import type {
  CreateTripChecklistItemInput,
  CreateTripPlanningItemInput,
  CreateTripExpenseInputDto,
  ConvertTripPlanningItemInput,
  TripDetailResponseDto,
  TripDetailPhotoItemDto,
  UpdateTripChecklistItemInput,
  UpdateTripExpenseInputDto,
  UpdateTripPhotoCurationInput,
  UpdateTripPlanningItemInput,
} from '../../lib/api/types';
import type { AuthAccount, TripPlanningItem, TripPlanningSchedule, TripPlanningSummary, WishlistItem } from '../../types';
import {
  buildTripCoverOptions,
  buildTripCoverStory,
  buildTripDetailSummaryCards,
  buildTripGuideMeta,
  buildTripPhotoAlt,
  formatTripDetailDateRange,
  formatTripMarkerRange,
  groupTripDetailPhotos,
  groupTripDetailMarkers,
  isTripDetailNotFoundError,
} from './tripDetailPageModel';

interface TripDetailPageProps {
  account: AuthAccount;
  tripId: string;
  onNavigateBack: () => void;
  onLogout: () => Promise<void> | void;
  onOpenTripChecklist?: (tripId: string) => void;
  onOpenTripStory?: (tripId: string) => void;
  onOpenMemoryCapsules?: () => void;
  onOpenCompanionMemories?: (companionId: string) => void;
  onOpenPhotoCuration?: (query: { tripId: string }) => void;
}

export default function TripDetailPage({
  account,
  tripId,
  onNavigateBack,
  onLogout,
  onOpenTripChecklist,
  onOpenTripStory,
  onOpenMemoryCapsules,
  onOpenCompanionMemories,
  onOpenPhotoCuration,
}: TripDetailPageProps) {
  const [data, setData] = useState<TripDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [tripEditorOpen, setTripEditorOpen] = useState(false);
  const [tripDraftName, setTripDraftName] = useState('');
  const [tripDraftStartsAt, setTripDraftStartsAt] = useState('');
  const [tripDraftEndsAt, setTripDraftEndsAt] = useState('');
  const [tripDraftNote, setTripDraftNote] = useState('');
  const [tripDraftCoverImageUrl, setTripDraftCoverImageUrl] = useState('');
  const [tripSaving, setTripSaving] = useState(false);
  const [tripDeleteOpen, setTripDeleteOpen] = useState(false);
  const [checklistBusy, setChecklistBusy] = useState(false);
  const [planningBusy, setPlanningBusy] = useState(false);
  const [expenseBusy, setExpenseBusy] = useState(false);
  const [photoCurationBusy, setPhotoCurationBusy] = useState(false);
  const [planningItems, setPlanningItems] = useState<TripPlanningItem[]>([]);
  const [planningSchedule, setPlanningSchedule] = useState<TripPlanningSchedule | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [planningSummary, setPlanningSummary] = useState<TripPlanningSummary>({
    total: 0,
    plannedCount: 0,
    convertedCount: 0,
    highPriorityCount: 0,
  });
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'planning' | 'expenses' | 'records' | 'assets'>('overview');
  const [planningViewMode, setPlanningViewMode] = useState<'list' | 'schedule'>('list');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchTripDetail(tripId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setData(response);
        setPlanningSummary(response.planningSummary ?? {
          total: 0,
          plannedCount: 0,
          convertedCount: 0,
          highPriorityCount: 0,
        });
        setErrorMessage('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setData(null);
        setErrorMessage(error instanceof Error ? error.message : '行程详情加载失败');
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

  useEffect(() => {
    let cancelled = false;

    if (activeDetailTab !== 'planning' || !data) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all([fetchTripPlanning(tripId), fetchTripPlanningSchedule(tripId), fetchWishlistItems()])
      .then(([response, scheduleResponse, wishlistResponse]) => {
        if (!cancelled) {
          setPlanningItems(response.items);
          setPlanningSummary(response.summary);
          setPlanningSchedule(scheduleResponse);
          setWishlistItems(wishlistResponse.items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedbackMessage(error instanceof Error ? error.message : '行前规划加载失败');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDetailTab, data, tripId]);

  const summaryCards = useMemo(() => (data ? buildTripDetailSummaryCards(data) : []), [data]);
  const markerGroups = useMemo(() => (data ? groupTripDetailMarkers(data.markers) : []), [data]);
  const photoGroups = useMemo(() => (data ? groupTripDetailPhotos(data.photos) : []), [data]);
  const coverOptions = useMemo(() => buildTripCoverOptions(data?.photos ?? []), [data]);
  const coverStory = useMemo(() => (data ? buildTripCoverStory(data) : null), [data]);
  const markerLabelById = useMemo(
    () =>
      new Map(
        (data?.markers ?? []).map((marker) => [marker.id, `${marker.scopeName} · ${marker.city}`]),
      ),
    [data],
  );
  const displayCoverUrl = data?.trip.coverImageUrl ?? data?.photos[0]?.imageUrl;

  const applyPhotoCuration = async (input: UpdateTripPhotoCurationInput, successMessage: string) => {
    setPhotoCurationBusy(true);
    try {
      const response = await updateTripPhotoCuration(tripId, input);
      setData(response);
      setFeedbackMessage(successMessage);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '照片精选更新失败');
    } finally {
      setPhotoCurationBusy(false);
    }
  };

  const handleToggleFeaturedPhoto = (photo: TripDetailPhotoItemDto) =>
    applyPhotoCuration(
      {
        items: [
          {
            imageId: photo.imageId,
            isFeatured: !photo.isFeatured,
          },
        ],
      },
      !photo.isFeatured ? '已标记为精选照片。' : '已取消精选照片。',
    );

  const handleUpdatePhotoCaption = (photo: TripDetailPhotoItemDto, caption: string) => {
    const nextCaption = caption.trim();
    if ((photo.caption ?? '') === nextCaption) {
      return;
    }

    void applyPhotoCuration(
      {
        items: [
          {
            imageId: photo.imageId,
            caption: nextCaption || null,
          },
        ],
      },
      nextCaption ? '已更新照片说明。' : '已清空照片说明。',
    );
  };

  const handleMovePhoto = (photo: TripDetailPhotoItemDto, direction: -1 | 1) => {
    if (!data) {
      return;
    }

    const currentIndex = data.photos.findIndex((item) => item.imageId === photo.imageId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.photos.length) {
      return;
    }

    const nextPhotos = [...data.photos];
    const [currentPhoto] = nextPhotos.splice(currentIndex, 1);
    nextPhotos.splice(nextIndex, 0, currentPhoto);

    void applyPhotoCuration(
      {
        items: nextPhotos.map((item, index) => ({
          imageId: item.imageId,
          curatedSortOrder: index,
        })),
      },
      '已更新照片展示顺序。',
    );
  };

  const reloadChecklist = async () => {
    const response = await fetchTripChecklist(tripId);
    setData((current) =>
      current
        ? {
            ...current,
            checklistSummary: response.summary,
            checklistGroups: response.groups,
          }
        : current,
    );
  };

  const reloadPlanning = async () => {
    const [response, scheduleResponse] = await Promise.all([
      fetchTripPlanning(tripId),
      fetchTripPlanningSchedule(tripId),
    ]);
    setPlanningItems(response.items);
    setPlanningSummary(response.summary);
    setPlanningSchedule(scheduleResponse);
    setData((current) =>
      current
        ? {
            ...current,
            planningSummary: response.summary,
          }
        : current,
    );
  };

  const reloadExpenses = async () => {
    const response = await fetchTripExpenses(tripId);
    setData((current) =>
      current
        ? {
            ...current,
            expenses: response,
          }
        : current,
    );
  };

  const wrapChecklistMutation = async (action: () => Promise<void>, successMessage: string) => {
    setChecklistBusy(true);
    try {
      await action();
      await reloadChecklist();
      setFeedbackMessage(successMessage);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '行前清单更新失败');
    } finally {
      setChecklistBusy(false);
    }
  };

  const handleCreateChecklistItem = async (input: CreateTripChecklistItemInput) =>
    wrapChecklistMutation(async () => {
      await createTripChecklistItem(tripId, input);
    }, '已新增一条行前清单。');

  const handleUpdateChecklistItem = async (itemId: string, input: UpdateTripChecklistItemInput) =>
    wrapChecklistMutation(async () => {
      await updateTripChecklistItem(tripId, itemId, input);
    }, '已更新这条清单。');

  const handleDeleteChecklistItem = async (itemId: string) =>
    wrapChecklistMutation(async () => {
      await deleteTripChecklistItem(tripId, itemId);
    }, '已删除这条清单。');

  const wrapPlanningMutation = async (action: () => Promise<void>, successMessage: string) => {
    setPlanningBusy(true);
    try {
      await action();
      await reloadPlanning();
      setFeedbackMessage(successMessage);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '行前规划更新失败');
    } finally {
      setPlanningBusy(false);
    }
  };

  const handleCreatePlanningItem = async (input: CreateTripPlanningItemInput) =>
    wrapPlanningMutation(async () => {
      await createTripPlanningItem(tripId, input);
    }, '已新增一条行前规划。');

  const handleUpdatePlanningItem = async (itemId: string, input: UpdateTripPlanningItemInput) =>
    wrapPlanningMutation(async () => {
      await updateTripPlanningItem(tripId, itemId, input);
    }, '已更新这条规划。');

  const handleDeletePlanningItem = async (itemId: string) =>
    wrapPlanningMutation(async () => {
      await deleteTripPlanningItem(tripId, itemId);
    }, '已删除这条规划。');

  const handleConvertPlanningItem = async (itemId: string, input: ConvertTripPlanningItemInput) =>
    wrapPlanningMutation(async () => {
      await convertTripPlanningItemToMarker(tripId, itemId, input);
    }, '已将规划项转为旅行记录。');

  const handleImportWishlistItem = async (wishlistId: string) =>
    wrapPlanningMutation(async () => {
      await createTripPlanningItemFromWishlist(tripId, wishlistId);
    }, '已从愿望地图加入行前规划。');

  const handleSchedulePlanningItem = async (itemId: string, plannedDate: string | null) =>
    wrapPlanningMutation(async () => {
      const scheduleResponse = await updateTripPlanningItemSchedule(tripId, itemId, { plannedDate });
      setPlanningSchedule(scheduleResponse);
    }, plannedDate ? '已把规划项安排到当天。' : '已把规划项移回未排期池。');

  const handleImportWishlistToSchedule = async (wishlistIds: string[], plannedDate: string) =>
    wrapPlanningMutation(async () => {
      const scheduleResponse = await importWishlistToTripPlanningSchedule(tripId, { wishlistIds, plannedDate });
      setPlanningSchedule(scheduleResponse);
    }, '已把愿望地点导入当天日程。');

  const wrapExpenseMutation = async (action: () => Promise<void>, successMessage: string) => {
    setExpenseBusy(true);
    try {
      await action();
      await reloadExpenses();
      setFeedbackMessage(successMessage);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '费用记录更新失败');
    } finally {
      setExpenseBusy(false);
    }
  };

  const handleCreateExpense = async (input: CreateTripExpenseInputDto) =>
    wrapExpenseMutation(async () => {
      await createTripExpense(input);
    }, '已记录一笔旅行费用。');

  const handleUpdateExpense = async (expenseId: string, input: UpdateTripExpenseInputDto) =>
    wrapExpenseMutation(async () => {
      await updateTripExpense(expenseId, input);
    }, '已更新这笔旅行费用。');

  const handleDeleteExpense = async (expenseId: string) =>
    wrapExpenseMutation(async () => {
      await deleteTripExpense(expenseId);
    }, '已删除这笔旅行费用。');

  const openTripEditor = () => {
    if (!data) {
      return;
    }

    setTripDraftName(data.trip.name);
    setTripDraftStartsAt(data.trip.startsAt);
    setTripDraftEndsAt(data.trip.endsAt);
    setTripDraftNote(data.trip.note);
    setTripDraftCoverImageUrl(data.trip.coverImageUrl ?? '');
    setFeedbackMessage('');
    setTripEditorOpen(true);
  };

  const handleSaveTrip = async () => {
    if (!data || !tripDraftName.trim() || !tripDraftStartsAt || !tripDraftEndsAt || tripDraftEndsAt < tripDraftStartsAt) {
      return;
    }

    setTripSaving(true);
    try {
      await updateTrip(tripId, {
        name: tripDraftName.trim(),
        startsAt: tripDraftStartsAt,
        endsAt: tripDraftEndsAt,
        note: tripDraftNote.trim(),
        coverImageUrl: tripDraftCoverImageUrl || null,
      });

      setData((current) =>
        current
          ? {
              ...current,
              trip: {
                ...current.trip,
                name: tripDraftName.trim(),
                startsAt: tripDraftStartsAt,
                endsAt: tripDraftEndsAt,
                note: tripDraftNote.trim(),
                coverImageUrl: tripDraftCoverImageUrl || undefined,
              },
            }
          : current,
      );
      setTripEditorOpen(false);
      setFeedbackMessage('已更新当前行程。');
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '更新行程失败');
    } finally {
      setTripSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    setTripSaving(true);
    try {
      await deleteTrip(tripId);
      setTripDeleteOpen(false);
      onNavigateBack();
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '删除行程失败');
      setTripSaving(false);
    }
  };

  if (loading) {
    return <RoutePageSkeleton variant="detail" />;
  }

  return (
    <main className="trip-detail-stage">
      <div className="trip-detail-shell">
        <TripDetailHeader
          account={account}
          data={data}
          displayCoverUrl={displayCoverUrl}
          tripId={tripId}
          onNavigateBack={onNavigateBack}
          onLogout={onLogout}
          onOpenEditor={openTripEditor}
          onOpenTripStory={onOpenTripStory}
          onOpenMemoryCapsules={onOpenMemoryCapsules}
          onOpenDeleteDialog={() => {
            setFeedbackMessage('');
            setTripDeleteOpen(true);
          }}
        />

        {feedbackMessage ? (
          <section className="card trip-detail-state-card">
            <strong>行程管理状态</strong>
            <p>{feedbackMessage}</p>
          </section>
        ) : null}

        {errorMessage ? (
          <section className="card trip-detail-state-card trip-detail-state-card-error">
            <strong>{isTripDetailNotFoundError(errorMessage) ? '行程不存在或无权访问' : '行程详情加载失败'}</strong>
            <p>{errorMessage}</p>
            <button type="button" className="ghost-button" onClick={onNavigateBack}>
              返回统计中心
            </button>
          </section>
        ) : null}

        <TripDetailEditorDialog
          open={tripEditorOpen}
          saving={tripSaving}
          name={tripDraftName}
          startsAt={tripDraftStartsAt}
          endsAt={tripDraftEndsAt}
          note={tripDraftNote}
          coverImageUrl={tripDraftCoverImageUrl}
          coverOptions={coverOptions}
          onClose={() => {
            if (!tripSaving) {
              setTripEditorOpen(false);
            }
          }}
          onSubmit={() => void handleSaveTrip()}
          onNameChange={setTripDraftName}
          onStartsAtChange={setTripDraftStartsAt}
          onEndsAtChange={setTripDraftEndsAt}
          onNoteChange={setTripDraftNote}
          onCoverImageUrlChange={setTripDraftCoverImageUrl}
        />

        <ConfirmDialog
          open={tripDeleteOpen}
          eyebrow="Trip Collection"
          title="确认删除这个行程？"
          description="删除后不会删除旅行记录，但这些记录会移回未归入行程。"
          cancelText="先保留"
          confirmText={tripSaving ? '删除中...' : '确认删除'}
          onCancel={() => {
            if (!tripSaving) {
              setTripDeleteOpen(false);
            }
          }}
          onConfirm={() => {
            if (!tripSaving) {
              void handleDeleteTrip();
            }
          }}
        />

        {data ? (
          <>
            <section className="trip-detail-summary-grid">
              {summaryCards.map((card) => (
                <article key={card.label} className="card trip-detail-summary-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <p>{card.description}</p>
                </article>
              ))}
            </section>

            <section className="trip-detail-tabs" aria-label="行程详情视图">
              {[
                { key: 'overview', label: '概览' },
                { key: 'planning', label: `行前规划 ${planningSummary.plannedCount}` },
                { key: 'expenses', label: `消费 ${data.expenses.summary.itemCount}` },
                { key: 'records', label: `记录 ${data.summary.markerCount}` },
                { key: 'assets', label: '素材' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeDetailTab === tab.key ? 'is-active' : ''}
                  onClick={() => setActiveDetailTab(tab.key as typeof activeDetailTab)}
                >
                  {tab.label}
                </button>
              ))}
            </section>

            {activeDetailTab === 'planning' ? (
              <section className="card trip-detail-panel">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>行前规划</h2>
                    <p>把想去地点、攻略来源和预计日期先收进这次行程，回来后再转成正式记录。</p>
                  </div>
                  <div className="trip-detail-view-switch" aria-label="行前规划视图">
                    <button
                      type="button"
                      className={planningViewMode === 'list' ? 'is-active' : ''}
                      onClick={() => setPlanningViewMode('list')}
                    >
                      清单视图
                    </button>
                    <button
                      type="button"
                      className={planningViewMode === 'schedule' ? 'is-active' : ''}
                      onClick={() => setPlanningViewMode('schedule')}
                    >
                      日程视图
                    </button>
                  </div>
                </div>
                {planningViewMode === 'list' ? (
                  <TripPlanningBoard
                    activeCompanionId={data.companions[0]?.id ?? account.id}
                    summary={planningSummary}
                    items={planningItems}
                    wishlistItems={wishlistItems}
                    busy={planningBusy}
                    feedbackMessage=""
                    onCreateItem={handleCreatePlanningItem}
                    onUpdateItem={handleUpdatePlanningItem}
                    onDeleteItem={handleDeletePlanningItem}
                    onConvertItem={handleConvertPlanningItem}
                    onImportWishlistItem={handleImportWishlistItem}
                  />
                ) : (
                  <TripPlanningCalendarBoard
                    schedule={planningSchedule}
                    wishlistItems={wishlistItems}
                    busy={planningBusy}
                    onScheduleItem={handleSchedulePlanningItem}
                    onImportWishlistItems={handleImportWishlistToSchedule}
                  />
                )}
              </section>
            ) : null}

            {activeDetailTab === 'expenses' ? (
              <section className="card trip-detail-panel">
                <TripExpensePanel
                  tripId={tripId}
                  expenses={data.expenses}
                  companions={data.companions}
                  busy={expenseBusy}
                  onCreateExpense={handleCreateExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              </section>
            ) : null}

            {activeDetailTab === 'overview' ? (
            <section className="trip-detail-two-column">
              <section className="card trip-detail-panel trip-detail-cover-story">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>封面故事</h2>
                    <p>用行程封面和精选照片生成这次旅行的回看入口。</p>
                  </div>
                  {onOpenTripStory ? (
                    <button type="button" className="ghost-button" onClick={() => onOpenTripStory(tripId)}>
                      打开故事页
                    </button>
                  ) : null}
                </div>
                <div className="trip-detail-cover-story-layout">
                  <div className="trip-detail-cover-story-media">
                    {coverStory?.coverImageUrl ? (
                      <img src={coverStory.coverImageUrl} alt={`${coverStory.title} 封面故事`} loading="lazy" />
                    ) : (
                      <div className="trip-detail-cover-story-empty">暂无封面照片</div>
                    )}
                  </div>
                  <div className="trip-detail-cover-story-copy">
                    <span className="hero-kicker">Cover Story</span>
                    <strong className="trip-detail-cover-story-title">{coverStory?.title}</strong>
                    <p>{coverStory?.description}</p>
                    {coverStory && coverStory.featuredPhotos.length > 0 ? (
                      <div className="trip-detail-cover-story-strip" aria-label="精选照片预览">
                        {coverStory.featuredPhotos.slice(0, 5).map((photo) => (
                          <figure key={photo.imageId}>
                            <img src={photo.imageUrl} alt={buildTripPhotoAlt(photo)} loading="lazy" />
                            <figcaption>{photo.caption || photo.city}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <div className="trip-detail-empty">在素材里标记精选照片后，这里会变成更完整的回忆开场。</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="card trip-detail-panel">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>旅伴参与</h2>
                    <p>按记录数查看本次行程中各旅伴的参与情况。</p>
                  </div>
                </div>
                <div className="trip-detail-companion-grid">
                  {data.companions.map((companion) => (
                    <article key={companion.id} className="trip-detail-companion-card">
                      <div className="trip-detail-companion-card-head">
                        <div className="trip-detail-companion-card-identity">
                          <span className="trip-detail-companion-dot" style={{ backgroundColor: companion.color }} />
                          <strong>{companion.name}</strong>
                        </div>
                        <span className="trip-detail-companion-card-badge">
                          {data.summary.markerCount > 0
                            ? `${Math.round((companion.markerCount / data.summary.markerCount) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="trip-detail-companion-card-metrics">
                        <strong>{companion.markerCount}</strong>
                        <span>条记录</span>
                      </div>
                      <p className="trip-detail-companion-card-note">
                        {data.summary.markerCount > 0
                          ? `占这次行程全部记录的 ${Math.round((companion.markerCount / data.summary.markerCount) * 100)}%`
                          : '当前行程里还没有旅行记录'}
                      </p>
                      <div className="trip-detail-companion-card-footer">
                        <span className="trip-detail-companion-card-footnote">参与情况</span>
                        <span className="trip-detail-companion-card-footvalue">
                          {companion.markerCount >= 2 ? '高频出现' : '轻量参与'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="trip-detail-companion-memory-link"
                        onClick={() => onOpenCompanionMemories?.(companion.id)}
                        disabled={!onOpenCompanionMemories}
                      >
                        查看共同回忆
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="card trip-detail-panel">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>行程概览</h2>
                    <p>快速把握这次旅行的时间范围、备注与生成时间。</p>
                  </div>
                </div>
                <div className="trip-detail-overview-list">
                  <div>
                    <span>日期范围</span>
                    <strong>{formatTripDetailDateRange(data.trip.startsAt, data.trip.endsAt)}</strong>
                  </div>
                  <div>
                    <span>行程备注</span>
                    <strong>{data.trip.note || '暂无行程备注'}</strong>
                  </div>
                  <div>
                    <span>当前封面</span>
                    <strong>{data.trip.coverImageUrl ? '已设置专属封面' : displayCoverUrl ? '使用照片作为展示回退' : '暂无封面'}</strong>
                  </div>
                  <div>
                    <span>统计生成于</span>
                    <strong>{data.meta.generatedAt.slice(0, 16).replace('T', ' ')}</strong>
                  </div>
                </div>
              </section>

              <section className="card trip-detail-panel trip-detail-panel-fixed">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>行前清单</h2>
                    <p>把这次旅程的准备事项、途中提醒和已完成事项收在一起。</p>
                  </div>
                </div>
                <div className="trip-detail-panel-scroll">
                  <TripChecklistBoard
                    activeCompanionId={data.companions[0]?.id ?? account.id}
                    summary={data.checklistSummary}
                    groups={data.checklistGroups}
                    busy={checklistBusy}
                    feedbackMessage=""
                    emptyMessage="还没有生成任何行前清单，可以从攻略搜索结果直接生成，或者先手动补充。"
                    onCreateItem={handleCreateChecklistItem}
                    onUpdateItem={handleUpdateChecklistItem}
                    onDeleteItem={handleDeleteChecklistItem}
                    onOpenExpanded={onOpenTripChecklist ? () => onOpenTripChecklist(tripId) : undefined}
                  />
                </div>
              </section>
            </section>
            ) : null}

            {activeDetailTab === 'overview' || activeDetailTab === 'records' ? (
            <section className="card trip-detail-panel trip-detail-panel-fixed">
              <div className="trip-detail-section-heading">
                <div>
                  <h2>行程记录</h2>
                  <p>按日期回看这次行程内的旅行记录、旅伴与图片分布。</p>
                </div>
              </div>
              {markerGroups.length === 0 ? (
                <div className="trip-detail-empty">当前行程暂无旅行记录。</div>
              ) : (
                <div className="trip-detail-marker-groups trip-detail-panel-scroll">
                  {markerGroups.map((group) => (
                    <section key={group.date} className="trip-detail-marker-group">
                      <header>
                        <strong>{group.date}</strong>
                      </header>
                      <div className="trip-detail-marker-list">
                        {group.items.map((marker) => (
                          <article key={marker.id} className="trip-detail-marker-card">
                            <div className="trip-detail-marker-head">
                              <div>
                                <strong>
                                  {marker.scopeName} · {marker.city}
                                </strong>
                                <p>{formatTripMarkerRange(marker)}</p>
                              </div>
                              <span
                                className="trip-detail-companion-inline"
                                style={{ backgroundColor: `${marker.companionColor}14`, color: marker.companionColor }}
                              >
                                {marker.companionName}
                              </span>
                            </div>
                            <p className="trip-detail-marker-note">{marker.note || '暂无备注'}</p>
                            <div className="trip-detail-marker-meta">
                              <span>{marker.scope === 'domestic' ? '国内行程' : '国际行程'}</span>
                              <span>{marker.imageUrls?.length ?? 0} 张图片</span>
                              {marker.tags?.length ? (
                                <span>{marker.tags.slice(0, 2).map((tag) => MARKER_TAG_LABELS[tag].zh).join(' · ')}</span>
                              ) : null}
                              {[
                                marker.weather ? MARKER_WEATHER_LABELS[marker.weather].zh : null,
                                marker.transport ? MARKER_TRANSPORT_LABELS[marker.transport].zh : null,
                                marker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[marker.budgetLevel].zh : null,
                              ]
                                .filter(Boolean)
                                .join(' · ') ? (
                                <span>
                                  {[
                                    marker.weather ? MARKER_WEATHER_LABELS[marker.weather].zh : null,
                                    marker.transport ? MARKER_TRANSPORT_LABELS[marker.transport].zh : null,
                                    marker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[marker.budgetLevel].zh : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
            ) : null}

            {activeDetailTab === 'overview' || activeDetailTab === 'assets' ? (
            <section className="trip-detail-photo-guide-grid">
              <section className="card trip-detail-panel trip-detail-panel-fixed">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>行程照片</h2>
                    <p>只展示当前行程内记录所关联的照片素材。</p>
                  </div>
                  {onOpenPhotoCuration && activeDetailTab === 'assets' ? (
                    <button type="button" className="ghost-button" onClick={() => onOpenPhotoCuration({ tripId })}>
                      打开影像编辑台
                    </button>
                  ) : null}
                </div>
                {data.photos.length === 0 ? (
                  <div className="trip-detail-empty">当前行程还没有照片。</div>
                ) : (
                  <div className="trip-detail-photo-groups trip-detail-panel-scroll">
                    {photoGroups.map((group) => (
                      <section key={group.date} className="trip-detail-photo-group">
                        <header>
                          <strong>{group.date}</strong>
                        </header>
                        <div className="trip-detail-photo-grid">
                          {group.items.map((photo) => (
                            <figure
                              key={photo.imageId}
                              className={`trip-detail-photo-card${photo.isFeatured ? ' is-featured' : ''}`}
                            >
                              <img src={photo.imageUrl} alt={buildTripPhotoAlt(photo)} loading="lazy" />
                              <figcaption>
                                <strong>
                                  {photo.markerTitle}
                                  {photo.isFeatured ? <span className="trip-detail-photo-featured-badge">精选</span> : null}
                                </strong>
                                <span>
                                  {photo.scopeName} · {photo.city}
                                </span>
                                {photo.caption ? <p>{photo.caption}</p> : null}
                              </figcaption>
                              <div className="trip-detail-photo-curation">
                                <button
                                  type="button"
                                  className="ghost-button trip-detail-photo-curation-button"
                                  disabled={photoCurationBusy}
                                  onClick={() => void handleToggleFeaturedPhoto(photo)}
                                >
                                  {photo.isFeatured ? '取消精选' : '设为精选'}
                                </button>
                                <div className="trip-detail-photo-order-actions">
                                  <button
                                    type="button"
                                    className="ghost-button trip-detail-photo-icon-button"
                                    aria-label={`上移照片 ${photo.markerTitle}`}
                                    disabled={photoCurationBusy || data.photos[0]?.imageId === photo.imageId}
                                    onClick={() => handleMovePhoto(photo, -1)}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-button trip-detail-photo-icon-button"
                                    aria-label={`下移照片 ${photo.markerTitle}`}
                                    disabled={photoCurationBusy || data.photos[data.photos.length - 1]?.imageId === photo.imageId}
                                    onClick={() => handleMovePhoto(photo, 1)}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="field-control trip-detail-photo-caption-input"
                                defaultValue={photo.caption ?? ''}
                                maxLength={140}
                                placeholder="添加照片说明"
                                aria-label={`照片说明 ${photo.markerTitle}`}
                                disabled={photoCurationBusy}
                                onBlur={(event) => handleUpdatePhotoCaption(photo, event.target.value)}
                              />
                            </figure>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>

              <section className="card trip-detail-panel trip-detail-panel-fixed">
                <div className="trip-detail-section-heading">
                  <div>
                    <h2>关联攻略</h2>
                    <p>汇总与这次行程记录相关的收藏攻略，便于复盘与后续再出发。</p>
                  </div>
                </div>
                {data.guides.length === 0 ? (
                  <div className="trip-detail-empty">当前行程还没有关联攻略。</div>
                ) : (
                  <div className="trip-detail-guide-list trip-detail-panel-scroll">
                    {data.guides.map((guide) => (
                      <article key={guide.id} className="trip-detail-guide-card">
                        <div className="trip-detail-guide-top">
                          <span className="travel-icon-badge travel-icon-badge-orange">
                            <TravelIcon name="spark" size={14} />
                          </span>
                          <div>
                            <strong>{guide.result.title}</strong>
                            <p>{buildTripGuideMeta(guide)}</p>
                          </div>
                        </div>
                        <p className="trip-detail-guide-summary">{guide.result.summary}</p>
                        <div className="trip-detail-guide-meta">
                          <span>关键词：{guide.keyword}</span>
                          {guide.markerId ? (
                            <span>关联地点：{markerLabelById.get(guide.markerId) ?? '已关联行程记录'}</span>
                          ) : null}
                        </div>
                        <div className="trip-detail-guide-actions">
                          {/^https?:\/\//.test(guide.result.sourceUrl) ? (
                            <a
                              href={guide.result.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="trip-detail-guide-link"
                            >
                              查看原文
                            </a>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
