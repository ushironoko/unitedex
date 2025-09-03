import { useRef, useLayoutEffect } from "react";
import { DataSet } from "vis-data";
import { Network } from "vis-network/standalone";
import { NETWORK_OPTIONS } from "../constants";

interface NetworkInstance {
  containerRef: React.RefObject<HTMLDivElement | null>;
  network: React.RefObject<Network | null>;
  nodesDataset: React.RefObject<DataSet<any> | null>;
  edgesDataset: React.RefObject<DataSet<any> | null>;
}

// ネットワークインスタンスの初期化のみを行うフック
export function useNetworkInstance(): NetworkInstance {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDatasetRef = useRef<DataSet<any> | null>(null);
  const edgesDatasetRef = useRef<DataSet<any> | null>(null);
  const isInitialized = useRef(false);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (isInitialized.current) return;

    // データセットを作成（初期は空）
    const nodesDataset = new DataSet<any>([]);
    const edgesDataset = new DataSet<any>([]);

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

    // 安定化が完了したら物理エンジンを停止
    network.once("stabilizationIterationsDone", () => {
      network.setOptions({
        physics: { enabled: false },
      });
    });

    // 手動で安定化を開始
    network.stabilize();

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
