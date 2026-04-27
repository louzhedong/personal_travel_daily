import FancySelect from '../ui/FancySelect';
import { formatVisitedRange } from '../../lib/date';
import type { VisitMarker } from '../../types';

/**
 * Selection-mode batch toolbar including the selected-records tooltip.
 * 整理模式的批量工具条，包含"已选记录"tooltip（超过 5 条启用 is-scrollable 滚动，
 * 每行单行 ellipsis 显示）。
 */

export interface TripBatchToolbarProps {
  // 已选 id 列表（用于计数显示）/ selected ids (for counting)
  selectedMarkerIds: string[];
  // 已选标记对象列表（用于 tooltip 渲染）/ selected markers (for tooltip)
  selectedMarkers: VisitMarker[];
  // 批量目标行程 id / batch target trip id
  batchTripTarget: string;
  onBatchTripTargetChange: (value: string) => void;
  // 可选行程列表 / available trip options
  tripOptions: Array<{ value: string; label: string }>;
  // 应用整理回调 / apply batch callback
  onApplyBatch: () => void;
}

export default function TripBatchToolbar({
  selectedMarkerIds,
  selectedMarkers,
  batchTripTarget,
  onBatchTripTargetChange,
  tripOptions,
  onApplyBatch,
}: TripBatchToolbarProps) {
  return (
    <div className="trip-batch-toolbar">
      <div className="trip-batch-summary">
        <strong>整理模式</strong>
        <div className="trip-batch-summary-meta">
          <div className="trip-batch-selected-summary-wrap">
            <span
              className={
                selectedMarkers.length > 0
                  ? 'trip-batch-selected-summary has-tooltip'
                  : 'trip-batch-selected-summary'
              }
              tabIndex={selectedMarkers.length > 0 ? 0 : undefined}
            >
              已选 {selectedMarkerIds.length} 条记录
            </span>
            {selectedMarkers.length > 0 ? (
              <div
                role="tooltip"
                className={
                  // 超过 5 条启用滚动条 / enable scroll when more than five
                  selectedMarkers.length > 5
                    ? 'trip-batch-selection-tooltip is-scrollable'
                    : 'trip-batch-selection-tooltip'
                }
              >
                <strong>已选记录</strong>
                <ul className="trip-batch-selection-tooltip-list">
                  {selectedMarkers.map((marker) => (
                    <li key={marker.id}>
                      <span className="trip-batch-selection-tooltip-primary">
                        {marker.scopeName} · {marker.city}
                      </span>
                      <span className="trip-batch-selection-tooltip-secondary">
                        {formatVisitedRange(marker)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="trip-batch-actions">
        <FancySelect
          value={batchTripTarget}
          onChange={onBatchTripTargetChange}
          placeholder="选择目标行程"
          ariaLabel="选择批量整理的目标行程"
          triggerClassName="trip-timeline-year-trigger trip-batch-select-trigger"
          options={[
            { value: 'unassigned', label: '移回未归入行程' },
            ...tripOptions,
          ]}
        />
        <button
          type="button"
          className="primary-button trip-batch-submit"
          disabled={!batchTripTarget || selectedMarkerIds.length === 0}
          onClick={onApplyBatch}
        >
          应用整理
        </button>
      </div>
    </div>
  );
}
