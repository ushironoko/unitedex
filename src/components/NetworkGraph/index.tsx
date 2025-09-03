import type React from "react";
import { memo, useMemo, useLayoutEffect, useEffect } from "react";
import type { NetworkGraphProps } from "./types";
import { useNetworkInstance } from "./hooks/useNetworkInstance";
import { useDebouncedSelection } from "./hooks/useDebouncedSelection";
import { computeGraphState } from "./computeGraphState";

const NetworkGraph: React.FC<NetworkGraphProps> = memo(
  ({
    data,
    selectedPokemon,
    edgeFilter,
    roleFilter,
    showDirectConnectionsOnly,
  }) => {
    // 選択をデバウンス
    const debouncedSelection = useDebouncedSelection(selectedPokemon, 150);
    
    // ネットワークインスタンスを初期化（一度だけ）
    const { containerRef, network, nodesDataset, edgesDataset } = useNetworkInstance(data);
    
    // グラフ状態を純粋関数で計算
    const graphState = useMemo(
      () => computeGraphState(
        data,
        debouncedSelection,
        edgeFilter,
        roleFilter,
        showDirectConnectionsOnly
      ),
      [data, debouncedSelection, edgeFilter, roleFilter, showDirectConnectionsOnly]
    );
    
    // DataSetを更新（ネットワーク初期化後に実行）
    useEffect(() => {
      // ネットワークとデータセットが初期化されるまで待つ
      if (!nodesDataset.current || !edgesDataset.current || !network.current) {
        return;
      }
      
      // ノードを更新
      nodesDataset.current.clear();
      nodesDataset.current.add(graphState.nodes);
      
      // エッジを更新
      edgesDataset.current.clear();
      edgesDataset.current.add(graphState.edges);
      
      // 選択状態をリセット
      network.current.unselectAll();
      
      // 検索でマッチしたノードを選択
      if (debouncedSelection.length > 0) {
        const selectedNodeIds = graphState.nodes
          .filter(node => {
            // マッチしたノードを特定（size が selected のもの）
            return node.size === 20 && node.borderWidth === 4;
          })
          .map(node => node.id);
        
        if (selectedNodeIds.length > 0) {
          network.current.selectNodes(selectedNodeIds);
          
          // 初回のみフィット（前回と異なる選択の場合）
          const prevSelection = network.current.getSelectedNodes();
          const hasChanged = selectedNodeIds.length !== prevSelection.length || 
            !selectedNodeIds.every(id => prevSelection.includes(id));
          
          if (hasChanged) {
            setTimeout(() => {
              if (network.current) {
                network.current.fit({
                  nodes: selectedNodeIds,
                  animation: false,
                });
              }
            }, 100);
          }
        }
      }
    }, [graphState, debouncedSelection, network, nodesDataset, edgesDataset]);
    
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "750px",
        }}
      />
    );
  },
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;