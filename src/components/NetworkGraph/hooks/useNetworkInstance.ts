import { useRef, useLayoutEffect } from "react";
import { DataSet } from "vis-data";
import { Network } from "vis-network/standalone";
import { NETWORK_OPTIONS } from "../constants";
import type { Node, Edge } from "vis-network/standalone";

interface NetworkInstance {
  containerRef: React.RefObject<HTMLDivElement | null>;
  network: React.RefObject<Network | null>;
  nodesDataset: React.RefObject<DataSet<Node> | null>;
  edgesDataset: React.RefObject<DataSet<Edge> | null>;
}

// ネットワークインスタンスの初期化のみを行うフック
export function useNetworkInstance(): NetworkInstance {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDatasetRef = useRef<DataSet<Node> | null>(null);
  const edgesDatasetRef = useRef<DataSet<Edge> | null>(null);
  const isInitialized = useRef(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (isInitialized.current) return;

    // データセットを作成（初期は空）
    const nodesDataset = new DataSet<Node>([]);
    const edgesDataset = new DataSet<Edge>([]);

    nodesDatasetRef.current = nodesDataset;
    edgesDatasetRef.current = edgesDataset;

    // ネットワークを初期化
    const network = new Network(
      containerRef.current,
      { nodes: nodesDataset, edges: edgesDataset },
      NETWORK_OPTIONS,
    );

    networkRef.current = network;
    isInitialized.current = true;

    // 安定化後に物理エンジンを停止
    network.on("stabilizationIterationsDone", () => {
      network.setOptions({ physics: { enabled: false } });
    });

    // ドラッグ開始時の処理
    network.on("dragStart", (params) => {
      if (params.nodes.length > 0) {
        network.setOptions({
          physics: {
            enabled: false,
          },
        });
      }
    });

    // ドラッグ終了時の処理
    network.on("dragEnd", () => {
      network.setOptions({ physics: { enabled: false } });
    });

    return () => {
      network.destroy();
      isInitialized.current = false;
    };
  }, []); // 初回のみ実行

  return {
    containerRef,
    network: networkRef,
    nodesDataset: nodesDatasetRef,
    edgesDataset: edgesDatasetRef,
  };
}
