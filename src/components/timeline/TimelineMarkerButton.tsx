import { formatVisitedRange } from '../../lib/date';
import {
  MARKER_BUDGET_LEVEL_LABELS,
  MARKER_TAG_LABELS,
  MARKER_TRANSPORT_LABELS,
  MARKER_WEATHER_LABELS,
} from '../../lib/markerMetadata';
import type { VisitMarker } from '../../types';

/**
 * Shared marker button used by both timeline branches so that selection-mode
 * behavior stays in sync.
 * 普通时间线与行程分组共用的 marker 按钮：
 * - 整理模式下：点击切换选择态，不打开详情
 * - 普通模式下：点击打开详情
 */

export interface TimelineMarkerButtonProps {
  marker: VisitMarker;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (markerId: string) => void;
  onOpenDetail: (markerId: string) => void;
}

export default function TimelineMarkerButton({
  marker,
  selectionMode,
  isSelected,
  onToggleSelect,
  onOpenDetail,
}: TimelineMarkerButtonProps) {
  const tagSummary = (marker.tags ?? []).slice(0, 2).map((tag) => MARKER_TAG_LABELS[tag].zh);
  const metadataSummary = [
    marker.weather ? MARKER_WEATHER_LABELS[marker.weather].zh : null,
    marker.transport ? MARKER_TRANSPORT_LABELS[marker.transport].zh : null,
    marker.budgetLevel ? MARKER_BUDGET_LEVEL_LABELS[marker.budgetLevel].zh : null,
  ].filter(Boolean);

  if (selectionMode) {
    return (
      <button
        type="button"
        className={
          isSelected
            ? 'trip-timeline-item-button is-selecting is-selected'
            : 'trip-timeline-item-button is-selecting'
        }
        onClick={() => onToggleSelect(marker.id)}
      >
        <span className="trip-timeline-item-top">
          <strong>{marker.scopeName} · {marker.city}</strong>
          <span>{isSelected ? '已选中' : '点击选择'}</span>
        </span>
        <span className="trip-timeline-item-subtitle">{formatVisitedRange(marker)}</span>
        {tagSummary.length > 0 || metadataSummary.length > 0 ? (
          <span className="trip-timeline-item-subtitle">
            {[...tagSummary, metadataSummary.join(' · ')].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="trip-timeline-item-button"
      onClick={() => onOpenDetail(marker.id)}
    >
      <span className="trip-timeline-item-top">
        <strong>{marker.scopeName} · {marker.city}</strong>
        <span>{marker.scope === 'domestic' ? '国内' : '国际'}</span>
      </span>
      <span className="trip-timeline-item-subtitle">{formatVisitedRange(marker)}</span>
        {tagSummary.length > 0 || metadataSummary.length > 0 ? (
          <span className="trip-timeline-item-subtitle">
            {[...tagSummary, metadataSummary.join(' · ')].filter(Boolean).join(' · ')}
          </span>
        ) : null}
    </button>
  );
}
