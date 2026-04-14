import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

if (!('PointerEvent' in window)) {
  // JSDOM 缺少 PointerEvent，测试中用 MouseEvent 兜底即可
  // @ts-expect-error jsdom polyfill
  window.PointerEvent = MouseEvent;
}

if (!SVGElement.prototype.setPointerCapture) {
  SVGElement.prototype.setPointerCapture = () => {};
}

if (!SVGElement.prototype.releasePointerCapture) {
  SVGElement.prototype.releasePointerCapture = () => {};
}

SVGElement.prototype.getBoundingClientRect = () =>
  ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 920,
    height: 520,
    right: 920,
    bottom: 520,
    toJSON: () => ({}),
  }) as DOMRect;
