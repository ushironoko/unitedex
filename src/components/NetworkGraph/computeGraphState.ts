import type { PokemonData, Role } from "../../types";
import { ROLE_COLORS, EDGE_COLORS, MY_POOL } from "../../utils/constants";

interface NodeState {
  id: string;
  label: string;
  hidden: boolean;
  opacity: number;
  size: number;
  color: {
    background: string;
    border: string;
  };
  borderWidth: number;
  font: {
    color: string;
    size: number;
    bold?: string | undefined;
    strokeWidth: number;
    strokeColor: string;
    vadjust: number;
  };
}

interface EdgeState {
  id: string;
  from: string;
  to: string;
  hidden: boolean;
  color: {
    color: string;
    opacity: number;
  };
  width: number;
  arrows: {
    to: {
      enabled: boolean;
      scaleFactor: number;
    };
  };
}

interface GraphState {
  nodes: NodeState[];
  edges: EdgeState[];
}

// ノードが検索条件にマッチするかチェック
function isNodeMatchingSearch(
  node: { id: string; label: string },
  searchTerm: string,
): boolean {
  const trimmedSearch = searchTerm.trim();

  if (!trimmedSearch) return false;

  // 完全一致
  if (node.label === trimmedSearch) return true;
  if (node.id.toLowerCase() === trimmedSearch.toLowerCase()) return true;

  // 括弧が含まれている場合（技の検索）
  if (trimmedSearch.includes("(") || trimmedSearch.includes("（")) {
    return node.label.includes(trimmedSearch);
  }

  // ベースポケモンの検索
  const baseId = node.id.split("_")[0];
  if (baseId.toLowerCase() === trimmedSearch.toLowerCase()) return true;

  const baseLabel = node.label.split("(")[0].trim();
  if (baseLabel === trimmedSearch) return true;
  if (node.label.includes(trimmedSearch)) return true;

  return false;
}

// 統合されたグラフ状態計算関数
export function computeGraphState(
  data: PokemonData,
  searchTerms: string[],
  edgeFilter: "all" | "advantage" | "disadvantage",
  roleFilter: Role[],
  showDirectConnectionsOnly: boolean,
): GraphState {
  // 1. 検索によるマッチングノードの特定
  const matchingNodeIds = new Set<string>();
  const hasSearch = searchTerms.length > 0;

  if (hasSearch) {
    for (const node of data.nodes) {
      for (const searchTerm of searchTerms) {
        if (isNodeMatchingSearch(node, searchTerm)) {
          matchingNodeIds.add(node.id);
          break;
        }
      }
    }
  }

  // 検索があるが結果が0件の場合、全ノードを通常表示
  const noSearchResults = hasSearch && matchingNodeIds.size === 0;

  // 2. 接続ノードの特定（検索結果がある場合のみ）
  const connectedNodeIds = new Set<string>();
  const connectedEdgeIds = new Set<string>();

  if (hasSearch && !noSearchResults) {
    // 直接接続
    for (const edge of data.edges) {
      if (matchingNodeIds.has(edge.from)) {
        connectedNodeIds.add(edge.to);
        connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
      }
      if (matchingNodeIds.has(edge.to)) {
        connectedNodeIds.add(edge.from);
        connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
      }
    }

    // 二次接続（オプション）
    if (!showDirectConnectionsOnly) {
      const firstLevelConnected = new Set([
        ...matchingNodeIds,
        ...connectedNodeIds,
      ]);
      for (const edge of data.edges) {
        if (
          firstLevelConnected.has(edge.from) &&
          !matchingNodeIds.has(edge.from)
        ) {
          connectedNodeIds.add(edge.to);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
        if (firstLevelConnected.has(edge.to) && !matchingNodeIds.has(edge.to)) {
          connectedNodeIds.add(edge.from);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }
    }
  }

  // 3. ロールフィルタの適用
  const isRoleFilterActive = roleFilter.length > 0 && roleFilter.length < 5;

  // 4. ノード状態の計算
  const nodes: NodeState[] = data.nodes.map((node, index) => {
    const isMatching = matchingNodeIds.has(node.id);
    const isConnected = connectedNodeIds.has(node.id);
    const isRoleFiltered =
      isRoleFilterActive && !roleFilter.includes(node.role);

    // 表示状態の決定
    let hidden = false;
    let opacity = 1;
    let size = 15;
    let borderWidth = MY_POOL.includes(node.id) ? 3 : 2;
    let color = {
      background: ROLE_COLORS[node.role] || "#999",
      border: MY_POOL.includes(node.id) ? "#FFD700" : "#333",
    };
    let font = {
      color: "#000",
      size: 11,
      bold: MY_POOL.includes(node.id) ? "bold" : undefined,
      strokeWidth: 2,
      strokeColor: "#fff",
      vadjust: -20,
    };

    // 検索がない場合
    if (!hasSearch) {
      // ロールフィルタのみ適用
      hidden = isRoleFiltered;
    }
    // 検索があり、結果が0件の場合
    else if (noSearchResults) {
      // 全て通常表示（ロールフィルタも無視）
      hidden = false;
    }
    // 検索があり、結果がある場合
    else {
      // ロールフィルタと検索結果の両方を考慮
      if (isRoleFiltered) {
        hidden = true;
      } else if (isMatching) {
        // マッチしたノードは強調
        size = 20;
        borderWidth = 4;
        color.border = "#FFD700";
        font.size = 12;
        font.bold = "bold";
      } else if (isConnected) {
        // 接続ノードは通常表示
        // デフォルト値のまま
      } else {
        // その他は薄く表示
        opacity = 0.1;
        color = {
          background: `${ROLE_COLORS[node.role] || "#999"}15`,
          border: "#33333315",
        };
        borderWidth = 1;
        font = {
          color: "#00000015",
          size: 11,
          bold: undefined,
          strokeWidth: 1,
          strokeColor: "#ffffff15",
          vadjust: -20,
        };
      }
    }

    // 初期位置をランダムに設定（グリッド状に配置）
    const gridSize = Math.ceil(Math.sqrt(data.nodes.length));
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const spacing = 300; // ノード間の間隔を広げる
    const jitter = 100; // ランダムなズレを大きくする

    const nodeState: NodeState & { x?: number; y?: number } = {
      id: node.id,
      label: node.label,
      hidden,
      opacity,
      size,
      color,
      borderWidth,
      font: {
        ...font,
        bold: font.bold || undefined,
      },
      // 初期位置（グリッド配置 + ランダムな揺らぎ）
      x:
        col * spacing -
        (gridSize * spacing) / 2 +
        (Math.random() - 0.5) * jitter,
      y:
        row * spacing -
        (gridSize * spacing) / 2 +
        (Math.random() - 0.5) * jitter,
    };

    return nodeState;
  });

  // 5. エッジ状態の計算
  const edges: EdgeState[] = data.edges.map((edge) => {
    const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
    const fromNode = data.nodes.find((n) => n.id === edge.from);
    const toNode = data.nodes.find((n) => n.id === edge.to);

    // エッジフィルタ
    const isEdgeTypeFiltered = edgeFilter !== "all" && edge.type !== edgeFilter;

    // ロールフィルタ
    const isRoleFiltered =
      isRoleFilterActive &&
      ((fromNode && !roleFilter.includes(fromNode.role)) ||
        (toNode && !roleFilter.includes(toNode.role)));

    // 検索による接続状態
    const isConnected =
      !hasSearch || noSearchResults || connectedEdgeIds.has(edgeId);

    // 表示状態の決定
    let hidden = isEdgeTypeFiltered;
    let opacity = 1;
    let width = 1.5;
    let arrowScale = 0.8;
    let color = EDGE_COLORS[edge.type];

    // 検索がない場合
    if (!hasSearch) {
      hidden = Boolean(hidden || isRoleFiltered);
    }
    // 検索があり、結果が0件の場合
    else if (noSearchResults) {
      // エッジフィルタのみ適用（ロールフィルタは無視）
      // hidden = isEdgeTypeFiltered（既に設定済み）
    }
    // 検索があり、結果がある場合
    else {
      if (isRoleFiltered) {
        hidden = true;
      } else if (!isConnected) {
        // 非接続エッジは薄く表示
        opacity = 0.05;
        width = 0.3;
        arrowScale = 0.3;
        color = `${EDGE_COLORS[edge.type]}0A`;
      }
    }

    return {
      id: edgeId,
      from: edge.from,
      to: edge.to,
      hidden,
      color: {
        color,
        opacity,
      },
      width,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: arrowScale,
        },
      },
    };
  });

  return { nodes, edges };
}
