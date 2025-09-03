import { useEffect } from "react";
import type { NetworkRefs } from "../types";
import type { PokemonData } from "../../../types";
import { EDGE_COLORS } from "../../../utils/constants";
import { getMatchingNodes } from "../utils";
import { EDGE_WIDTHS, ARROW_SCALE_FACTORS, OPACITY_VALUES } from "../constants";

export const useEdgeFilter = (
  refs: NetworkRefs,
  data: PokemonData,
  selectedPokemon: string[],
  edgeFilter: "all" | "advantage" | "disadvantage",
) => {
  useEffect(() => {
    if (!refs.edgesDatasetRef.current || !refs.nodesDatasetRef.current) return;

    const allEdges = data.edges;
    let filteredEdges = allEdges;

    // エッジタイプフィルタを適用
    if (edgeFilter !== "all") {
      filteredEdges = allEdges.filter((edge) => edge.type === edgeFilter);
    }

    // 選択されたポケモンがある場合、どのエッジをハイライトするかを決定
    const connectedEdgeIds = new Set<string>();
    if (selectedPokemon.length > 0) {
      const matchingNodes = getMatchingNodes(selectedPokemon, data.nodes);
      const matchingNodeIds = new Set(
        matchingNodes.map((n) => n?.id).filter(Boolean) as string[],
      );

      // 接続されたエッジを特定
      for (const edge of filteredEdges) {
        if (matchingNodeIds.has(edge.from) || matchingNodeIds.has(edge.to)) {
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }
    }

    // エッジを適切なスタイルで更新
    refs.edgesDatasetRef.current.clear();
    refs.edgesDatasetRef.current.add(
      filteredEdges.map((edge) => {
        const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
        const isConnected =
          selectedPokemon.length === 0 || connectedEdgeIds.has(edgeId);

        return {
          id: edgeId,
          from: edge.from,
          to: edge.to,
          color: {
            color: isConnected
              ? EDGE_COLORS[edge.type]
              : `${EDGE_COLORS[edge.type]}0A`,
            highlight: EDGE_COLORS[edge.type],
            opacity: isConnected
              ? OPACITY_VALUES.normal
              : OPACITY_VALUES.veryDimmed,
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: isConnected
                ? ARROW_SCALE_FACTORS.normal
                : ARROW_SCALE_FACTORS.dimmed,
            },
          },
          width: isConnected ? EDGE_WIDTHS.normal : EDGE_WIDTHS.dimmed,
          type: edge.type,
        };
      }),
    );
  }, [edgeFilter, data, selectedPokemon, refs]);
};
