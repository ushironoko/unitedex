import type React from "react";
import { memo, useMemo, useEffect, useRef } from "react";
import type { NetworkGraphProps, NodeState } from "./types";
import { useNetworkInstance } from "./hooks/useNetworkInstance";
import { useDebouncedSelection } from "./hooks/useDebouncedSelection";
import { useDifferentialUpdate } from "./hooks/useDifferentialUpdate";
import { GraphStateComputer } from "./computeGraphStateOptimized";

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

    // 初回レンダリングかどうかを追跡
    const isInitialRender = useRef(true);

    // GraphStateComputerのインスタンスをメモ化
    const graphComputer = useMemo(() => new GraphStateComputer(data), [data]);

    // ネットワークインスタンスを初期化（一度だけ）
    const { containerRef, network, nodesDataset, edgesDataset } =
      useNetworkInstance();

    // 差分更新用のフック
    const { diffNodes, diffEdges, applyNodeDiff, applyEdgeDiff } =
      useDifferentialUpdate();

    // グラフ状態を純粋関数で計算（最適化版を使用）
    const graphState = useMemo(
      () =>
        graphComputer.compute({
          searchTerms: debouncedSelection,
          edgeFilter,
          roleFilter,
          showDirectConnectionsOnly,
          isInitialRender: isInitialRender.current,
        }),
      [
        graphComputer,
        debouncedSelection,
        edgeFilter,
        roleFilter,
        showDirectConnectionsOnly,
      ],
    );

    // DataSetを差分更新（ネットワーク初期化後に実行）
    useEffect(() => {
      // ネットワークとデータセットが初期化されるまで待つ
      if (!nodesDataset.current || !edgesDataset.current || !network.current) {
        return;
      }

      if (isInitialRender.current) {
        // 初回のみadd()を使用（初期位置付きで追加）
        nodesDataset.current.add(graphState.nodes);
        edgesDataset.current.add(graphState.edges);
        isInitialRender.current = false;
      } else {
        // 2回目以降は差分更新を使用
        const nodeDiff = diffNodes(graphState.nodes);
        const edgeDiff = diffEdges(graphState.edges);

        // バッチ更新を有効化
        const hasNodeChanges = applyNodeDiff(
          nodesDataset.current,
          nodeDiff,
          true,
        );
        const hasEdgeChanges = applyEdgeDiff(edgesDataset.current, edgeDiff);

        // 変更があった場合のみ物理エンジンを一時的に無効化
        if (hasNodeChanges || hasEdgeChanges) {
          setTimeout(() => {
            network.current?.setOptions({
              physics: { enabled: false },
            });
          }, 50);
        }
      }

      // 選択状態をリセット
      network.current.unselectAll();

      // 検索でマッチしたノードを選択
      if (debouncedSelection.length > 0) {
        const selectedNodeIds = graphState.nodes
          .filter((node: NodeState) => {
            // マッチしたノードを特定（size が selected のもの）
            return node.size === 20 && node.borderWidth === 4;
          })
          .map((node: NodeState) => node.id);

        if (selectedNodeIds.length > 0) {
          network.current.selectNodes(selectedNodeIds);

          // 初回のみフィット（前回と異なる選択の場合）
          const prevSelection = network.current.getSelectedNodes();
          const hasChanged =
            selectedNodeIds.length !== prevSelection.length ||
            !selectedNodeIds.every((id: string) => prevSelection.includes(id));

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
    }, [
      graphState,
      debouncedSelection,
      network,
      nodesDataset,
      edgesDataset,
      diffNodes,
      diffEdges,
      applyNodeDiff,
      applyEdgeDiff,
    ]);

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
  // カスタム比較関数で再レンダリングを最適化
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.edgeFilter === nextProps.edgeFilter &&
      JSON.stringify(prevProps.roleFilter) ===
        JSON.stringify(nextProps.roleFilter) &&
      prevProps.showDirectConnectionsOnly ===
        nextProps.showDirectConnectionsOnly &&
      JSON.stringify(prevProps.selectedPokemon) ===
        JSON.stringify(nextProps.selectedPokemon)
    );
  },
);

NetworkGraph.displayName = "NetworkGraph";

export default NetworkGraph;
