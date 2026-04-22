import { useEffect, useMemo, useRef, useState } from 'react';
import { getGuideDocument } from '../lib/guides/guideContentService';
import { searchGuides } from '../lib/guides/guideSearchService';
import { findSavedGuideInCollection } from '../lib/repositories/guideRepository';
import TravelIcon from './TravelIcon';
import type { GuideDocument, GuideSearchHistoryItem, GuideSearchResult, SavedGuide, Scope } from '../types';

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

function canOpenOriginalSource(sourceUrl: string) {
  return /^https?:\/\//.test(sourceUrl) && !sourceUrl.includes('guide-api.local');
}

function getSourceLinkLabel(item: GuideSearchResult) {
  return item.sourceName.includes('POI') ? '查看来源' : '查看原文';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildHighlightTokens(keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }

  const tokens = [trimmed, ...trimmed.split(/\s+/)]
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  return Array.from(new Set(tokens)).sort((left, right) => right.length - left.length);
}

function renderHighlightedText(text: string, tokens: string[]) {
  if (!tokens.length || !text) {
    return text;
  }

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(matcher);

  return parts.map((part, index) =>
    tokens.some((token) => token.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="guide-highlight">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function buildOriginalDocumentView(contentHtml: string, tokens: string[]) {
  if (!contentHtml) {
    return { html: '', sections: [] as Array<{ id: string; title: string }> };
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${contentHtml}</div>`, 'text/html');
  const root = document.body.firstElementChild as HTMLDivElement | null;
  if (!root) {
    return { html: contentHtml, sections: [] as Array<{ id: string; title: string }> };
  }

  const sections: Array<{ id: string; title: string }> = [];
  root.querySelectorAll('h3').forEach((heading, index) => {
    const title = heading.textContent?.trim();
    if (!title) {
      return;
    }
    const id = `guide-section-${index + 1}`;
    heading.setAttribute('id', id);
    sections.push({ id, title });
  });

  if (tokens.length) {
    const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if (!current.textContent?.trim()) {
        continue;
      }
      const parentTag = current.parentElement?.tagName.toLowerCase();
      if (parentTag === 'script' || parentTag === 'style' || parentTag === 'mark') {
        continue;
      }
      textNodes.push(current);
    }

    textNodes.forEach((node) => {
      const text = node.textContent ?? '';
      if (!matcher.test(text)) {
        matcher.lastIndex = 0;
        return;
      }
      matcher.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      for (const match of text.matchAll(matcher)) {
        const matched = match[0];
        const offset = match.index ?? 0;
        if (offset > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }
        const mark = document.createElement('mark');
        mark.className = 'guide-highlight';
        mark.textContent = matched;
        fragment.appendChild(mark);
        lastIndex = offset + matched.length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode?.replaceChild(fragment, node);
    });
  }

  return { html: root.innerHTML, sections };
}

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
  const [shouldRender, setShouldRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<Scope | 'all'>(initialScope);
  const [items, setItems] = useState<GuideSearchResult[]>([]);
  const [history, setHistory] = useState<GuideSearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<GuideSearchResult | null>(null);
  const [guideDocument, setGuideDocument] = useState<GuideDocument | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentView, setDocumentView] = useState<'snippet' | 'original'>('snippet');
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [panelSpacerHeight, setPanelSpacerHeight] = useState(0);
  const autoSearchKeyRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resultsBodyRef = useRef<HTMLDivElement | null>(null);
  const documentBodyRef = useRef<HTMLDivElement | null>(null);
  const documentPanelRef = useRef<HTMLElement | null>(null);
  const originalContentRef = useRef<HTMLDivElement | null>(null);
  const lockedStateRef = useRef(false);
  const normalizedKeyword = searchedKeyword || query.trim();
  const highlightTokens = useMemo(() => buildHighlightTokens(normalizedKeyword), [normalizedKeyword]);
  const originalDocumentView = useMemo(
    () =>
      guideDocument?.contentHtml
        ? buildOriginalDocumentView(guideDocument.contentHtml, highlightTokens)
        : { html: '', sections: [] as Array<{ id: string; title: string }> },
    [guideDocument?.contentHtml, highlightTokens],
  );

  const scrollDocumentPanelIntoView = (behavior: ScrollBehavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      documentPanelRef.current?.scrollIntoView?.({
        behavior,
        block: 'start',
        inline: 'nearest',
      });
    });
  };

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
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [open, shouldRender]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery(initialQuery);
    setScope(initialScope);
  }, [initialQuery, initialScope, open]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onClose, shouldRender]);

  useEffect(() => {
    if (open) {
      setHistory(searchHistory);
    }
  }, [open, searchHistory]);

  const canSearch = query.trim().length > 0 && !loading;
  const hasResult = items.length > 0;
  const hasSearched = searchedKeyword.length > 0;

  const headingText = useMemo(() => {
    if (selectedGuide) {
      return selectedGuide.destinationLabel || selectedGuide.title;
    }

    return '攻略搜索';
  }, [selectedGuide]);

  const getSavedGuideBySourceUrl = (sourceUrl: string, markerId?: string) =>
    findSavedGuideInCollection(savedGuides, {
      savedByUserId: activeUserId,
      sourceUrl,
      markerId,
    });

  const runSearch = async (nextQuery = query, nextScope = scope) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      return;
    }

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

  useEffect(() => {
    if (!open) {
      autoSearchKeyRef.current = null;
      return;
    }

    if (!autoSearchOnOpen) {
      return;
    }

    const trimmedQuery = initialQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    const autoSearchKey = `${initialScope}:${trimmedQuery.toLowerCase()}`;
    if (autoSearchKeyRef.current === autoSearchKey) {
      return;
    }

    autoSearchKeyRef.current = autoSearchKey;
    void runSearch(initialQuery, initialScope);
  }, [autoSearchOnOpen, initialQuery, initialScope, onSaveSearchHistory, open]);

  useEffect(() => {
    if (!open) {
      setLayoutLocked(false);
      return;
    }

    const syncLockState = () => {
      const panelElement = panelRef.current;
      const layoutElement = layoutRef.current;
      if (!panelElement || !layoutElement) {
        return;
      }

      const targetThreshold = Math.max(layoutElement.offsetTop - 8, 0);
      const rawMaxScrollableTop = Math.max(
        panelElement.scrollHeight - panelElement.clientHeight - panelSpacerHeight,
        0,
      );
      const nextSpacerHeight = Math.max(targetThreshold - rawMaxScrollableTop, 0);
      if (Math.abs(nextSpacerHeight - panelSpacerHeight) > 1) {
        setPanelSpacerHeight(nextSpacerHeight);
      }
      const maxScrollableTop = rawMaxScrollableTop + nextSpacerHeight;
      const lockThreshold = targetThreshold;
      const lockEnterThreshold = Math.max(lockThreshold - 8, 0);
      const lockLeaveThreshold = Math.max(lockThreshold - 24, 0);
      const nextLocked = lockedStateRef.current
        ? panelElement.scrollTop > lockLeaveThreshold
        : panelElement.scrollTop >= lockEnterThreshold;
      if (lockedStateRef.current && !nextLocked) {
        resultsBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        documentBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
        // #region debug-point I:unlock-reset
        fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"scroll-stage-handoff",runId:"post-fix",hypothesisId:"I",location:"GuideSearchPanel.tsx:366",msg:"[DEBUG] reset inner scroll on unlock",data:{panelScrollTop:panelElement.scrollTop},ts:Date.now()})}).catch(()=>{});
        // #endregion
      }
      // #region debug-point A:lock-state
      fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"scroll-stage-handoff",runId:"post-fix",hypothesisId:"A",location:"GuideSearchPanel.tsx:361",msg:"[DEBUG] sync lock state",data:{scrollTop:panelElement.scrollTop,targetThreshold,rawMaxScrollableTop,nextSpacerHeight,maxScrollableTop,lockThreshold,lockEnterThreshold,lockLeaveThreshold,nextLocked},ts:Date.now()})}).catch(()=>{});
      // #endregion
      lockedStateRef.current = nextLocked;
      setLayoutLocked(nextLocked);
    };

    syncLockState();
    const panelElement = panelRef.current;
    panelElement?.addEventListener('scroll', syncLockState, { passive: true });
    window.addEventListener('resize', syncLockState);

    return () => {
      panelElement?.removeEventListener('scroll', syncLockState);
      window.removeEventListener('resize', syncLockState);
    };
  }, [open, visible, panelSpacerHeight]);

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

  useEffect(() => {
    if (documentView !== 'original') {
      return;
    }

    scrollDocumentPanelIntoView();
    originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
  }, [documentView]);

  const handleJumpToSection = (sectionId: string) => {
    setDocumentView('original');
    window.requestAnimationFrame(() => {
      const section = originalContentRef.current?.querySelector<HTMLElement>(`#${sectionId}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  if (!shouldRender) {
    return null;
  }

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
        <div className={visible ? 'guide-search-header guide-search-animate in' : 'guide-search-header guide-search-animate'}>
          <div className="guide-search-heading">
            <span className="travel-icon-badge travel-icon-badge-teal guide-search-heading-icon">
              <TravelIcon name="globe" size={16} />
            </span>
            <div>
              <span className="hero-tip-eyebrow">Guide Search</span>
              <h3 className="guide-search-title">搜索旅游攻略</h3>
              <p className="guide-search-subtitle">接入远程攻略数据，展示结构化摘要和正文片段。</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-button"
            aria-label="关闭攻略搜索"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={visible ? 'guide-search-toolbar guide-search-animate in delay-1' : 'guide-search-toolbar guide-search-animate delay-1'}>
          <div className="guide-search-input-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSearch) {
                  event.preventDefault();
                  void runSearch();
                }
              }}
              className="field-control guide-search-input"
              placeholder="输入目的地、季节或玩法，例如：舟山 海岛 攻略"
            />
            <button
              type="button"
              className="primary-button guide-search-submit"
              disabled={!canSearch}
              onClick={() => void runSearch()}
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>

          <div className="guide-search-filters">
            <button
              type="button"
              className={scope === 'all' ? 'guide-filter-chip active' : 'guide-filter-chip'}
              onClick={() => setScope('all')}
            >
              全部
            </button>
            <button
              type="button"
              className={scope === 'domestic' ? 'guide-filter-chip active' : 'guide-filter-chip'}
              onClick={() => setScope('domestic')}
            >
              国内
            </button>
            <button
              type="button"
              className={scope === 'international' ? 'guide-filter-chip active' : 'guide-filter-chip'}
              onClick={() => setScope('international')}
            >
              国际
            </button>
          </div>

          {history.length > 0 ? (
            <div className="guide-search-history">
              <span className="guide-search-history-label">最近搜索</span>
              <div className="guide-search-history-list">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="guide-history-chip"
                    onClick={() => {
                      setQuery(item.keyword);
                      setScope(item.scope);
                      void runSearch(item.keyword, item.scope);
                    }}
                  >
                    {item.keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          ref={layoutRef}
          className={visible ? 'guide-search-layout guide-search-animate in delay-2' : 'guide-search-layout guide-search-animate delay-2'}
        >
          <section className={layoutLocked ? 'guide-search-results is-locked' : 'guide-search-results'}>
            <div className="guide-section-heading">
              <strong>搜索结果</strong>
              <span>{provider ? `来源: ${provider}` : '等待搜索'}</span>
            </div>
            <div
              ref={resultsBodyRef}
              className={layoutLocked ? 'guide-search-results-body is-scrollable' : 'guide-search-results-body'}
              onScroll={(event) => {
                const currentTarget = event.currentTarget;
                // #region debug-point G:results-body-scroll
                fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"scroll-stage-handoff",runId:"post-fix",hypothesisId:"G",location:"GuideSearchPanel.tsx:600",msg:"[DEBUG] results body scroll",data:{scrollTop:currentTarget.scrollTop,scrollHeight:currentTarget.scrollHeight,clientHeight:currentTarget.clientHeight},ts:Date.now()})}).catch(()=>{});
                // #endregion
              }}
            >
              {error ? <div className="empty-state">{error}</div> : null}
              {!error && loading ? <div className="empty-state">正在抓取和整理攻略数据...</div> : null}
              {!error && !loading && !hasSearched ? (
                <div className="empty-state">输入关键词后开始搜索，这里会展示攻略摘要和可查看的正文片段。</div>
              ) : null}

              {!error && !loading && hasSearched && !hasResult ? (
                <div className="empty-state">
                  <strong>{`已搜索“${searchedKeyword}”，但还没找到相关攻略。`}</strong>
                  <div>可以试试更完整的地名，或补上“旅游”“景点”“自由行”等关键词。</div>
                </div>
              ) : null}

              {hasResult ? (
                <div className="guide-result-list">
                  {items.map((item) => (
                    <article key={item.id} className="guide-result-card">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt={item.title} className="guide-result-cover" />
                      ) : (
                        <div className="guide-result-cover guide-result-cover-placeholder">攻略</div>
                      )}
                      <div className="guide-result-body">
                        <div className="guide-result-meta">
                          <span className="marker-scope-tag guide-result-source">{item.sourceName}</span>
                          {item.publishedAt ? <span className="guide-result-date">{item.publishedAt}</span> : null}
                        </div>
                        <h4 className="guide-result-title">{item.title}</h4>
                        <p className="guide-result-summary">{item.summary}</p>
                        {item.tags?.length ? (
                          <div className="guide-result-tags">
                            {item.tags.map((tag) => (
                              <span key={tag} className="guide-result-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="guide-result-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => void handleOpenGuide(item)}
                          >
                            查看片段
                          </button>
                          {getSavedGuideBySourceUrl(item.sourceUrl) ? (
                            <button
                              type="button"
                              className="ghost-button guide-action-button"
                              onClick={() => {
                                const existingGuide = getSavedGuideBySourceUrl(item.sourceUrl);
                                if (existingGuide) {
                                  onRemoveSavedGuide(existingGuide.id);
                                }
                              }}
                            >
                              取消收藏
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ghost-button guide-action-button"
                              onClick={() => onSaveGuide(item, normalizedKeyword)}
                            >
                              收藏攻略
                            </button>
                          )}
                          {linkedMarkerId ? (
                            getSavedGuideBySourceUrl(item.sourceUrl, linkedMarkerId) ? (
                              <button
                                type="button"
                                className="ghost-button guide-action-button"
                                onClick={() => {
                                  const existingGuide = getSavedGuideBySourceUrl(item.sourceUrl, linkedMarkerId);
                                  if (existingGuide) {
                                    onRemoveSavedGuide(existingGuide.id);
                                  }
                                }}
                              >
                                解除关联
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ghost-button guide-action-button"
                                onClick={() => onAttachGuideToMarker(item, normalizedKeyword, linkedMarkerId)}
                              >
                                关联到当前记录
                              </button>
                            )
                          ) : null}
                          {canOpenOriginalSource(item.sourceUrl) ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="guide-result-link"
                            >
                              {getSourceLinkLabel(item)}
                            </a>
                          ) : null}
                        </div>
                        <div className="guide-result-status-row">
                          {getSavedGuideBySourceUrl(item.sourceUrl) ? (
                            <span className="guide-result-status">已收藏</span>
                          ) : null}
                          {linkedMarkerId && getSavedGuideBySourceUrl(item.sourceUrl, linkedMarkerId) ? (
                            <span className="guide-result-status">已关联当前记录</span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <aside
            ref={documentPanelRef}
            className={layoutLocked ? 'guide-document-panel is-locked' : 'guide-document-panel'}
          >
            <div className="guide-section-heading">
              <strong>正文内容</strong>
              <span>{headingText}</span>
            </div>
            <div
              ref={documentBodyRef}
              className={layoutLocked ? 'guide-document-panel-body is-scrollable' : 'guide-document-panel-body'}
              onScroll={(event) => {
                const currentTarget = event.currentTarget;
                // #region debug-point H:document-body-scroll
                fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"scroll-stage-handoff",runId:"post-fix",hypothesisId:"H",location:"GuideSearchPanel.tsx:715",msg:"[DEBUG] document body scroll",data:{scrollTop:currentTarget.scrollTop,scrollHeight:currentTarget.scrollHeight,clientHeight:currentTarget.clientHeight},ts:Date.now()})}).catch(()=>{});
                // #endregion
              }}
            >
              {!selectedGuide ? (
                <div className="empty-state">从左侧结果中打开一篇攻略，这里会展示正文片段，也支持切换到原文视图。</div>
              ) : null}

              {selectedGuide ? (
                <div className="guide-document-card">
                  <div className="guide-document-top">
                    <h4 className="guide-document-title">{selectedGuide.title}</h4>
                    <p className="guide-document-summary">{renderHighlightedText(selectedGuide.summary, highlightTokens)}</p>
                  </div>

                  {guideDocument && (guideDocument.blocks.length > 0 || guideDocument.contentHtml) ? (
                    <div className="guide-document-view-switch" role="tablist" aria-label="正文视图切换">
                      <button
                        type="button"
                        className={
                          documentView === 'snippet'
                            ? 'guide-document-view-button active'
                            : 'guide-document-view-button'
                        }
                        onClick={() => setDocumentView('snippet')}
                      >
                        片段
                      </button>
                      <button
                        type="button"
                        className={
                          documentView === 'original'
                            ? 'guide-document-view-button active'
                            : 'guide-document-view-button'
                        }
                        onClick={() => setDocumentView('original')}
                        disabled={!guideDocument.contentHtml}
                      >
                        原文
                      </button>
                    </div>
                  ) : null}

                  {documentLoading ? <div className="empty-state">正在加载正文片段...</div> : null}
                  {documentError ? <div className="empty-state">{documentError}</div> : null}

                  {guideDocument && documentView === 'snippet' ? (
                    <div className="guide-document-blocks">
                      {guideDocument.blocks.map((block) => (
                        <section key={block.id} className={`guide-document-block guide-document-block-${block.type}`}>
                          {block.type === 'section-title' ? (
                            <h5 className="guide-document-block-title">{renderHighlightedText(block.text, highlightTokens)}</h5>
                          ) : (
                            <p className="guide-document-block-text">{renderHighlightedText(block.text, highlightTokens)}</p>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : null}

                  {guideDocument && documentView === 'original' ? (
                    guideDocument.contentHtml ? (
                      <div className="guide-document-original">
                        {originalDocumentView.sections.length > 0 ? (
                          <div className="guide-document-outline">
                            <div className="guide-document-outline-heading">
                              <strong>正文目录</strong>
                              <button
                                type="button"
                                className="ghost-button guide-document-top-button"
                                onClick={() => originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })}
                              >
                                回到顶部
                              </button>
                            </div>
                            <div className="guide-document-outline-list">
                              {originalDocumentView.sections.map((section) => (
                                <button
                                  key={section.id}
                                  type="button"
                                  className="guide-document-outline-item"
                                  onClick={() => handleJumpToSection(section.id)}
                                >
                                  {section.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div
                          ref={originalContentRef}
                          className="guide-document-original-content"
                          dangerouslySetInnerHTML={{ __html: originalDocumentView.html }}
                        />
                        {canOpenOriginalSource(guideDocument.sourceUrl) ? (
                          <a
                            href={guideDocument.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="guide-document-original-link"
                          >
                            在原网站查看完整页面
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <div className="empty-state">当前来源暂时还没有可展示的原文视图。</div>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
        <div aria-hidden="true" style={{ height: panelSpacerHeight }} />
      </aside>
    </div>
  );
}

export default GuideSearchPanel;
