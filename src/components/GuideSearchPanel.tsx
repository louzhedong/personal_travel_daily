import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AppToast, { type AppToastTone } from './ui/AppToast';
import { fetchGuideSourceHealth } from '../lib/api/guideSourceHealthApi';
import type { GuideSourceHealthDto } from '../lib/api/types';
import { getGuideDocument } from '../lib/guides/guideContentService';
import {
  buildHighlightTokens,
  buildOriginalDocumentView,
  renderHighlightedText,
} from '../lib/guides/guideDocumentView';
import { searchGuides } from '../lib/guides/guideSearchService';
import { findSavedGuideInCollection } from '../lib/repositories/guideRepository';
import { GuideSearchInputBar } from './GuideSearchInputBar';
import { GuideSearchResultList } from './GuideSearchResultList';
import { GuideDocumentDrawer } from './GuideDocumentDrawer';
import { useGuideSearchLayoutLock } from './useGuideSearchLayoutLock';
import { GuideChecklistGenerationDialog } from './guide-search/GuideChecklistGenerationDialog';
import { GuidePlanningDialog, type GuidePlanningDraft } from './guide-search/GuidePlanningDialog';
import { createTripPlanningItem } from '../lib/api/tripsApi';
import type {
  GuideDocument,
  GuideSearchHistoryItem,
  GuideSearchResult,
  SavedGuide,
  Scope,
  TripCollection,
} from '../types';

/**
 * Public props for GuideSearchPanel (container).
 * 攻略搜索面板（容器）的对外属性。
 */
interface GuideSearchPanelProps {
  open: boolean;
  initialQuery?: string;
  initialScope?: Scope | 'all';
  autoSearchOnOpen?: boolean;
  activeUserId: string;
  linkedMarkerId?: string | null;
  savedGuides: SavedGuide[];
  onClose: () => void;
  onSaveGuide: (guide: GuideSearchResult, keyword: string) => void;
  onAttachGuideToMarker: (guide: GuideSearchResult, keyword: string, markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
  searchHistory: GuideSearchHistoryItem[];
  onSaveSearchHistory: (
    keyword: string,
    scope: Scope | 'all',
    lastResultCount?: number,
  ) => Promise<GuideSearchHistoryItem[]>;
  trips?: TripCollection[];
  onGenerateTripChecklist?: (tripId: string, guide: GuideSearchResult) => Promise<{ createdCount: number } | void>;
  onAddToWishlist?: (draft: {
    title: string;
    scope: Scope;
    scopeId: string;
    scopeName: string;
    city: string;
    note?: string;
    priority?: 'low' | 'medium' | 'high';
    targetYear?: string | null;
  }, guide: GuideSearchResult) => Promise<unknown> | void;
  onOpenTripDetail?: (tripId: string) => void;
  onOpenTripChecklist?: (tripId: string) => void;
}

/**
 * Container component that orchestrates state, effects and layout for the guide search panel.
 * Delegates rendering to GuideSearchInputBar / GuideSearchResultList / GuideDocumentDrawer.
 * 容器组件：编排状态、副作用与布局，并把渲染交给三个子组件。
 */
export function GuideSearchPanel({
  open,
  initialQuery = '',
  initialScope = 'all',
  autoSearchOnOpen = false,
  activeUserId,
  linkedMarkerId = null,
  savedGuides,
  onClose,
  onSaveGuide,
  onAttachGuideToMarker,
  onRemoveSavedGuide,
  searchHistory,
  onSaveSearchHistory,
  trips = [],
  onGenerateTripChecklist = async () => undefined,
  onAddToWishlist = async () => undefined,
  onOpenTripDetail = () => {},
  onOpenTripChecklist = () => {},
}: GuideSearchPanelProps) {
  // Mount / visibility for enter-leave animation. 挂载与入场出场动画。
  const [shouldRender, setShouldRender] = useState(open);
  const [visible, setVisible] = useState(false);
  // Search form. 搜索表单。
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<Scope | 'all'>(initialScope);
  const [smartSearchEnabled, setSmartSearchEnabled] = useState(true);
  // Search results. 搜索结果。
  const [items, setItems] = useState<GuideSearchResult[]>([]);
  const [history, setHistory] = useState<GuideSearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: AppToastTone } | null>(null);
  const [sourceHealthItems, setSourceHealthItems] = useState<GuideSourceHealthDto[]>([]);
  // Document drawer. 正文抽屉。
  const [selectedGuide, setSelectedGuide] = useState<GuideSearchResult | null>(null);
  const [guideDocument, setGuideDocument] = useState<GuideDocument | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentView, setDocumentView] = useState<'snippet' | 'original'>('snippet');
  const [checklistGenerationOpen, setChecklistGenerationOpen] = useState(false);
  const [checklistGenerating, setChecklistGenerating] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [guidePendingChecklist, setGuidePendingChecklist] = useState<GuideSearchResult | null>(null);
  const [checklistGenerationFeedback, setChecklistGenerationFeedback] = useState('');
  const [planningDialogOpen, setPlanningDialogOpen] = useState(false);
  const [planningSaving, setPlanningSaving] = useState(false);
  const [guidePendingPlanning, setGuidePendingPlanning] = useState<GuideSearchResult | null>(null);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [planningDraft, setPlanningDraft] = useState<GuidePlanningDraft>({
    tripId: '',
    scope: initialScope === 'international' ? 'international' : 'domestic',
    scopeId: '',
    scopeName: '',
    city: '',
    plannedDate: '',
  });
  // Nested scroll layout lock. 嵌套滚动布局锁定。
  // Refs. DOM 节点与自动搜索去重引用。
  const autoSearchKeyRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resultsBodyRef = useRef<HTMLDivElement | null>(null);
  const documentBodyRef = useRef<HTMLDivElement | null>(null);
  const documentPanelRef = useRef<HTMLElement | null>(null);
  const originalContentRef = useRef<HTMLDivElement | null>(null);
  const { layoutLocked, panelSpacerHeight } = useGuideSearchLayoutLock(open, visible, {
    panelRef,
    layoutRef,
    resultsBodyRef,
    documentBodyRef,
    originalContentRef,
  });

  // Derived values. 派生值：关键词、高亮分词与原文视图。
  const normalizedKeyword = searchedKeyword || query.trim();
  const highlightTokens = useMemo(() => buildHighlightTokens(normalizedKeyword), [normalizedKeyword]);
  const searchSuggestions = useMemo(
    () =>
      query.trim().length < 2
        ? []
        : history
            .filter((item) => item.keyword.toLowerCase().includes(query.trim().toLowerCase()))
            .slice(0, 5),
    [history, query],
  );
  const sourceHealthByDomain = useMemo(
    () => new Map(sourceHealthItems.map((item) => [item.sourceDomain.toLowerCase(), item])),
    [sourceHealthItems],
  );
  const originalDocumentView = useMemo(
    () =>
      guideDocument?.contentHtml
        ? buildOriginalDocumentView(guideDocument.contentHtml, highlightTokens)
        : { html: '', sections: [] as Array<{ id: string; title: string }> },
    [guideDocument?.contentHtml, highlightTokens],
  );

  const canSearch = query.trim().length > 0 && !loading;
  const hasSearched = searchedKeyword.length > 0;
  const hasAiSummary =
    !!guideDocument?.aiSummary &&
    Object.values(guideDocument.aiSummary).some((summaryItems) => summaryItems.length > 0);

  const headingText = useMemo(
    () => (selectedGuide ? selectedGuide.destinationLabel || selectedGuide.title : '攻略搜索'),
    [selectedGuide],
  );
  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) ?? null,
    [selectedTripId, trips],
  );

  const showToast = (message: string, tone: AppToastTone = 'info') => {
    setToast({ message, tone });
  };

  const renderInlineHighlight = (text: string): ReactNode =>
    renderHighlightedText(text, highlightTokens);

  // Scroll the document drawer into view. 滚动定位正文抽屉。
  const scrollDocumentPanelIntoView = (behavior: ScrollBehavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      documentPanelRef.current?.scrollIntoView?.({ behavior, block: 'start', inline: 'nearest' });
    });
  };

  // Lookup helper for saved guide entries. 查询已收藏攻略记录。
  const getSavedGuideBySourceUrl = (sourceUrl: string, markerId?: string) =>
    findSavedGuideInCollection(savedGuides, { savedByUserId: activeUserId, sourceUrl, markerId });

  // Enter / leave animation. 入场与出场动画。
  useEffect(() => {
    let timeoutId: number | undefined;
    if (open) {
      setShouldRender(true);
      timeoutId = window.setTimeout(() => setVisible(true), 16);
    } else if (shouldRender) {
      setVisible(false);
      timeoutId = window.setTimeout(() => setShouldRender(false), 260);
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [open, shouldRender]);

  // Sync initial query / scope on open. 打开时同步初始关键词与范围。
  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
    setScope(initialScope);
  }, [initialQuery, initialScope, open]);

  // Lock body scroll and register ESC handler. 锁定 body 滚动并注册 ESC 关闭。
  useEffect(() => {
    if (!shouldRender) return;
    const originalOverflow = document.body.style.overflow;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onClose, shouldRender]);

  // Refresh history on open. 打开时更新最近搜索。
  useEffect(() => {
    if (open) setHistory(searchHistory);
  }, [open, searchHistory]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    fetchGuideSourceHealth(20)
      .then((response) => {
        if (!cancelled) {
          setSourceHealthItems(response.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSourceHealthItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  /** Execute a search and update state. 发起搜索并同步状态。 */
  const runSearch = async (nextQuery = query, nextScope = scope) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setSearchedKeyword(trimmed);
    setSelectedGuide(null);
    setGuideDocument(null);
    setDocumentError('');
    setDocumentView('snippet');
    setCurrentPage(1);
    setHasMore(false);

    try {
      const response = await searchGuides({
        keyword: trimmed,
        scope: nextScope,
        page: 1,
        pageSize: 8,
        companionId: activeUserId,
        searchMode: smartSearchEnabled ? 'smart' : 'keyword',
      });
      setItems(response.items);
      setProvider(response.provider);
      setCurrentPage(response.page);
      setHasMore(response.hasMore);
      setHistory(await onSaveSearchHistory(trimmed, nextScope, response.items.length));
      if (response.items.length === 0) {
        showToast(`已搜索“${trimmed}”，暂时还没找到相关攻略。`, 'info');
      }
    } catch (searchError) {
      setItems([]);
      setProvider('');
      setError(searchError instanceof Error ? searchError.message : '攻略搜索失败');
      showToast(searchError instanceof Error ? searchError.message : '攻略搜索失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore || !searchedKeyword) {
      if (!hasMore && searchedKeyword) {
        showToast('已经到底了，没有更多攻略了。', 'info');
      }
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await searchGuides({
        keyword: searchedKeyword,
        scope,
        page: nextPage,
        pageSize: 8,
        companionId: activeUserId,
        searchMode: smartSearchEnabled ? 'smart' : 'keyword',
      });
      setItems((current) => [...current, ...response.items]);
      setProvider(response.provider);
      setCurrentPage(response.page);
      setHasMore(response.hasMore);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : '加载更多攻略失败');
      showToast(searchError instanceof Error ? searchError.message : '加载更多攻略失败', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  // Auto-run search once per (mode, scope, keyword). 按 (模式, 范围, 关键词) 去重自动搜索。
  useEffect(() => {
    if (!open) {
      autoSearchKeyRef.current = null;
      return;
    }
    if (!autoSearchOnOpen) return;
    const trimmedQuery = initialQuery.trim();
    if (!trimmedQuery) return;

    const autoSearchKey = `${smartSearchEnabled ? 'smart' : 'keyword'}:${initialScope}:${trimmedQuery.toLowerCase()}`;
    if (autoSearchKeyRef.current === autoSearchKey) return;
    autoSearchKeyRef.current = autoSearchKey;
    void runSearch(initialQuery, initialScope);
  }, [autoSearchOnOpen, initialQuery, initialScope, onSaveSearchHistory, open, smartSearchEnabled]);

  // Sync layout-lock state with scroll position is handled by useGuideSearchLayoutLock.
  // 布局锁定同步已由 useGuideSearchLayoutLock hook 负责。

  /** Load a guide document and transition into drawer. 加载攻略正文并切换到抽屉。 */
  const handleOpenGuide = async (guide: GuideSearchResult) => {
    setSelectedGuide(guide);
    setGuideDocument(null);
    setDocumentLoading(true);
    setDocumentError('');
    setDocumentView('snippet');
    scrollDocumentPanelIntoView();

    try {
      const nextDocument = await getGuideDocument(guide.sourceUrl);
      setGuideDocument(nextDocument);
      if (!nextDocument) {
        setDocumentError('当前只有摘要，暂时还没有可展示的正文片段。');
      } else if (!nextDocument.blocks.length && nextDocument.contentHtml) {
        setDocumentView('original');
      }
    } catch (loadError) {
      setDocumentError(loadError instanceof Error ? loadError.message : '攻略正文加载失败');
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleOpenChecklistGeneration = (guide: GuideSearchResult) => {
    if (trips.length === 0) {
      setChecklistGenerationFeedback('请先创建至少一个行程，再把攻略提炼成行前清单。');
      return;
    }

    setGuidePendingChecklist(guide);
    setSelectedTripId((current) => current || trips[0]?.id || '');
    setChecklistGenerationFeedback('');
    setChecklistGenerationOpen(true);
  };

  const handleOpenPlanningDialog = (guide: GuideSearchResult) => {
    if (trips.length === 0) {
      setChecklistGenerationFeedback('请先创建至少一个行程，再把攻略加入行程规划。');
      return;
    }

    const destination = guide.destinationLabel || query.trim();
    setGuidePendingPlanning(guide);
    setPlanningDraft({
      tripId: selectedTripId || trips[0]?.id || '',
      scope: scope === 'international' ? 'international' : 'domestic',
      scopeId: destination.toLowerCase().replace(/\s+/g, '-').slice(0, 40) || 'planning',
      scopeName: destination || '待确认地区',
      city: destination || '',
      plannedDate: '',
    });
    setChecklistGenerationFeedback('');
    setPlanningDialogOpen(true);
  };

  const handleAddGuideToWishlist = async (guide: GuideSearchResult) => {
    const destination = guide.destinationLabel || query.trim() || guide.title;
    setWishlistSaving(true);
    try {
      await onAddToWishlist(
        {
          title: destination,
          scope: scope === 'international' ? 'international' : 'domestic',
          scopeId: destination.toLowerCase().replace(/\s+/g, '-').slice(0, 40) || 'wishlist',
          scopeName: destination,
          city: destination,
          note: guide.summary,
          priority: 'medium',
          targetYear: null,
        },
        guide,
      );
      setChecklistGenerationFeedback(`已将《${guide.title}》加入愿望地图。`);
      showToast(`已将《${guide.title}》加入愿望地图。`, 'success');
    } catch (error) {
      setChecklistGenerationFeedback(error instanceof Error ? error.message : '加入愿望地图失败');
      showToast(error instanceof Error ? error.message : '加入愿望地图失败', 'error');
    } finally {
      setWishlistSaving(false);
    }
  };

  const handleConfirmPlanning = async () => {
    if (!guidePendingPlanning || !planningDraft.tripId) {
      return;
    }

    setPlanningSaving(true);
    try {
      await createTripPlanningItem(planningDraft.tripId, {
        companionId: activeUserId,
        title: guidePendingPlanning.destinationLabel || guidePendingPlanning.title,
        scope: planningDraft.scope as Scope,
        scopeId: planningDraft.scopeId,
        scopeName: planningDraft.scopeName,
        city: planningDraft.city,
        note: guidePendingPlanning.summary,
        priority: 'medium',
        plannedDate: planningDraft.plannedDate || null,
        guide: {
          identity: guidePendingPlanning.sourceUrl,
          title: guidePendingPlanning.title,
          sourceName: guidePendingPlanning.sourceName,
          sourceUrl: guidePendingPlanning.sourceUrl,
        },
      });
      setSelectedTripId(planningDraft.tripId);
      setChecklistGenerationFeedback(`已将《${guidePendingPlanning.title}》加入行程规划。`);
      showToast(`已将《${guidePendingPlanning.title}》加入行程规划。`, 'success');
      setPlanningDialogOpen(false);
    } catch (error) {
      setChecklistGenerationFeedback(error instanceof Error ? error.message : '加入行程规划失败');
      showToast(error instanceof Error ? error.message : '加入行程规划失败', 'error');
    } finally {
      setPlanningSaving(false);
    }
  };

  const handleConfirmChecklistGeneration = async () => {
    if (!guidePendingChecklist || !selectedTripId) {
      return;
    }

    setChecklistGenerating(true);
    try {
      const result = await onGenerateTripChecklist(selectedTripId, guidePendingChecklist);
      setChecklistGenerationFeedback(
        `已为《${guidePendingChecklist.title}》在行程《${selectedTrip?.name ?? '当前行程'}》中生成 ${result?.createdCount ?? 0} 条行前清单。`,
      );
      showToast('行前清单已生成。', 'success');
      setChecklistGenerationOpen(false);
    } catch (error) {
      setChecklistGenerationFeedback(error instanceof Error ? error.message : '生成行前清单失败');
      showToast(error instanceof Error ? error.message : '生成行前清单失败', 'error');
    } finally {
      setChecklistGenerating(false);
    }
  };

  // Reset original content scroll when switching to original view.
  // 切换到原文视图时将原文容器滚回顶部。
  useEffect(() => {
    if (documentView !== 'original') return;
    scrollDocumentPanelIntoView();
    originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
  }, [documentView]);

  /** Jump to a specific outline section. 跳转到原文目录章节。 */
  const handleJumpToSection = (sectionId: string) => {
    setDocumentView('original');
    window.requestAnimationFrame(() => {
      const section = originalContentRef.current?.querySelector<HTMLElement>(`#${sectionId}`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (!shouldRender) return null;

  return (
    <div
      className={visible ? 'guide-search-backdrop is-visible' : 'guide-search-backdrop'}
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        className={visible ? 'guide-search-panel is-visible' : 'guide-search-panel'}
        aria-label="攻略搜索"
        onClick={(event) => event.stopPropagation()}
      >
        <GuideSearchInputBar
          visible={visible}
          query={query}
          scope={scope}
          smartSearchEnabled={smartSearchEnabled}
          loading={loading}
          canSearch={canSearch}
          history={history}
          suggestions={searchSuggestions}
          onQueryChange={setQuery}
          onScopeChange={setScope}
          onSmartSearchChange={setSmartSearchEnabled}
          onSubmit={(nextQuery, nextScope) => void runSearch(nextQuery, nextScope)}
          onClose={onClose}
        />

        <div
          ref={layoutRef}
          className={visible ? 'guide-search-layout guide-search-animate in delay-2' : 'guide-search-layout guide-search-animate delay-2'}
        >
          <GuideSearchResultList
            ref={resultsBodyRef}
            layoutLocked={layoutLocked}
            items={items}
            provider={provider}
            loading={loading}
            error={error}
            hasSearched={hasSearched}
            searchedKeyword={searchedKeyword}
            linkedMarkerId={linkedMarkerId}
            normalizedKeyword={normalizedKeyword}
            renderHighlightedText={renderInlineHighlight}
            sourceHealthByDomain={sourceHealthByDomain}
            getSavedGuideBySourceUrl={getSavedGuideBySourceUrl}
            onOpenGuide={(guide) => void handleOpenGuide(guide)}
            onSaveGuide={(guide, keyword) => {
              const isSimilarDuplicate = savedGuides.some((savedGuide) => {
                const sameSource = savedGuide.result.sourceUrl.toLowerCase() === guide.sourceUrl.toLowerCase();
                const sameTitle = savedGuide.result.title.trim().toLowerCase() === guide.title.trim().toLowerCase();
                return sameSource || sameTitle;
              });
              if (isSimilarDuplicate) {
                showToast('已存在相似收藏，建议先检查是否重复。', 'info');
              }
              onSaveGuide(guide, keyword);
            }}
            onAttachGuideToMarker={onAttachGuideToMarker}
            onRemoveSavedGuide={onRemoveSavedGuide}
            onGenerateTripChecklist={handleOpenChecklistGeneration}
            onAddToTripPlanning={handleOpenPlanningDialog}
            onAddToWishlist={(guide) => {
              if (!wishlistSaving) {
                void handleAddGuideToWishlist(guide);
              }
            }}
            canGenerateTripChecklist={trips.length > 0}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={() => void handleLoadMore()}
          />

          <GuideDocumentDrawer
            layoutLocked={layoutLocked}
            headingText={headingText}
            selectedGuide={selectedGuide}
            guideDocument={guideDocument}
            documentLoading={documentLoading}
            documentError={documentError}
            documentView={documentView}
            highlightTokens={highlightTokens}
            originalDocumentView={originalDocumentView}
            hasAiSummary={hasAiSummary}
            documentPanelRef={documentPanelRef}
            documentBodyRef={documentBodyRef}
            originalContentRef={originalContentRef}
            onDocumentViewChange={setDocumentView}
            onJumpToSection={handleJumpToSection}
          />
        </div>
        {checklistGenerationFeedback ? (
          <div className="guide-search-generation-feedback">
            <span>{checklistGenerationFeedback}</span>
            {selectedTripId ? (
              <div className="guide-search-generation-feedback-actions">
                <button type="button" className="ghost-button" onClick={() => onOpenTripDetail(selectedTripId)}>
                  查看行程详情
                </button>
                <button type="button" className="ghost-button" onClick={() => onOpenTripChecklist(selectedTripId)}>
                  打开行前清单
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div aria-hidden="true" style={{ height: panelSpacerHeight }} />
        <AppToast open={!!toast} message={toast?.message ?? ''} tone={toast?.tone} />
      </aside>
      <GuideChecklistGenerationDialog
        open={checklistGenerationOpen}
        selectedTripId={selectedTripId}
        trips={trips}
        checklistGenerating={checklistGenerating}
        onClose={() => setChecklistGenerationOpen(false)}
        onSelectedTripIdChange={setSelectedTripId}
        onConfirm={() => void handleConfirmChecklistGeneration()}
      />
      <GuidePlanningDialog
        open={planningDialogOpen}
        planningSaving={planningSaving}
        planningDraft={planningDraft}
        trips={trips}
        onClose={() => setPlanningDialogOpen(false)}
        onPlanningDraftChange={setPlanningDraft}
        onConfirm={() => void handleConfirmPlanning()}
      />
    </div>
  );
}

export default GuideSearchPanel;
