import { useEffect, useMemo, useRef, useState } from 'react';
import { getGuideDocument } from '../lib/guides/guideContentService';
import {
  buildHighlightTokens,
  buildOriginalDocumentView,
} from '../lib/guides/guideDocumentView';
import { searchGuides } from '../lib/guides/guideSearchService';
import { findSavedGuideInCollection } from '../lib/repositories/guideRepository';
import { GuideSearchInputBar } from './GuideSearchInputBar';
import { GuideSearchResultList } from './GuideSearchResultList';
import { GuideDocumentDrawer } from './GuideDocumentDrawer';
import { useGuideSearchLayoutLock } from './useGuideSearchLayoutLock';
import type { GuideDocument, GuideSearchHistoryItem, GuideSearchResult, SavedGuide, Scope } from '../types';

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
  onSaveSearchHistory: (keyword: string, scope: Scope | 'all') => Promise<GuideSearchHistoryItem[]>;
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
  // Document drawer. 正文抽屉。
  const [selectedGuide, setSelectedGuide] = useState<GuideSearchResult | null>(null);
  const [guideDocument, setGuideDocument] = useState<GuideDocument | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentView, setDocumentView] = useState<'snippet' | 'original'>('snippet');
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

    try {
      const response = await searchGuides({
        keyword: trimmed,
        scope: nextScope,
        page: 1,
        pageSize: 8,
        searchMode: smartSearchEnabled ? 'smart' : 'keyword',
      });
      setItems(response.items);
      setProvider(response.provider);
      setHistory(await onSaveSearchHistory(trimmed, nextScope));
    } catch (searchError) {
      setItems([]);
      setProvider('');
      setError(searchError instanceof Error ? searchError.message : '攻略搜索失败');
    } finally {
      setLoading(false);
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
            getSavedGuideBySourceUrl={getSavedGuideBySourceUrl}
            onOpenGuide={(guide) => void handleOpenGuide(guide)}
            onSaveGuide={onSaveGuide}
            onAttachGuideToMarker={onAttachGuideToMarker}
            onRemoveSavedGuide={onRemoveSavedGuide}
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
        <div aria-hidden="true" style={{ height: panelSpacerHeight }} />
      </aside>
    </div>
  );
}

export default GuideSearchPanel;
