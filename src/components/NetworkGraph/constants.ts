export const NETWORK_OPTIONS = {
  physics: {
    enabled: true,
    barnesHut: {
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0.1,
    },
    maxVelocity: 50,
    minVelocity: 0.75,
    solver: "barnesHut" as const,
    stabilization: {
      enabled: true,
      iterations: 100, // 初期配置のための最小限のイテレーション
      updateInterval: 10,
      onlyDynamicEdges: false,
      fit: false,
    },
  },
  interaction: {
    hover: false, // ホバーを無効化してパフォーマンス向上
    tooltipDelay: 300,
    hideEdgesOnDrag: true,
    navigationButtons: true,
    keyboard: {
      enabled: true,
    },
    zoomView: true,
  },
  layout: {
    improvedLayout: false,
    clusterThreshold: 150,
  },
  nodes: {
    shape: "dot" as const,
    scaling: {
      min: 10,
      max: 25,
    },
    mass: 1,
  },
  edges: {
    smooth: {
      enabled: true,
      type: "continuous" as const,
      roundness: 0.5,
    },
  },
} as const;

export const FOCUS_ANIMATION = {
  duration: 500,
  easingFunction: "easeInOutQuad",
} as const;

export const NODE_SIZES = {
  normal: 15,
  selected: 20,
} as const;

export const FONT_SIZES = {
  normal: 11,
  selected: 12,
} as const;

export const BORDER_WIDTHS = {
  normal: 2,
  myPool: 3,
  selected: 4,
  dimmed: 1,
} as const;

export const EDGE_WIDTHS = {
  normal: 1.5,
  connected: 2,
  dimmed: 0.3,
} as const;

export const ARROW_SCALE_FACTORS = {
  normal: 0.8,
  connected: 1,
  dimmed: 0.3,
} as const;

export const OPACITY_VALUES = {
  normal: 1,
  dimmed: 0.1,
  veryDimmed: 0.05,
} as const;

export const ISOLATED_NODES_CONFIG = {
  radius: 800,
  disablePhysics: true,
} as const;
