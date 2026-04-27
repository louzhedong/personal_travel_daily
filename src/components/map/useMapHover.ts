// 地图区域悬停 Hook / Region hover hook.
// 集中管理 hover path 识别、tooltip 定位与 rAF 节流，避免 TravelMap 容器臃肿。
// Centralises hover target tracking, tooltip positioning and requestAnimationFrame throttling.

import { useEffect, useRef, useState } from 'react';

export function useMapHover(params: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  shellRef: React.RefObject<HTMLDivElement | null>;
  dragActiveRef: { active: boolean };
}) {
  const { svgRef, shellRef, dragActiveRef } = params;
  const [hoverRegionId, setHoverRegionId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const pendingHoverRef = useRef<{ path: SVGPathElement | null; clientX: number; clientY: number } | null>(null);
  const hoverRegionRef = useRef<string | null>(null);
  const hoverSegmentRef = useRef<string | null>(null);
  const hoverPathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    hoverRegionRef.current = hoverRegionId;
  }, [hoverRegionId]);

  useEffect(() => () => {
    if (hoverFrameRef.current !== null) {
      cancelAnimationFrame(hoverFrameRef.current);
    }
  }, []);

  const updateTooltipPosition = (clientX: number, clientY: number) => {
    if (!shellRef.current) return;
    const width = 280;
    const height = 110;
    const gap = 14;
    let left = clientX + gap;
    let top = clientY + gap;
    if (left + width > window.innerWidth - 12) left = clientX - width - gap;
    if (top + height > window.innerHeight - 12) top = clientY - height - gap;
    left = Math.max(12, left);
    top = Math.max(12, top);
    setTooltipPos({ left, top });
  };

  const applyHoverTarget = (pathElement: SVGPathElement | null, clientX: number, clientY: number) => {
    if (hoverPathRef.current !== pathElement) {
      hoverPathRef.current?.classList.remove('hover');
      if (pathElement) pathElement.classList.add('hover');
      hoverPathRef.current = pathElement;
    }

    const nextRegionId = pathElement?.getAttribute('data-region-id') || null;
    const nextSegmentKey = pathElement?.getAttribute('data-segment-key') || null;

    if (hoverRegionRef.current !== nextRegionId) {
      hoverRegionRef.current = nextRegionId;
      setHoverRegionId(nextRegionId);
    }
    hoverSegmentRef.current = nextSegmentKey;

    if (pathElement) updateTooltipPosition(clientX, clientY);
    else setTooltipPos(null);
  };

  const queueHoverUpdate = (pathElement: SVGPathElement | null, clientX: number, clientY: number) => {
    pendingHoverRef.current = { path: pathElement, clientX, clientY };
    if (hoverFrameRef.current !== null) return;
    hoverFrameRef.current = requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      const payload = pendingHoverRef.current;
      if (!payload) return;
      applyHoverTarget(payload.path, payload.clientX, payload.clientY);
    });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handlePointerMove = (event: PointerEvent) => {
      if (dragActiveRef.active) return;
      const target = (event.target as Element | null)?.closest?.('path[data-segment-key]') as SVGPathElement | null;
      queueHoverUpdate(target, event.clientX, event.clientY);
    };
    const handlePointerLeave = () => queueHoverUpdate(null, 0, 0);
    svg.addEventListener('pointermove', handlePointerMove);
    svg.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      svg.removeEventListener('pointermove', handlePointerMove);
      svg.removeEventListener('pointerleave', handlePointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    hoverRegionId,
    hoverRegionRef,
    tooltipPos,
    queueHoverUpdate,
  };
}
