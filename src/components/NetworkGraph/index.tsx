import React, { memo } from "react";
import type { NetworkGraphProps } from "./types";
import { useNetwork } from "./hooks/useNetwork";
import { useNodeSelection } from "./hooks/useNodeSelection";
import { useEdgeFilter } from "./hooks/useEdgeFilter";
import { useRoleFilter } from "./hooks/useRoleFilter";
import { useDebouncedSelection } from "./hooks/useDebouncedSelection";

const NetworkGraph: React.FC<NetworkGraphProps> = memo(({
  data,
  selectedPokemon,
  edgeFilter,
  roleFilter,
  showDirectConnectionsOnly,
}) => {
  // 選択をデバウンス
  const debouncedSelection = useDebouncedSelection(selectedPokemon, 150);
  
  // ネットワークを初期化し、refを取得
  const refs = useNetwork(data);

  // 各フィルタリング機能を適用（デバウンスされた選択を使用）
  useNodeSelection(
    refs,
    data,
    debouncedSelection,
    showDirectConnectionsOnly,
    roleFilter,
  );
  useEdgeFilter(refs, data, debouncedSelection, edgeFilter);
  useRoleFilter(refs, data, debouncedSelection, roleFilter);

  return (
    <div
      ref={refs.containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "750px",
      }}
    />
  );
});

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
