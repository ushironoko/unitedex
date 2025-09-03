import { useEffect } from "react";
import type { NetworkRefs } from "../types";
import type { PokemonData, Role } from "../../../types";

export const useRoleFilter = (
  refs: NetworkRefs,
  data: PokemonData,
  selectedPokemon: string[],
  roleFilter: Role[],
) => {
  useEffect(() => {
    if (!refs.nodesDatasetRef.current) return;

    // 検索がアクティブな場合、ロールフィルタは検索結果内で適用される
    // （検索がない場合のみここで処理）
    if (selectedPokemon.length > 0) {
      return;
    }

    const allNodes = data.nodes;
    let visibleNodeIds: string[];

    // ロールフィルタが未設定または全ロール選択の場合は全て表示
    if (roleFilter.length === 0 || roleFilter.length === 5) {
      visibleNodeIds = allNodes.map((n) => n.id);
    } else {
      visibleNodeIds = allNodes
        .filter((node) => roleFilter.includes(node.role))
        .map((n) => n.id);
    }

    // ノードの可視性を更新
    refs.nodesDatasetRef.current.update(
      allNodes.map((node) => ({
        id: node.id,
        hidden: !visibleNodeIds.includes(node.id),
      })),
    );

    // エッジの可視性を更新
    if (refs.edgesDatasetRef.current) {
      const allEdges = refs.edgesDatasetRef.current.get();
      refs.edgesDatasetRef.current.update(
        allEdges.map((edge) => ({
          id: edge.id,
          hidden:
            !visibleNodeIds.includes(edge.from) ||
            !visibleNodeIds.includes(edge.to),
        })),
      );
    }
  }, [roleFilter, data, selectedPokemon, refs]);
};
