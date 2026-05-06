import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import type { GuideSourceHealthDto } from '../lib/api/types';
import type { GuideSearchResult, SavedGuide } from '../types';

/**
 * Evaluate whether the source URL points to an openable external page.
 * 判断来源 URL 是否可以作为外链直接打开。
 */
function canOpenOriginalSource(sourceUrl: string) {
  return /^https?:\/\//.test(sourceUrl) && !sourceUrl.includes('guide-api.local');
}

/**
 * Choose the textual label for the source link based on source name.
 * 根据来源名称选择外链按钮文案。
 */
function getSourceLinkLabel(item: GuideSearchResult) {
  return item.sourceName.includes('POI') ? '查看来源' : '查看原文';
}

/**
 * Props for GuideSearchResultList.
 * GuideSearchResultList 的属性定义。
 */
interface GuideSearchResultListProps {
  /** Whether the layout lock is engaged for inner scrolling. 是否启用内层滚动锁定。 */
  layoutLocked: boolean;
  /** Search result items. 搜索结果列表。 */
  items: GuideSearchResult[];
  /** Backend provider tag. 结果来源提供方标识。 */
  provider: string;
  /** Loading flag for the current search. 当前搜索的加载态。 */
  loading: boolean;
  /** Error message for the current search. 当前搜索的错误信息。 */
  error: string;
  /** Whether any search has been issued. 是否至少发起过一次搜索。 */
  hasSearched: boolean;
  /** Keyword actually submitted for search. 实际提交给搜索的关键词。 */
  searchedKeyword: string;
  /** Marker ID to link guides to, if any. 当前可关联的记录 ID。 */
  linkedMarkerId: string | null;
  /** Normalized keyword used for save/attach callbacks. 用于收藏 / 关联的规范化关键词。 */
  normalizedKeyword: string;
  /** Lookup helper for determining existing saved guide entry. 查询已收藏攻略的辅助函数。 */
  getSavedGuideBySourceUrl: (sourceUrl: string, markerId?: string) => SavedGuide | null;
  /** Render highlighted text nodes for matched keywords. 渲染命中高亮文本。 */
  renderHighlightedText: (text: string) => ReactNode;
  /** Source health lookup by domain. 按域名索引的来源健康度。 */
  sourceHealthByDomain: Map<string, GuideSourceHealthDto>;
  /** Open a guide document for preview. 打开攻略正文片段。 */
  onOpenGuide: (guide: GuideSearchResult) => void;
  /** Save a guide to favorites. 收藏攻略。 */
  onSaveGuide: (guide: GuideSearchResult, keyword: string) => void;
  /** Attach a guide to the active marker. 将攻略关联到当前记录。 */
  onAttachGuideToMarker: (guide: GuideSearchResult, keyword: string, markerId: string) => void;
  /** Remove a previously saved guide. 移除已收藏的攻略。 */
  onRemoveSavedGuide: (savedGuideId: string) => void;
  /** Generate a trip checklist from a search result. 从搜索结果生成行前清单。 */
  onGenerateTripChecklist: (guide: GuideSearchResult) => void;
  /** Add a search result to trip planning. 将搜索结果加入行程规划。 */
  onAddToTripPlanning: (guide: GuideSearchResult) => void;
  /** Add a search result to the wishlist map. 将搜索结果加入愿望地图。 */
  onAddToWishlist: (guide: GuideSearchResult) => void;
  /** Whether checklist generation can be triggered now. 当前是否可生成行前清单。 */
  canGenerateTripChecklist: boolean;
  /** Whether more pages can be loaded. 是否还有更多分页结果。 */
  hasMore: boolean;
  /** Whether the next page is loading. 下一页是否正在加载。 */
  loadingMore: boolean;
  /** Load the next page. 加载下一页。 */
  onLoadMore: () => void;
}

/**
 * Results column with summary list, status badges and save / attach actions.
 * 结果列，承担摘要列表、状态标记与收藏 / 关联按钮。
 */
export const GuideSearchResultList = forwardRef<HTMLDivElement, GuideSearchResultListProps>(
  function GuideSearchResultList(
    {
      layoutLocked,
      items,
      provider,
      loading,
      error,
      hasSearched,
      searchedKeyword,
      linkedMarkerId,
      normalizedKeyword,
      getSavedGuideBySourceUrl,
      renderHighlightedText,
      sourceHealthByDomain,
      onOpenGuide,
      onSaveGuide,
      onAttachGuideToMarker,
      onRemoveSavedGuide,
      onGenerateTripChecklist,
      onAddToTripPlanning,
      onAddToWishlist,
      canGenerateTripChecklist,
      hasMore,
      loadingMore,
      onLoadMore,
    },
    resultsBodyRef,
  ) {
    const hasResult = items.length > 0;

    return (
      <section className={layoutLocked ? 'guide-search-results is-locked' : 'guide-search-results'}>
        <div className="guide-section-heading">
          <strong>搜索结果</strong>
          <span>{provider ? `来源: ${provider}` : '等待搜索'}</span>
        </div>
        <div
          ref={resultsBodyRef}
          className={layoutLocked ? 'guide-search-results-body is-scrollable' : 'guide-search-results-body'}
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
                      {(() => {
                        let hostname = '';
                        try {
                          hostname = new URL(item.sourceUrl).hostname.toLowerCase();
                        } catch {
                          hostname = '';
                        }
                        const sourceHealth = hostname ? sourceHealthByDomain.get(hostname) : undefined;
                        const sourceWarning =
                          sourceHealth && sourceHealth.recentFailure > sourceHealth.recentSuccess;
                        return sourceWarning ? (
                          <span className="guide-result-health guide-result-health-warning">
                            来源波动
                          </span>
                        ) : null;
                      })()}
                      {item.publishedAt ? <span className="guide-result-date">{item.publishedAt}</span> : null}
                    </div>
                    <h4 className="guide-result-title">{renderHighlightedText(item.title)}</h4>
                    <p className="guide-result-summary">{renderHighlightedText(item.summary)}</p>
                    {item.matchReason ? (
                      <p className="guide-result-match-reason">{renderHighlightedText(item.matchReason)}</p>
                    ) : null}
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
                        onClick={() => onOpenGuide(item)}
                      >
                        查看片段
                      </button>
                      <button
                        type="button"
                        className="ghost-button guide-action-button"
                        onClick={() => onGenerateTripChecklist(item)}
                        disabled={!canGenerateTripChecklist}
                      >
                        生成行前清单
                      </button>
                      <button
                        type="button"
                        className="ghost-button guide-action-button"
                        onClick={() => onAddToTripPlanning(item)}
                        disabled={!canGenerateTripChecklist}
                      >
                        加入行程规划
                      </button>
                      <button
                        type="button"
                        className="ghost-button guide-action-button"
                        onClick={() => onAddToWishlist(item)}
                      >
                        加入愿望地图
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
              {hasMore ? (
                <div className="guide-result-load-more">
                  <button
                    type="button"
                    className="ghost-button guide-action-button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? '正在加载更多...' : '加载更多'}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  },
);

export default GuideSearchResultList;
