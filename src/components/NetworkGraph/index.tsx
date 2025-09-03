import type React from "react";
import type { NetworkGraphProps } from "./types";
import { useNetwork } from "./hooks/useNetwork";
import { useNodeSelection } from "./hooks/useNodeSelection";
import { useEdgeFilter } from "./hooks/useEdgeFilter";
import { useRoleFilter } from "./hooks/useRoleFilter";

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  selectedPokemon,
  edgeFilter,
  roleFilter,
  showDirectConnectionsOnly,
}) => {
  // ネットワークを初期化し、refを取得
  const refs = useNetwork(data);

  // 各フィルタリング機能を適用
  useNodeSelection(
    refs,
    data,
    selectedPokemon,
    showDirectConnectionsOnly,
    roleFilter,
  );
  useEdgeFilter(refs, data, selectedPokemon, edgeFilter);
  useRoleFilter(refs, data, selectedPokemon, roleFilter);

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
};

export default NetworkGraph;
