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

    // ドラッグ開始時に一時的に物理エンジンを有効化
    network.on("dragStart", () => {
      network.setOptions({ physics: { enabled: true } });
    });

    // ドラッグ終了時に物理エンジンを停止
    network.on("dragEnd", () => {
      setTimeout(() => {
        network.setOptions({ physics: { enabled: false } });
      }, 2000);
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
