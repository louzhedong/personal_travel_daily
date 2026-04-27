// 地图 chrome 集合 / Visual chrome pieces surrounding the SVG canvas.
// 头部 heading、右上 zoom 控件、右下图例、底部用户 chip 列表。
// Heading, zoom controls, legend card and user chip legend that wrap the SVG canvas.

import type { CSSProperties } from 'react';
import MapToggle from '../MapToggle';
import TravelIcon from '../ui/TravelIcon';
import type { Scope, UserProfile } from '../../types';

interface MapHeadingProps {
  scope: Scope;
  showJourneyLines: boolean;
  onScopeChange: (scope: Scope) => void;
  onToggleJourneyLines: () => void;
}

/**
 * 地图头部 / Map heading section.
 * 切换地图范围、描述文案与旅途轨迹 toggle。
 * Hosts the scope toggle, description copy and the journey trail toggle.
 */
export function MapHeading({
  scope,
  showJourneyLines,
  onScopeChange,
  onToggleJourneyLines,
}: MapHeadingProps) {
  return (
    <div className="section-heading">
      <div className="map-heading-main">
        <div className="map-heading-title-row">
          <span className="travel-icon-badge travel-icon-badge-blue map-heading-icon">
            <TravelIcon name={scope === 'domestic' ? 'compass' : 'globe'} size={16} />
          </span>
          <h3>{scope === 'domestic' ? '国内旅行版图' : '世界旅行版图'}</h3>
        </div>
        <p>点击地图区域会筛选当前区域；选中后可直接新增记录，悬停可查看当前区域的标记数量。</p>
      </div>
      <div className="map-heading-side">
        <div className="map-heading-controls">
          <div className="map-segmented-header">
            <span className="map-caption">
              <span className="travel-icon-inline">
                <TravelIcon name="route" size={14} />
              </span>
              {scope === 'domestic' ? '中国省级示意图' : '世界国家示意图'}
            </span>
            <MapToggle scope={scope} onChange={onScopeChange} />
          </div>
          <button
            type="button"
            className={showJourneyLines ? 'map-route-toggle active' : 'map-route-toggle'}
            aria-pressed={showJourneyLines}
            onClick={onToggleJourneyLines}
          >
            <span className="travel-icon-inline">
              <TravelIcon name="route" size={14} />
            </span>
            {showJourneyLines ? '隐藏旅途轨迹' : '显示旅途轨迹'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MapSelectionAndZoomProps {
  selectedRegionId?: string;
  selectedRegionName?: string;
  onOpenSelectedRegionComposer: () => void;
  onClearSelectedRegion: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

/**
 * 选中区域卡片 + 缩放控件 / Selection card plus zoom controls.
 * 在地图右上角展示当前所选区域的动作，以及放大/缩小/重置按钮。
 * Shown at the top-right corner; combines actions for the selected region and zoom buttons.
 */
export function MapSelectionAndZoom({
  selectedRegionId,
  selectedRegionName,
  onOpenSelectedRegionComposer,
  onClearSelectedRegion,
  onZoomIn,
  onZoomOut,
  onResetView,
}: MapSelectionAndZoomProps) {
  return (
    <div className="map-top-right">
      {selectedRegionId ? (
        <div className="map-selection-card">
          <strong>{selectedRegionName ?? selectedRegionId}</strong>
          <div className="map-selection-actions">
            <button type="button" className="map-selection-button" onClick={onOpenSelectedRegionComposer}>
              在此新增
            </button>
            <button type="button" className="map-selection-button is-secondary" onClick={onClearSelectedRegion}>
              清除筛选
            </button>
          </div>
        </div>
      ) : null}
      <div className="map-zoom-controls">
        <button type="button" className="map-zoom-button" aria-label="放大" onClick={onZoomIn}>
          +
        </button>
        <button type="button" className="map-zoom-button" aria-label="缩小" onClick={onZoomOut}>
          −
        </button>
        <button type="button" className="map-zoom-button" aria-label="重置" onClick={onResetView}>
          ○
        </button>
      </div>
    </div>
  );
}

/**
 * 颜色图例卡片 / Heat legend card.
 * 展示国际 / 国内两种配色方案的颜色说明。
 * Explains the international vs domestic color scales.
 */
export function MapHeatLegend({ scope }: { scope: Scope }) {
  return (
    <div className="map-bottom-right">
      <div className="map-heat-legend-card">
        <div className="map-heat-legend-title">颜色说明</div>
        {scope === 'international' ? (
          <div className="map-heat-legend-group">
            <span className="map-heat-legend-label">未访问国家</span>
            <div className="map-heat-legend-palette">
              <span className="map-heat-swatch is-empty" />
            </div>
          </div>
        ) : null}
        {scope === 'international' ? (
          <div className="map-heat-legend-group">
            <span className="map-heat-legend-label">色相区分国家</span>
            <div className="map-heat-legend-palette">
              <span className="map-heat-dot is-blue" />
              <span className="map-heat-dot is-teal" />
              <span className="map-heat-dot is-violet" />
              <span className="map-heat-dot is-orange" />
            </div>
          </div>
        ) : null}
        <div className="map-heat-legend-group">
          <span className="map-heat-legend-label">{scope === 'international' ? '同一国家示意色的深浅' : '深浅表示热度'}</span>
          <div className="map-heat-legend-scale">
            <span className={`map-heat-swatch ${scope === 'international' ? 'is-intl-low' : 'is-domestic-low'}`} />
            <span className={`map-heat-swatch ${scope === 'international' ? 'is-intl-mid' : 'is-domestic-mid'}`} />
            <span className={`map-heat-swatch ${scope === 'international' ? 'is-intl-high' : 'is-domestic-high'}`} />
          </div>
        </div>
        <div className="map-heat-legend-copy">
          <span>{scope === 'international' ? '先看色相，再看深浅' : '颜色越深，记录越多'}</span>
          <small>{scope === 'international' ? '灰白底图表示未访问国家；不同国家有不同主色，同一国家颜色越深表示记录越多' : '国内省份使用统一色带，访问越多颜色越深'}</small>
        </div>
      </div>
    </div>
  );
}

/**
 * 用户 chip 图例 / User chip legend.
 * 展示所有用户对应的颜色。
 * Lists the color chips for every user in the current workspace.
 */
export function UserChipLegend({
  users,
  cssVar,
}: {
  users: UserProfile[];
  cssVar: (vars: Record<string, string | number>) => CSSProperties;
}) {
  return (
    <div className="map-legend">
      <div className="legend-label">用户标签</div>
      <div className="user-chip-list">
        {users.map((user) => (
          <span key={user.id} className="legend-chip">
            <span
              className="legend-dot tone-dot"
              style={cssVar({ '--tone-color': user.color })}
            />
            {user.name}
          </span>
        ))}
      </div>
    </div>
  );
}
