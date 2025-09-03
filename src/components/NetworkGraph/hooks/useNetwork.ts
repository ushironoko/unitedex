import { useEffect, useRef } from "react";
import { DataSet } from "vis-data";
import { Network } from "vis-network/standalone";
import type { NetworkRefs, NodeData, EdgeData } from "../types";
import { NETWORK_OPTIONS } from "../constants";
import { createNodeData, createEdgeData } from "../utils";
import type { PokemonData } from "../../../types";

export const useNetwork = (data: PokemonData): NetworkRefs => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDatasetRef = useRef<DataSet<NodeData> | null>(null);
  const edgesDatasetRef = useRef<DataSet<EdgeData> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // 接続されているノードを特定
    const connectedNodes = new Set([
      ...data.edges.map((e) => e.from),
      ...data.edges.map((e) => e.to),
    ]);

    // データセットを作成
    const nodes = new DataSet<NodeData>(
      data.nodes.map((node, index) =>
        createNodeData(node, index, data.nodes.length, connectedNodes),
      ),
    );

    const edges = new DataSet<EdgeData>(
      data.edges.map((edge) => createEdgeData(edge)),
    );

    nodesDatasetRef.current = nodes;
    edgesDatasetRef.current = edges;

    // ネットワークを初期化
    const network = new Network(
      containerRef.current,
      { nodes, edges },
      NETWORK_OPTIONS,
    );
    networkRef.current = network;

    // 安定化後に物理エンジンを停止
    network.on("stabilizationIterationsDone", () => {
      network.setOptions({ physics: { enabled: false } });
    });

    // ドラッグ中のノードIDを追跡
    let draggingNodeId: string | null = null;

    // ドラッグ開始時に該当ノードのみ物理エンジンを有効化
    network.on("dragStart", (params) => {
      if (params.nodes.length > 0) {
        draggingNodeId = params.nodes[0];
        // ドラッグ中のノードのみ物理演算を有効化
        network.setOptions({ 
          physics: { 
            enabled: false // グローバルな物理演算は無効のまま
          } 
        });
        // ドラッグ中のノードは手動で位置を更新（vis-networkが自動処理）
      }
    });

    // ドラッグ終了時の処理
    network.on("dragEnd", () => {
      draggingNodeId = null;
      // 物理エンジンは無効のまま維持（不要な動きを防ぐ）
      network.setOptions({ physics: { enabled: false } });
    });

    return () => {
      network.destroy();
    };
  }, [data]);

  return {
    containerRef,
    networkRef,
    nodesDatasetRef,
    edgesDatasetRef,
  };
};
