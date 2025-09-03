import { useEffect, useRef } from "react";
import type { NetworkRefs } from "../types";
import type { PokemonData, Role } from "../../../types";
import { FOCUS_ANIMATION } from "../constants";
import {
  getMatchingNodes,
  getConnectedElementIds,
  createNodeUpdateData,
  createEdgeUpdateData,
  createResetNodeData,
  createResetEdgeData,
} from "../utils";

export const useNodeSelection = (
  refs: NetworkRefs,
  data: PokemonData,
  selectedPokemon: string[],
  showDirectConnectionsOnly: boolean,
  roleFilter: Role[],
) => {
  // 前回の選択状態を保持
  const prevSelectedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (
      !refs.networkRef.current ||
      !refs.nodesDatasetRef.current ||
      !refs.edgesDatasetRef.current
    )
      return;

    if (!data || !data.nodes || data.nodes.length === 0) return;

    // 選択されたポケモンがない場合、全てを通常表示に戻す
    if (selectedPokemon.length === 0) {
      refs.nodesDatasetRef.current.update(
        data.nodes.map((node) => createResetNodeData(node)),
      );

      if (refs.edgesDatasetRef.current) {
        refs.edgesDatasetRef.current.update(
          data.edges.map((edge) => createResetEdgeData(edge)),
        );
      }

      refs.networkRef.current.unselectAll();
      return;
    }

    // マッチするノードを検索
    const matchingNodes = getMatchingNodes(selectedPokemon, data.nodes);

    // マッチするノードがない場合、全てを薄く表示
    if (matchingNodes.length === 0) {
      refs.nodesDatasetRef.current.update(
        data.nodes.map((node) => ({
          id: node.id,
          hidden: false,
          opacity: 0.1,
          color: {
            background: `${node.role}15`,
            border: "#33333315",
          },
          borderWidth: 1,
          size: 15,
          font: {
            color: "#00000015",
            size: 11,
            strokeWidth: 1,
            strokeColor: "#ffffff15",
            vadjust: -20,
          },
        })),
      );

      if (refs.edgesDatasetRef.current) {
        refs.edgesDatasetRef.current.update(
          data.edges.map((edge) => ({
            id: `${edge.from}-${edge.to}-${edge.type}`,
            hidden: false,
            color: {
              color: "#00000010",
              opacity: 0.05,
            },
            width: 0.3,
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.3,
              },
            },
          })),
        );
      }
      return;
    }

    const matchingNodeIds = new Set(
      matchingNodes.map((n) => n?.id).filter(Boolean) as string[],
    );

    // 接続されたノードとエッジを特定
    const { connectedNodeIds, connectedEdgeIds } = getConnectedElementIds(
      matchingNodeIds,
      data.edges,
      showDirectConnectionsOnly,
    );

    // ロールフィルタの適用チェック
    const isRoleFilterActive = roleFilter.length > 0 && roleFilter.length < 5;

    // ノードの外観を更新
    refs.nodesDatasetRef.current.update(
      data.nodes.map((node) => {
        const isSelected = matchingNodeIds.has(node.id);
        const isConnected = connectedNodeIds.has(node.id);
        const isRoleFiltered =
          isRoleFilterActive && !roleFilter.includes(node.role);

        return createNodeUpdateData(
          node,
          isSelected,
          isConnected,
          isRoleFiltered,
        );
      }),
    );

    // エッジの外観を更新
    refs.edgesDatasetRef.current.update(
      data.edges.map((edge) => {
        const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
        const isConnected = connectedEdgeIds.has(edgeId);

        // エッジの両端のノードを取得してロールフィルタを適用
        const fromNode = data.nodes.find((n) => n.id === edge.from);
        const toNode = data.nodes.find((n) => n.id === edge.to);
        const isRoleFiltered =
          isRoleFilterActive &&
          ((fromNode && !roleFilter.includes(fromNode.role)) ||
            (toNode && !roleFilter.includes(toNode.role)));

        return createEdgeUpdateData(edge, isConnected, Boolean(isRoleFiltered));
      }),
    );

    // 選択されたノードにフォーカス
    if (matchingNodeIds.size > 0) {
      try {
        refs.networkRef.current.selectNodes(Array.from(matchingNodeIds));

        // 初回選択時のみフィット（頻繁なフィットを避ける）
        const currentSelected = new Set(matchingNodeIds);
        const hasSelectionChanged = 
          prevSelectedRef.current.size !== currentSelected.size ||
          ![...currentSelected].every(id => prevSelectedRef.current.has(id));
        
        if (hasSelectionChanged) {
          prevSelectedRef.current = currentSelected;
          
          // DOMの更新完了を待ってからフィット
          setTimeout(() => {
            if (!refs.networkRef.current || !refs.nodesDatasetRef.current) return;

            if (connectedNodeIds.size > 0) {
              // データセットに存在するノードのみを対象にフィット
              const existingNodes = Array.from(connectedNodeIds).filter(
                (nodeId) => {
                  try {
                    const node = refs.nodesDatasetRef.current?.get(nodeId);
                    return node !== null && node !== undefined;
                  } catch {
                    return false;
                  }
                },
              );

              if (existingNodes.length > 0) {
                try {
                  // アニメーションを無効化して即座にフィット
                  refs.networkRef.current.fit({
                    nodes: existingNodes,
                    animation: false, // アニメーションを無効化
                  });
                } catch (fitError) {
                  console.error("Error in fit operation:", fitError);
                }
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error selecting nodes:", error);
      }
    }
  }, [selectedPokemon, data, showDirectConnectionsOnly, roleFilter, refs]);
};
