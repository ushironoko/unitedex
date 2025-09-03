import "@testing-library/jest-dom";

// global設定
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Canvas APIのモック
class MockCanvas {
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({}),
      putImageData: () => {},
      createImageData: () => ({}),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    };
  }

  toDataURL() {
    return "";
  }
}

global.HTMLCanvasElement = MockCanvas as unknown as typeof HTMLCanvasElement;

// ResizeObserverのモック
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
