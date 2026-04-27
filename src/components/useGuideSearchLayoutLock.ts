import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Refs consumed by the layout-lock synchronizer.
 * 布局锁定同步器所需的 DOM 引用集合。
 */
interface GuideSearchLayoutLockRefs {
  panelRef: RefObject<HTMLElement | null>;
  layoutRef: RefObject<HTMLDivElement | null>;
  resultsBodyRef: RefObject<HTMLDivElement | null>;
  documentBodyRef: RefObject<HTMLDivElement | null>;
  originalContentRef: RefObject<HTMLDivElement | null>;
}

/**
 * Encapsulates sticky scroll / layout-lock synchronization for GuideSearchPanel.
 * Returns the current locked flag and the spacer height required to absorb lock transitions.
 * 封装 GuideSearchPanel 的粘性滚动与布局锁定同步逻辑，返回锁定状态以及用于吸收切换的占位高度。
 */
export function useGuideSearchLayoutLock(
  open: boolean,
  visible: boolean,
  refs: GuideSearchLayoutLockRefs,
): { layoutLocked: boolean; panelSpacerHeight: number } {
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [panelSpacerHeight, setPanelSpacerHeight] = useState(0);
  const lockedStateRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setLayoutLocked(false);
      return;
    }

    const { panelRef, layoutRef, resultsBodyRef, documentBodyRef, originalContentRef } = refs;

    const syncLockState = () => {
      const panelElement = panelRef.current;
      const layoutElement = layoutRef.current;
      if (!panelElement || !layoutElement) return;

      const targetThreshold = Math.max(layoutElement.offsetTop - 8, 0);
      const rawMaxScrollableTop = Math.max(
        panelElement.scrollHeight - panelElement.clientHeight - panelSpacerHeight,
        0,
      );
      const nextSpacerHeight = Math.max(targetThreshold - rawMaxScrollableTop, 0);
      if (Math.abs(nextSpacerHeight - panelSpacerHeight) > 1) {
        setPanelSpacerHeight(nextSpacerHeight);
      }
      const lockEnterThreshold = Math.max(targetThreshold - 8, 0);
      const lockLeaveThreshold = Math.max(targetThreshold - 24, 0);
      const nextLocked = lockedStateRef.current
        ? panelElement.scrollTop > lockLeaveThreshold
        : panelElement.scrollTop >= lockEnterThreshold;
      if (lockedStateRef.current && !nextLocked) {
        resultsBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        documentBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
        originalContentRef.current?.scrollTo?.({ top: 0, behavior: 'auto' });
      }
      lockedStateRef.current = nextLocked;
      setLayoutLocked(nextLocked);
    };

    syncLockState();
    const panelElement = refs.panelRef.current;
    panelElement?.addEventListener('scroll', syncLockState, { passive: true });
    window.addEventListener('resize', syncLockState);
    return () => {
      panelElement?.removeEventListener('scroll', syncLockState);
      window.removeEventListener('resize', syncLockState);
    };
    // `visible` is intentionally a dependency so the lock recalculates after enter animation.
    // visible 作为依赖以便进入动画完成后重新计算布局。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible, panelSpacerHeight]);

  return { layoutLocked, panelSpacerHeight };
}
