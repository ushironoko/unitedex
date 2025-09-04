export const NETWORK_OPTIONS = {
  physics: {
    enabled: true, // 物理シミュレーションの有効/無効
    forceAtlas2Based: {
      gravitationalConstant: -50, // ノード間の斥力の強さ（負の値で反発）- より強い反発力で分散
      centralGravity: 0.01, // 中心への引力の強さ - 弱めて分散を促進
      springLength: 200, // エッジの理想的な長さ - より長くして距離を確保
      springConstant: 0.02, // エッジのバネの強さ - やや強めてエッジ接続を維持
      damping: 0.4, // 動きの減衰率（0-1、高いほど早く安定）- 自然な動きのため減少
      avoidOverlap: 1, // ノードの重なり回避の強さ
    },
    maxVelocity: 20, // ノードの最大速度
    minVelocity: 1, // 安定化判定の最小速度閾値
    solver: "forceAtlas2Based" as const, // 使用する物理エンジンのアルゴリズム
    stabilization: {
      enabled: true, // 初期配置時の安定化処理の有効/無効
      iterations: 200, // 安定化のための最大反復回数 - より長く計算して適切な配置を実現
      updateInterval: 25, // 安定化進捗更新の間隔（ミリ秒）- より頻繁に更新
      onlyDynamicEdges: false, // 動的エッジのみを安定化対象にするか
      fit: true, // 安定化後に全ノードが見えるようにフィットするか
    },
    timestep: 0.5, // シミュレーションの時間ステップ
    adaptiveTimestep: false, // 時間ステップの自動調整
  },
  interaction: {
    hover: false, // ホバー機能の有効/無効（パフォーマンス向上のため無効化）
    tooltipDelay: 300, // ツールチップ表示までの遅延（ミリ秒）
    hideEdgesOnDrag: true, // ドラッグ中にエッジを非表示にするか
    navigationButtons: true, // ナビゲーションボタンの表示
    keyboard: {
      enabled: false, // キーボード操作の有効/無効
    },
    zoomView: true, // ズーム機能の有効/無効
    zoomSpeed: 1, // ズームの速度（1が標準）
  },
  layout: {
    improvedLayout: false, // レイアウト改善機能の有効/無効
    clusterThreshold: 150, // クラスタリングの閾値
  },
  nodes: {
    shape: "dot" as const, // ノードの形状
    scaling: {
      min: 5, // ノードの最小サイズ
      max: 15, // ノードの最大サイズ
    },
    mass: 1.5, // ノードの質量（物理シミュレーションで使用）
  },
  edges: {
    smooth: {
      enabled: true, // エッジの曲線化の有効/無効
      type: "continuous" as const, // 曲線の種類
      roundness: 0.5, // 曲線の丸み（0-1）
    },
  },
} as const;

export const FOCUS_ANIMATION = {
  duration: 500, // アニメーションの継続時間（ミリ秒）
  easingFunction: "easeInOutQuad", // アニメーションのイージング関数
} as const;

export const NODE_SIZES = {
  normal: 5, // 通常状態のノードサイズ
  selected: 10, // 選択状態のノードサイズ
} as const;

export const FONT_SIZES = {
  normal: 11, // 通常状態のフォントサイズ
  selected: 12, // 選択状態のフォントサイズ
} as const;

export const BORDER_WIDTHS = {
  normal: 2, // 通常状態のボーダー幅
  myPool: 3, // 自分のポケモンプール内のノードのボーダー幅
  selected: 4, // 選択状態のボーダー幅
  dimmed: 1, // 薄暗い状態のボーダー幅
} as const;

export const EDGE_WIDTHS = {
  normal: 1.5, // 通常状態のエッジ幅
  connected: 2, // 接続されている状態のエッジ幅
  dimmed: 0.3, // 薄暗い状態のエッジ幅
} as const;

export const ARROW_SCALE_FACTORS = {
  normal: 0.8, // 通常状態の矢印スケール係数
  connected: 1, // 接続されている状態の矢印スケール係数
  dimmed: 0.3, // 薄暗い状態の矢印スケール係数
} as const;

export const OPACITY_VALUES = {
  normal: 1, // 通常状態の不透明度
  dimmed: 0.1, // 薄暗い状態の不透明度
  veryDimmed: 0.05, // 非常に薄暗い状態の不透明度
} as const;

export const ISOLATED_NODES_CONFIG = {
  radius: 500, // 孤立ノードを配置する円の半径
  disablePhysics: true, // 孤立ノードの物理シミュレーション無効化
} as const;

export const ROLE_COLORS: Record<string, string> = {
  タンク: "#2ca45aff",
  サポート: "#F4D03F",
  メイジ: "#FF6B6B",
  アサシン: "#3486c9ff",
  ファイター: "#a945d1ff",
};

export const EDGE_COLORS = {
  advantage: "#4CAF50",
  disadvantage: "#F44336",
} as const;

export const MY_POOL: string[] = [];
