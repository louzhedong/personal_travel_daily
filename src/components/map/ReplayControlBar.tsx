// 地图回放控制条 / Map replay control bar.
// 承接回放按钮组（上一条 / 播放暂停 / 下一条 / 结束 / 速度）与文案展示。
// Renders the replay button cluster (prev / play-pause / next / end / speed) and status copy.

import FancySelect from '../ui/FancySelect';

// 速度选项对外暴露为常量，便于 TravelMap 保留原有类型约束。
// Speed option table exposed as a constant so the parent can keep the original type narrowing.
export const REPLAY_SPEED_OPTIONS = [
  { label: '0.75x', value: 1800 },
  { label: '1x', value: 1200 },
  { label: '1.5x', value: 800 },
] as const;

export type ReplaySpeedValue = (typeof REPLAY_SPEED_OPTIONS)[number]['value'];

interface ReplayControlBarProps {
  // 状态文本 / Status copy shown on the left.
  statusText: string;
  // 播放相关状态 / Replay flags.
  canReplay: boolean;
  replayPlaying: boolean;
  replayStarted: boolean;
  replayIndex: number;
  replayTotal: number;
  // 当前速度 / Current speed in ms per step.
  replaySpeedMs: ReplaySpeedValue;
  // 事件回调 / Event callbacks delegated to the parent.
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEnd: () => void;
  onSpeedChange: (value: ReplaySpeedValue) => void;
}

/**
 * 回放控制条 / Replay control bar component.
 * 只做展示与回调委托，状态由 TravelMap 统一管理。
 * Purely presentational; all state lives in TravelMap and is passed down.
 */
function ReplayControlBar({
  statusText,
  canReplay,
  replayPlaying,
  replayStarted,
  replayIndex,
  replayTotal,
  replaySpeedMs,
  onPlayPause,
  onPrevious,
  onNext,
  onEnd,
  onSpeedChange,
}: ReplayControlBarProps) {
  const replaySpeedValue = String(replaySpeedMs);

  return (
    <div className="map-replay-panel" aria-label="地图回放控制">
      <div className="map-replay-copy">
        <strong>当前旅伴轨迹</strong>
        <span>{statusText}</span>
      </div>
      <div className="map-replay-controls">
        <button
          type="button"
          className="map-replay-button"
          aria-label="回放上一条"
          onClick={onPrevious}
          disabled={!canReplay || replayIndex === 0}
        >
          ‹
        </button>
        <button
          type="button"
          className="map-replay-primary"
          aria-label={replayPlaying ? '暂停地图回放' : '播放地图回放'}
          onClick={onPlayPause}
          disabled={!canReplay}
        >
          {replayPlaying ? '暂停' : '播放'}
        </button>
        <button
          type="button"
          className="map-replay-button"
          aria-label="回放下一条"
          onClick={onNext}
          disabled={!canReplay || replayIndex >= replayTotal - 1}
        >
          ›
        </button>
        <button
          type="button"
          className="map-replay-button map-replay-reset"
          aria-label="结束地图回放"
          onClick={onEnd}
          disabled={!replayStarted}
        >
          结束
        </button>
        <div className="map-replay-speed">
          <FancySelect
            value={replaySpeedValue}
            onChange={(value) => onSpeedChange(Number(value) as ReplaySpeedValue)}
            options={REPLAY_SPEED_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
            ariaLabel="地图回放速度"
            placeholder="速度"
            className="map-replay-speed-select"
            triggerClassName="map-replay-speed-trigger"
            menuClassName="map-replay-speed-menu"
            usePortal
          />
        </div>
      </div>
    </div>
  );
}

export default ReplayControlBar;
