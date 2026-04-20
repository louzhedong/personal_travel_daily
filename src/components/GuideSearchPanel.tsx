import { useEffect, useMemo, useState } from 'react';
import { getGuideDocument } from '../lib/guides/guideContentService';
import { searchGuides } from '../lib/guides/guideSearchService';
import { loadGuideSearchHistory, saveGuideSearchHistoryItem } from '../lib/repositories/guideRepository';
import { createGuideSearchHistoryItem } from '../lib/storage';
import TravelIcon from './TravelIcon';
import type { GuideDocument, GuideSearchHistoryItem, GuideSearchResult, SavedGuide, Scope } from '../types';

interface GuideSearchPanelProps {
  open: boolean;
  initialQuery?: string;
  initialScope?: Scope | 'all';
  activeUserId: string;
  linkedMarkerId?: string | null;
  savedGuides: SavedGuide[];
  onClose: () => void;
  onSaveGuide: (guide: GuideSearchResult, keyword: string) => void;
  onAttachGuideToMarker: (guide: GuideSearchResult, keyword: string, markerId: string) => void;
  onRemoveSavedGuide: (savedGuideId: string) => void;
}

function canOpenOriginalSource(sourceUrl: string) {
  return /^https?:\/\//.test(sourceUrl) && !sourceUrl.includes('guide-api.local');
}

function getSourceLinkLabel(item: GuideSearchResult) {
  return item.sourceName.includes('POI') ? '查看来源' : '查看原文';
}

export function GuideSearchPanel({
  open,
  initialQuery = '',
  initialScope = 'all',
  activeUserId,
  linkedMarkerId = null,
  savedGuides,
  onClose,
  onSaveGuide,
  onAttachGuideToMarker,
  onRemoveSavedGuide,
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
    if (!open) {
      return;
    }

    let cancelled = false;
    void loadGuideSearchHistory(6).then((nextHistory) => {
      if (!cancelled) {
        setHistory(nextHistory);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const canSearch = query.trim().length > 0 && !loading;
  const hasResult = items.length > 0;
  const hasSearched = searchedKeyword.length > 0;

  const headingText = useMemo(() => {
    if (selectedGuide) {
      return selectedGuide.destinationLabel || selectedGuide.title;
    }

    return '攻略搜索';
  }, [selectedGuide]);

  const normalizedKeyword = searchedKeyword || query.trim();

  const getSavedGuideBySourceUrl = (sourceUrl: string, markerId?: string) =>
    savedGuides.find(
      (item) =>
        item.savedByUserId === activeUserId &&
        item.markerId === markerId &&
        item.result.sourceUrl.trim().toLowerCase() === sourceUrl.trim().toLowerCase(),
    );

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

    try {
      const response = await searchGuides({
        keyword: trimmed,
        scope: nextScope,
        page: 1,
        pageSize: 8,
      });

      setItems(response.items);
      setProvider(response.provider);

      const historyItem = createGuideSearchHistoryItem(trimmed, nextScope);
      await saveGuideSearchHistoryItem(historyItem);
      setHistory(await loadGuideSearchHistory(6));
    } catch (searchError) {
      setItems([]);
      setProvider('');
      setError(searchError instanceof Error ? searchError.message : '攻略搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGuide = async (guide: GuideSearchResult) => {
    setSelectedGuide(guide);
    setGuideDocument(null);
    setDocumentLoading(true);
    setDocumentError('');

    try {
      const nextDocument = await getGuideDocument(guide.sourceUrl);
      setGuideDocument(nextDocument);
      if (!nextDocument) {
        setDocumentError('当前只有摘要，暂时还没有可展示的正文片段。');
      }
    } catch (loadError) {
      setDocumentError(loadError instanceof Error ? loadError.message : '攻略正文加载失败');
    } finally {
      setDocumentLoading(false);
    }
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

        <div className={visible ? 'guide-search-layout guide-search-animate in delay-2' : 'guide-search-layout guide-search-animate delay-2'}>
          <section className="guide-search-results">
            <div className="guide-section-heading">
              <strong>搜索结果</strong>
              <span>{provider ? `来源: ${provider}` : '等待搜索'}</span>
            </div>

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
          </section>

          <aside className="guide-document-panel">
            <div className="guide-section-heading">
              <strong>正文片段</strong>
              <span>{headingText}</span>
            </div>

            {!selectedGuide ? (
              <div className="empty-state">从左侧结果中打开一篇攻略，这里会展示结构化正文片段。</div>
            ) : null}

            {selectedGuide ? (
              <div className="guide-document-card">
                <div className="guide-document-top">
                  <h4 className="guide-document-title">{selectedGuide.title}</h4>
                  <p className="guide-document-summary">{selectedGuide.summary}</p>
                </div>

                {documentLoading ? <div className="empty-state">正在加载正文片段...</div> : null}
                {documentError ? <div className="empty-state">{documentError}</div> : null}

                {guideDocument ? (
                  <div className="guide-document-blocks">
                    {guideDocument.blocks.map((block) => (
                      <section key={block.id} className={`guide-document-block guide-document-block-${block.type}`}>
                        {block.type === 'section-title' ? (
                          <h5 className="guide-document-block-title">{block.text}</h5>
                        ) : (
                          <p className="guide-document-block-text">{block.text}</p>
                        )}
                      </section>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </aside>
    </div>
  );
}

export default GuideSearchPanel;
