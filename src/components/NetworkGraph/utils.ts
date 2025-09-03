import type { Role, EdgeType } from "../../types";
import { EDGE_COLORS, MY_POOL, ROLE_COLORS } from "../../utils/constants";
import type { NodeData, EdgeData } from "./types";
import {
  NODE_SIZES,
  FONT_SIZES,
  BORDER_WIDTHS,
  EDGE_WIDTHS,
  ARROW_SCALE_FACTORS,
  OPACITY_VALUES,
} from "./constants";

/**
 * ノードが検索条件にマッチするかをチェック
 */
export const isNodeMatchingSearch = (
  node: { id: string; label: string },
  searchTerm: string,
): boolean => {
  const trimmedSearch = searchTerm.trim();

  // 空文字やスペースのみの場合はfalse
  if (!trimmedSearch) return false;

  // 完全一致をチェック（技バリエーションを含む）
  if (node.label === trimmedSearch) return true;
  if (node.id.toLowerCase() === trimmedSearch.toLowerCase()) return true;

  // 括弧が含まれている場合（特定の技を検索）
  if (trimmedSearch.includes("(") || trimmedSearch.includes("（")) {
    return node.label.includes(trimmedSearch);
  }

  // ベースポケモンの検索（括弧なし）
  const baseId = node.id.split("_")[0];
  if (baseId.toLowerCase() === trimmedSearch.toLowerCase()) return true;

  const baseLabel = node.label.split("(")[0].trim();
  if (baseLabel === trimmedSearch) return true;
  if (node.label.includes(trimmedSearch)) return true;

  return false;
};

/**
 * 選択されたポケモンに基づいてマッチするノードを取得
 */
export const getMatchingNodes = (
  selectedPokemon: string[],
  nodes: { id: string; label: string }[],
) => {
  return selectedPokemon
    .flatMap((searchTerm) => {
      return nodes.filter((node) => isNodeMatchingSearch(node, searchTerm));
    })
    .filter(
      (node, index, self) =>
        // 重複を除去
        self.findIndex((n) => n.id === node.id) === index,
    );
};

/**
 * 接続されているノードとエッジのIDを取得
 */
export const getConnectedElementIds = (
  matchingNodeIds: Set<string>,
  edges: { from: string; to: string; type: EdgeType }[],
  showDirectConnectionsOnly: boolean,
) => {
  const connectedNodeIds = new Set(matchingNodeIds);
  const connectedEdgeIds = new Set<string>();

  // 直接接続されたノードとエッジを追加
  for (const edge of edges) {
    if (matchingNodeIds.has(edge.from)) {
      connectedNodeIds.add(edge.to);
      connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
    }
    if (matchingNodeIds.has(edge.to)) {
      connectedNodeIds.add(edge.from);
      connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
    }
  }

  // 直接接続のみの場合はここで終了
  if (showDirectConnectionsOnly) {
    return { connectedNodeIds, connectedEdgeIds };
  }

  // 二次接続も含める
  const firstLevelConnected = new Set(connectedNodeIds);
  for (const edge of edges) {
    if (firstLevelConnected.has(edge.from) && !matchingNodeIds.has(edge.from)) {
      connectedNodeIds.add(edge.to);
      connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
    }
    if (firstLevelConnected.has(edge.to) && !matchingNodeIds.has(edge.to)) {
      connectedNodeIds.add(edge.from);
      connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
    }
  }

  return { connectedNodeIds, connectedEdgeIds };
};

/**
 * ノードデータを作成
 */
export const createNodeData = (
  node: { id: string; label: string; role: Role },
  _index: number,
  _totalNodes: number,
  _connectedNodes: Set<string>,
): NodeData => {
  const nodeData: NodeData = {
    id: node.id,
    label: node.label,
    color: {
      background: ROLE_COLORS[node.role] || "#999",
      border: MY_POOL.includes(node.id) ? "#FFD700" : "#333",
    },
    borderWidth: MY_POOL.includes(node.id)
      ? BORDER_WIDTHS.myPool
      : BORDER_WIDTHS.normal,
    size: NODE_SIZES.normal,
    font: {
      color: "#000",
      size: FONT_SIZES.normal,
      bold: MY_POOL.includes(node.id) ? "bold" : undefined,
      strokeWidth: 2,
      strokeColor: "#fff",
      vadjust: -20,
    },
    role: node.role,
  };

  // 孤立ノードの位置固定を削除（forceAtlas2Basedアルゴリズムに任せる）
  // 輪っか状配置は物理エンジンの自然な配置を妨げるため無効化
  /*
  if (isIsolated) {
    const angle = (index / totalNodes) * Math.PI * 2;
    nodeData.x = Math.cos(angle) * ISOLATED_NODES_CONFIG.radius;
    nodeData.y = Math.sin(angle) * ISOLATED_NODES_CONFIG.radius;
    nodeData.physics = !ISOLATED_NODES_CONFIG.disablePhysics;
  }
  */

  return nodeData;
};

/**
 * エッジデータを作成
 */
export const createEdgeData = (edge: {
  from: string;
  to: string;
  type: EdgeType;
}): EdgeData => ({
  id: `${edge.from}-${edge.to}-${edge.type}`,
  from: edge.from,
  to: edge.to,
  color: {
    color: EDGE_COLORS[edge.type],
    highlight: EDGE_COLORS[edge.type],
  },
  arrows: {
    to: {
      enabled: true,
      scaleFactor: ARROW_SCALE_FACTORS.normal,
    },
  },
  width: EDGE_WIDTHS.normal,
  type: edge.type,
});

/**
 * ノードの外観を更新するためのデータを作成
 */
export const createNodeUpdateData = (
  node: { id: string; role: Role },
  isSelected: boolean,
  isConnected: boolean,
  isRoleFiltered: boolean,
) => {
  const isDimmed = !isSelected && !isConnected;

  return {
    id: node.id,
    hidden: isRoleFiltered,
    opacity: isDimmed ? OPACITY_VALUES.dimmed : OPACITY_VALUES.normal,
    color: {
      background: isDimmed
        ? `${ROLE_COLORS[node.role] || "#999"}15`
        : ROLE_COLORS[node.role] || "#999",
      border: isSelected
        ? "#FFD700"
        : MY_POOL.includes(node.id) && !isDimmed
          ? "#FFD700"
          : isDimmed
            ? "#33333315"
            : "#333",
    },
    borderWidth: isSelected
      ? BORDER_WIDTHS.selected
      : MY_POOL.includes(node.id) && !isDimmed
        ? BORDER_WIDTHS.myPool
        : isDimmed
          ? BORDER_WIDTHS.dimmed
          : BORDER_WIDTHS.normal,
    size: isSelected ? NODE_SIZES.selected : NODE_SIZES.normal,
    font: {
      color: isDimmed ? "#00000015" : "#000",
      size: isSelected ? FONT_SIZES.selected : FONT_SIZES.normal,
      bold: isSelected || MY_POOL.includes(node.id) ? "bold" : undefined,
      strokeWidth: isDimmed ? 1 : 2,
      strokeColor: isDimmed ? "#ffffff15" : "#fff",
      vadjust: -20,
    },
  };
};

/**
 * エッジの外観を更新するためのデータを作成
 */
export const createEdgeUpdateData = (
  edge: { from: string; to: string; type: EdgeType },
  isConnected: boolean,
  isRoleFiltered: boolean,
) => {
  const edgeId = `${edge.from}-${edge.to}-${edge.type}`;

  return {
    id: edgeId,
    hidden: isRoleFiltered,
    color: {
      color: isConnected
        ? EDGE_COLORS[edge.type]
        : `${EDGE_COLORS[edge.type]}0A`,
      opacity: isConnected ? OPACITY_VALUES.normal : OPACITY_VALUES.veryDimmed,
    },
    width: isConnected ? EDGE_WIDTHS.connected : EDGE_WIDTHS.dimmed,
    arrows: {
      to: {
        enabled: true,
        scaleFactor: isConnected
          ? ARROW_SCALE_FACTORS.connected
          : ARROW_SCALE_FACTORS.dimmed,
      },
    },
  };
};

/**
 * リセット時のノードデータを作成
 */
export const createResetNodeData = (node: {
  id: string;
  label?: string;
  role: Role;
}) => ({
  id: node.id,
  label: node.label || node.id,
  hidden: false,
  opacity: OPACITY_VALUES.normal,
  size: NODE_SIZES.normal,
  color: {
    background: ROLE_COLORS[node.role] || "#999",
    border: MY_POOL.includes(node.id) ? "#FFD700" : "#333",
  },
  borderWidth: MY_POOL.includes(node.id)
    ? BORDER_WIDTHS.myPool
    : BORDER_WIDTHS.normal,
  font: {
    color: "#000",
    size: FONT_SIZES.normal,
    bold: MY_POOL.includes(node.id) ? "bold" : undefined,
    strokeWidth: 2,
    strokeColor: "#fff",
    vadjust: -20,
  },
});

/**
 * リセット時のエッジデータを作成
 */
export const createResetEdgeData = (edge: {
  from: string;
  to: string;
  type: EdgeType;
}) => ({
  id: `${edge.from}-${edge.to}-${edge.type}`,
  from: edge.from,
  to: edge.to,
  hidden: false,
  color: {
    color: EDGE_COLORS[edge.type],
    opacity: OPACITY_VALUES.normal,
  },
  width: EDGE_WIDTHS.normal,
  arrows: {
    to: {
      enabled: true,
      scaleFactor: ARROW_SCALE_FACTORS.normal,
    },
  },
});
