import TravelIcon from './ui/TravelIcon';
import type { GuideSearchHistoryItem, Scope } from '../types';

/**
 * Props for GuideSearchInputBar.
 * GuideSearchInputBar 的属性定义。
 */
interface GuideSearchInputBarProps {
  /** Whether the enter-transition class should be applied. 是否附加入场动画类名。 */
  visible: boolean;
  /** Current search keyword. 当前的搜索关键词。 */
  query: string;
  /** Current search scope. 当前的搜索范围。 */
  scope: Scope | 'all';
  /** Whether smart (semantic) search is enabled. 是否启用智能搜索。 */
  smartSearchEnabled: boolean;
  /** Whether the panel is in a loading state. 是否处于搜索中状态。 */
  loading: boolean;
  /** Whether the search button can be triggered. 是否允许触发搜索。 */
  canSearch: boolean;
  /** Recent search history shortcuts. 最近搜索历史快捷项。 */
  history: GuideSearchHistoryItem[];
  /** Update the search keyword. 更新搜索关键词。 */
  onQueryChange: (nextQuery: string) => void;
  /** Update the search scope. 更新搜索范围。 */
  onScopeChange: (nextScope: Scope | 'all') => void;
  /** Toggle smart search mode. 切换智能搜索模式。 */
  onSmartSearchChange: (enabled: boolean) => void;
  /** Trigger a search using current state or the given shortcut. 触发搜索（可由快捷项注入）。 */
  onSubmit: (nextQuery?: string, nextScope?: Scope | 'all') => void;
  /** Close the entire panel. 关闭整个搜索面板。 */
  onClose: () => void;
}

/**
 * Search input bar including keyword box, scope chips, smart toggle and history shortcuts.
 * 搜索输入栏，包含关键词输入框、范围筛选、智能搜索开关与历史快捷。
 */
export function GuideSearchInputBar({
  visible,
  query,
  scope,
  smartSearchEnabled,
  loading,
  canSearch,
  history,
  onQueryChange,
  onScopeChange,
  onSmartSearchChange,
  onSubmit,
  onClose,
}: GuideSearchInputBarProps) {
  return (
    <>
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
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canSearch) {
                event.preventDefault();
                onSubmit();
              }
            }}
            className="field-control guide-search-input"
            placeholder="输入目的地、季节或玩法，例如：舟山 海岛 攻略"
          />
          <button
            type="button"
            className="primary-button guide-search-submit"
            disabled={!canSearch}
            onClick={() => onSubmit()}
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        <div className="guide-search-filters">
          <button
            type="button"
            className={scope === 'all' ? 'guide-filter-chip active' : 'guide-filter-chip'}
            onClick={() => onScopeChange('all')}
          >
            全部
          </button>
          <button
            type="button"
            className={scope === 'domestic' ? 'guide-filter-chip active' : 'guide-filter-chip'}
            onClick={() => onScopeChange('domestic')}
          >
            国内
          </button>
          <button
            type="button"
            className={scope === 'international' ? 'guide-filter-chip active' : 'guide-filter-chip'}
            onClick={() => onScopeChange('international')}
          >
            国际
          </button>
          <label className={smartSearchEnabled ? 'guide-smart-toggle active' : 'guide-smart-toggle'}>
            <input
              type="checkbox"
              checked={smartSearchEnabled}
              onChange={(event) => onSmartSearchChange(event.target.checked)}
            />
            智能搜索
          </label>
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
                    onQueryChange(item.keyword);
                    onScopeChange(item.scope);
                    onSubmit(item.keyword, item.scope);
                  }}
                >
                  {item.keyword}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default GuideSearchInputBar;
