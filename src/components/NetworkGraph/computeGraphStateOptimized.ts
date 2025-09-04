import type { PokemonData, Role } from "../../types";
import type { GraphState, NodeState, EdgeState } from "./types";
import { ROLE_COLORS, EDGE_COLORS, MY_POOL } from "./constants";

interface ComputeOptions {
  searchTerms: string[];
  edgeFilter: "all" | "advantage" | "disadvantage";
  roleFilter: Role[];
  showDirectConnectionsOnly: boolean;
  isInitialRender?: boolean;
}

interface NodeIndex {
  id: string;
  role: Role;
  label: string;
}

interface EdgeIndex {
  from: string;
  to: string;
  type: "advantage" | "disadvantage";
}

export class GraphStateComputer {
  private nodeIndex: Map<string, NodeIndex>;
  private edgesByNode: Map<string, Set<string>>;
  private edgeIndex: Map<string, EdgeIndex>;
  private myPoolSet: Set<string>;

  constructor(data: PokemonData) {
    this.nodeIndex = new Map(
      data.nodes.map((n) => [n.id, { id: n.id, role: n.role, label: n.label }]),
    );

    this.edgeIndex = new Map();
    this.edgesByNode = new Map();
    this.myPoolSet = new Set(MY_POOL);

    // エッジインデックスの構築
    for (const edge of data.edges) {
      const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
      this.edgeIndex.set(edgeId, edge);

      // ノード別のエッジリストを構築
      if (!this.edgesByNode.has(edge.from)) {
        this.edgesByNode.set(edge.from, new Set());
      }
      if (!this.edgesByNode.has(edge.to)) {
        this.edgesByNode.set(edge.to, new Set());
      }
      this.edgesByNode.get(edge.from)?.add(edgeId);
      this.edgesByNode.get(edge.to)?.add(edgeId);
    }
  }

  compute(options: ComputeOptions): GraphState {
    const {
      searchTerms,
      edgeFilter,
      roleFilter,
      showDirectConnectionsOnly,
      isInitialRender = false,
    } = options;

    // 高速化: 検索マッチングの最適化
    const matchingNodeIds = this.findMatchingNodes(searchTerms);
    const hasSearch = searchTerms.length > 0;
    const noSearchResults = hasSearch && matchingNodeIds.size === 0;

    // 高速化: 接続ノードの探索を最適化
    const { connectedNodeIds, connectedEdgeIds } = this.findConnectedNodes(
      matchingNodeIds,
      hasSearch,
      noSearchResults,
      showDirectConnectionsOnly,
    );

    // ロールフィルタの事前計算
    const roleFilterSet = new Set(roleFilter);
    const isRoleFilterActive = roleFilter.length > 0 && roleFilter.length < 5;

    // ノード状態の計算
    const nodes = this.computeNodeStates(
      matchingNodeIds,
      connectedNodeIds,
      roleFilterSet,
      isRoleFilterActive,
      hasSearch,
      noSearchResults,
      isInitialRender,
    );

    // エッジ状態の計算
    const edges = this.computeEdgeStates(
      connectedEdgeIds,
      roleFilterSet,
      isRoleFilterActive,
      edgeFilter,
      hasSearch,
      noSearchResults,
    );

    return { nodes, edges };
  }

  private findMatchingNodes(searchTerms: string[]): Set<string> {
    if (searchTerms.length === 0) return new Set();

    const matching = new Set<string>();
    const lowerSearchTerms = searchTerms.map((t) => t.toLowerCase());

    for (const [id, node] of this.nodeIndex) {
      const labelLower = node.label.toLowerCase();
      const idLower = id.toLowerCase();

      for (const term of lowerSearchTerms) {
        if (labelLower.includes(term) || idLower.includes(term)) {
          matching.add(id);
          break;
        }
      }
    }

    return matching;
  }

  private findConnectedNodes(
    matchingNodeIds: Set<string>,
    hasSearch: boolean,
    noSearchResults: boolean,
    showDirectConnectionsOnly: boolean,
  ): { connectedNodeIds: Set<string>; connectedEdgeIds: Set<string> } {
    if (!hasSearch || noSearchResults) {
      return { connectedNodeIds: new Set(), connectedEdgeIds: new Set() };
    }

    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    // 直接接続の高速検索
    for (const nodeId of matchingNodeIds) {
      const edges = this.edgesByNode.get(nodeId);
      if (!edges) continue;

      for (const edgeId of edges) {
        const edge = this.edgeIndex.get(edgeId);
        if (!edge) continue;
        
        // マッチしたノードから直接つながるエッジを追加
        connectedEdgeIds.add(edgeId);

        // 接続先のノードを追加
        if (edge.from === nodeId) {
          connectedNodeIds.add(edge.to);
        } else {
          connectedNodeIds.add(edge.from);
        }
      }
    }

    // 二次接続（直接接続のみモードでない場合）
    if (!showDirectConnectionsOnly) {
      // 一次接続ノードのコピーを作成してイテレート（元のSetへの追加を避ける）
      const firstLevelConnected = new Set(connectedNodeIds);
      
      // 二次接続ノードとエッジの収集
      for (const nodeId of firstLevelConnected) {
        // マッチしたノード自身はスキップ
        if (matchingNodeIds.has(nodeId)) continue;

        const edges = this.edgesByNode.get(nodeId);
        if (!edges) continue;

        for (const edgeId of edges) {
          const edge = this.edgeIndex.get(edgeId);
          if (!edge) continue;
          
          const otherNode = edge.from === nodeId ? edge.to : edge.from;

          // まだ含まれていないノードを二次接続として追加
          if (!matchingNodeIds.has(otherNode) && !firstLevelConnected.has(otherNode)) {
            connectedNodeIds.add(otherNode);
            connectedEdgeIds.add(edgeId);
          }
        }
      }
      
      // 表示されるノード間のエッジをすべて収集
      const visibleNodes = new Set([...matchingNodeIds, ...connectedNodeIds]);
      for (const [edgeId, edge] of this.edgeIndex) {
        // すでに追加済みのエッジはスキップ
        if (connectedEdgeIds.has(edgeId)) continue;
        
        // 両端が表示ノードに含まれるエッジを追加
        if (visibleNodes.has(edge.from) && visibleNodes.has(edge.to)) {
          connectedEdgeIds.add(edgeId);
        }
      }
    }

    return { connectedNodeIds, connectedEdgeIds };
  }

  private computeNodeStates(
    matchingNodeIds: Set<string>,
    connectedNodeIds: Set<string>,
    roleFilterSet: Set<Role>,
    isRoleFilterActive: boolean,
    hasSearch: boolean,
    noSearchResults: boolean,
    isInitialRender: boolean,
  ): NodeState[] {
    const nodes: NodeState[] = [];
    let index = 0;
    const gridSize = Math.ceil(Math.sqrt(this.nodeIndex.size));
    const spacing = 300;
    const jitter = 100;

    for (const [id, node] of this.nodeIndex) {
      const isMatching = matchingNodeIds.has(id);
      const isConnected = connectedNodeIds.has(id);
      const isRoleFiltered =
        isRoleFilterActive && !roleFilterSet.has(node.role);
      const isMyPool = this.myPoolSet.has(id);

      // デフォルト値
      let hidden = false;
      const opacity = 1;
      let size = 15;
      let borderWidth = isMyPool ? 3 : 2;
      const color = {
        background: ROLE_COLORS[node.role] || "#999",
        border: isMyPool ? "#FFD700" : "#333",
      };
      const font = {
        color: "#000",
        size: 11,
        bold: isMyPool ? "bold" : undefined,
        strokeWidth: 2,
        strokeColor: "#fff",
        vadjust: -20,
      };

      // 表示状態の決定（簡略化）
      if (!hasSearch) {
        hidden = isRoleFiltered;
      } else if (!noSearchResults) {
        if (isRoleFiltered) {
          hidden = true;
        } else if (isMatching) {
          size = 20;
          borderWidth = 4;
          color.border = "#FFD700";
          font.size = 12;
          font.bold = "bold";
        } else if (isConnected) {
          // 接続ノードは通常表示
          // デフォルト値のまま
        } else {
          // マッチしていないし、接続もされていないノードは完全に非表示
          hidden = true;
        }
      }

      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      nodes.push({
        id,
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
        ...(isInitialRender
          ? {}
          : {
              x:
                col * spacing -
                (gridSize * spacing) / 2 +
                (Math.random() - 0.5) * jitter,
              y:
                row * spacing -
                (gridSize * spacing) / 2 +
                (Math.random() - 0.5) * jitter,
            }),
      });

      index++;
    }

    return nodes;
  }

  private computeEdgeStates(
    connectedEdgeIds: Set<string>,
    roleFilterSet: Set<Role>,
    isRoleFilterActive: boolean,
    edgeFilter: "all" | "advantage" | "disadvantage",
    hasSearch: boolean,
    noSearchResults: boolean,
  ): EdgeState[] {
    const edges: EdgeState[] = [];

    for (const [edgeId, edge] of this.edgeIndex) {
      const fromNode = this.nodeIndex.get(edge.from);
      const toNode = this.nodeIndex.get(edge.to);

      const isEdgeTypeFiltered =
        edgeFilter !== "all" && edge.type !== edgeFilter;
      const isRoleFiltered =
        isRoleFilterActive &&
        ((fromNode && !roleFilterSet.has(fromNode.role)) ||
          (toNode && !roleFilterSet.has(toNode.role)));

      const isConnected =
        !hasSearch || noSearchResults || connectedEdgeIds.has(edgeId);

      let hidden = isEdgeTypeFiltered;
      const opacity = 1;
      const width = 1.5;
      const arrowScale = 0.8;
      const color: string = EDGE_COLORS[edge.type];

      if (!hasSearch) {
        // 検索がない場合は、エッジタイプとロールフィルタのみ適用
        hidden = Boolean(hidden || isRoleFiltered);
      } else if (!noSearchResults) {
        // 検索があり結果がある場合
        if (isRoleFiltered) {
          hidden = true;
        } else if (!isConnected) {
          // 接続されていないエッジは完全に非表示にする
          hidden = true;
        }
      }
      // noSearchResults の場合（検索結果が0件）は、
      // すべてのエッジを通常表示（エッジタイプフィルタのみ適用）

      edges.push({
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
      });
    }

    return edges;
  }
}

// 互換性のための関数エクスポート
export function computeGraphState(
  data: PokemonData,
  searchTerms: string[],
  edgeFilter: "all" | "advantage" | "disadvantage",
  roleFilter: Role[],
  showDirectConnectionsOnly: boolean,
  isInitialRender = false,
): GraphState {
  const computer = new GraphStateComputer(data);
  return computer.compute({
    searchTerms,
    edgeFilter,
    roleFilter,
    showDirectConnectionsOnly,
    isInitialRender,
  });
}
