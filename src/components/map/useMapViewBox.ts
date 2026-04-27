// 地图缩放与平移 Hook / Map viewBox (zoom & pan) hook.
// 将 TravelMap 中的 viewBox 状态、缩放与拖拽逻辑抽取出来，让容器更专注于编排。
// Extracts viewBox state plus zoom/drag handlers from TravelMap so the container can focus on orchestration.

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const INITIAL_W = 920;
const INITIAL_H = 520;
const MIN_SCALE = 1;
const MAX_SCALE = 10;

export interface ViewBoxState {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useMapViewBox(params: {
  scope: unknown;
  svgRef: React.RefObject<SVGSVGElement | null>;
  shellRef: React.RefObject<HTMLDivElement | null>;
  onClickSelect: () => void;
  pointerInsideRef: React.RefObject<boolean>;
}) {
  const { scope, svgRef, shellRef, onClickSelect, pointerInsideRef } = params;
  const [viewBox, setViewBox] = useState<ViewBoxState>({ x: 0, y: 0, w: INITIAL_W, h: INITIAL_H });
  const viewBoxRef = useRef(viewBox);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false });

  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // 切换地图范围时重置视图 / Reset viewBox when scope changes.
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: INITIAL_W, h: INITIAL_H });
  }, [scope]);

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { sx: 0, sy: 0 };
    const bbox = svg.getBoundingClientRect();
    const current = viewBoxRef.current;
    const px = (clientX - bbox.left) / bbox.width;
    const py = (clientY - bbox.top) / bbox.height;
    return { sx: current.x + px * current.w, sy: current.y + py * current.h };
  };

  const clampViewBox = (next: ViewBoxState) => {
    const marginX = INITIAL_W * 0.5;
    const marginY = INITIAL_H * 0.5;
    const x = Math.min(Math.max(next.x, -marginX), INITIAL_W - next.w + marginX);
    const y = Math.min(Math.max(next.y, -marginY), INITIAL_H - next.h + marginY);
    return { ...next, x, y };
  };

  const zoomAt = (factor: number, clientX: number, clientY: number) => {
    const { sx, sy } = clientToSvg(clientX, clientY);
    setViewBox((currentViewBox) => {
      const scale = INITIAL_W / currentViewBox.w;
      const targetScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
      const s = targetScale / scale;
      const newW = currentViewBox.w / s;
      const newH = currentViewBox.h / s;
      const dx = (sx - currentViewBox.x) / currentViewBox.w;
      const dy = (sy - currentViewBox.y) / currentViewBox.h;
      return clampViewBox({ x: sx - dx * newW, y: sy - dy * newH, w: newW, h: newH });
    });
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: viewBox.x,
      originY: viewBox.y,
      moved: false,
    };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    (e.currentTarget as SVGSVGElement).style.cursor = 'grabbing';
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    const svg = svgRef.current;
    if (!svg) return;
    const bbox = svg.getBoundingClientRect();
    const dxPx = e.clientX - d.startX;
    const dyPx = e.clientY - d.startY;
    if (Math.abs(dxPx) + Math.abs(dyPx) > 2) d.moved = true;
    const dx = (dxPx / bbox.width) * viewBox.w;
    const dy = (dyPx / bbox.height) * viewBox.h;
    setViewBox(clampViewBox({ x: d.originX - dx, y: d.originY - dy, w: viewBox.w, h: viewBox.h }));
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (svg) svg.style.cursor = '';
    const canSelect = !dragRef.current.moved;
    dragRef.current.active = false;
    (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
    if (canSelect) {
      onClickSelect();
    }
  };

  const resetView = () => setViewBox({ x: 0, y: 0, w: INITIAL_W, h: INITIAL_H });

  // 滚轮缩放绑定到 map-shell / Bind wheel zoom to map-shell.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(factor, event.clientX, event.clientY);
    };
    shell.addEventListener('wheel', handleWheel, { passive: false });
    return () => shell.removeEventListener('wheel', handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 指针在地图内时阻止全局滚动 / Prevent page scroll when pointer is inside the map.
  useEffect(() => {
    const handleGlobalWheel = (event: WheelEvent) => {
      if (!pointerInsideRef.current) return;
      event.preventDefault();
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel, { capture: true } as EventListenerOptions);
  }, [pointerInsideRef]);

  const currentScale = INITIAL_W / viewBox.w;

  return {
    viewBox,
    currentScale,
    dragActiveRef: { get active() { return dragRef.current.active; } },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomAt,
    resetView,
    INITIAL_W,
    INITIAL_H,
  };
}
