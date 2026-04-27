// 地图回放控制 Hook / Map replay controller hook.
// 管理回放 index/playing/started 等状态、tag 动画及衍生 visual。
// Owns replay index/playing/started state, tag animation and the derived visual.

import { useEffect, useMemo, useState } from 'react';
import type { MapReplayItem } from '../../lib/mapReplay';
import { buildReplayMotionPath, getQuadraticPoint, type ReplayTagVisual } from './MapReplayLayer';
import type { ReplaySpeedValue } from './ReplayControlBar';

interface UseMapReplayControllerArgs {
  activeUserId: string;
  scope: unknown;
  replayItems: MapReplayItem[];
  replayPointsByRegionId: Map<string, { x: number; y: number }>;
  onReplayStart?: () => void;
}

export function useMapReplayController({
  activeUserId,
  scope,
  replayItems,
  replayPointsByRegionId,
  onReplayStart,
}: UseMapReplayControllerArgs) {
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayStarted, setReplayStarted] = useState(false);
  const [replaySpeedMs, setReplaySpeedMs] = useState<ReplaySpeedValue>(1200);
  const [replayTagPosition, setReplayTagPosition] = useState<{ x: number; y: number } | null>(null);
  const [replayMotionFromIndex, setReplayMotionFromIndex] = useState<number | null>(null);
  const [replayManualTransitionVisible, setReplayManualTransitionVisible] = useState(false);

  const canReplay = replayItems.length >= 2;
  const activeReplayItem = replayStarted ? replayItems[replayIndex] ?? null : null;

  const replayTagVisual = useMemo<ReplayTagVisual | null>(() => {
    if (!activeReplayItem) return null;
    const currentPoint = replayPointsByRegionId.get(activeReplayItem.regionId);
    if (!currentPoint) return null;
    const motionOriginItem =
      replayMotionFromIndex !== null && replayMotionFromIndex >= 0 && replayMotionFromIndex < replayItems.length
        ? replayItems[replayMotionFromIndex]
        : null;
    const previousPoint = motionOriginItem ? replayPointsByRegionId.get(motionOriginItem.regionId) : null;
    return {
      key: motionOriginItem ? `${motionOriginItem.marker.id}-${activeReplayItem.marker.id}` : activeReplayItem.marker.id,
      x: currentPoint.x,
      y: currentPoint.y,
      ...buildReplayMotionPath({
        fromX: previousPoint?.x ?? currentPoint.x,
        fromY: previousPoint?.y ?? currentPoint.y,
        toX: currentPoint.x,
        toY: currentPoint.y,
      }),
    };
  }, [activeReplayItem, replayItems, replayMotionFromIndex, replayPointsByRegionId]);

  // 切换用户/范围时重置 / Reset when user or scope changes.
  useEffect(() => {
    setReplayPlaying(false);
    setReplayStarted(false);
    setReplayIndex(0);
    setReplayTagPosition(null);
    setReplayMotionFromIndex(null);
    setReplayManualTransitionVisible(false);
  }, [activeUserId, replayItems, scope]);

  // 沿贝塞尔曲线驱动 tag 动画 / Drive the tag animation along the bezier.
  useEffect(() => {
    if (!replayTagVisual || !activeReplayItem) {
      setReplayTagPosition(null);
      return;
    }
    const start = performance.now();
    const duration = 700;
    let frameId = 0;
    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress);
      const point = getQuadraticPoint({
        fromX: replayTagVisual.fromX,
        fromY: replayTagVisual.fromY,
        controlX: replayTagVisual.controlX,
        controlY: replayTagVisual.controlY,
        toX: replayTagVisual.x,
        toY: replayTagVisual.y,
        t: eased,
      });
      setReplayTagPosition(point);
      if (progress < 1) frameId = requestAnimationFrame(step);
      else {
        setReplayMotionFromIndex(null);
        setReplayManualTransitionVisible(false);
      }
    };
    setReplayTagPosition({ x: replayTagVisual.fromX, y: replayTagVisual.fromY });
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [activeReplayItem, replayTagVisual]);

  // 防止 index 越界 / Guard the index when replayItems shrinks.
  useEffect(() => {
    if (replayIndex <= replayItems.length - 1) return;
    setReplayIndex(Math.max(0, replayItems.length - 1));
  }, [replayIndex, replayItems.length]);

  // 自动播放步进 / Auto-play stepping.
  useEffect(() => {
    if (!replayPlaying || !canReplay) return;
    const timer = window.setTimeout(() => {
      setReplayIndex((current) => {
        if (current >= replayItems.length - 1) {
          setReplayPlaying(false);
          return current;
        }
        setReplayMotionFromIndex(current);
        setReplayManualTransitionVisible(false);
        return current + 1;
      });
    }, replaySpeedMs);
    return () => window.clearTimeout(timer);
  }, [canReplay, replayIndex, replayItems.length, replayPlaying, replaySpeedMs]);

  const handleReplayPlayPause = () => {
    if (!canReplay) return;
    onReplayStart?.();
    setReplayStarted(true);
    setReplayPlaying((current) => {
      if (!current && replayIndex >= replayItems.length - 1) {
        setReplayMotionFromIndex(null);
        setReplayManualTransitionVisible(false);
        setReplayIndex(0);
      }
      return !current;
    });
  };
  const handleReplayPrevious = () => {
    setReplayPlaying(false);
    setReplayStarted(true);
    setReplayMotionFromIndex(replayIndex);
    setReplayManualTransitionVisible(true);
    setReplayIndex((current) => Math.max(0, current - 1));
  };
  const handleReplayNext = () => {
    setReplayPlaying(false);
    setReplayStarted(true);
    setReplayMotionFromIndex(replayIndex);
    setReplayManualTransitionVisible(true);
    setReplayIndex((current) => Math.min(replayItems.length - 1, current + 1));
  };
  const handleReplayEnd = () => {
    setReplayPlaying(false);
    setReplayStarted(false);
    setReplayIndex(0);
    setReplayMotionFromIndex(null);
    setReplayManualTransitionVisible(false);
  };

  return {
    replayIndex,
    replayPlaying,
    replayStarted,
    replaySpeedMs,
    setReplaySpeedMs,
    replayTagPosition,
    replayManualTransitionVisible,
    canReplay,
    activeReplayItem,
    replayTagVisual,
    handleReplayPlayPause,
    handleReplayPrevious,
    handleReplayNext,
    handleReplayEnd,
  };
}
