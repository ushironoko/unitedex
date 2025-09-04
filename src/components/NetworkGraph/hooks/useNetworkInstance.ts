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
  const physicsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (isInitialized.current) return;

    // データセットを作成（初期は空、バッチ更新をサポート）
    const nodesDataset = new DataSet<Node>([], {
      queue: { delay: 50, max: 100 }, // バッチ更新の設定
    });
    const edgesDataset = new DataSet<Edge>([], {
      queue: { delay: 50, max: 100 }, // バッチ更新の設定
    });

    nodesDatasetRef.current = nodesDataset;
    edgesDatasetRef.current = edgesDataset;

    // 最適化されたネットワークオプション
    const optimizedOptions = {
      ...NETWORK_OPTIONS,
      physics: {
        ...NETWORK_OPTIONS.physics,
        stabilization: {
          enabled: true,
          iterations: 50, // 安定化イテレーションを減らす
          updateInterval: 50,
          onlyDynamicEdges: false,
          fit: false,
        },
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          theta: 0.5,
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springConstant: 0.08,
          springLength: 100,
          damping: 0.4,
        },
      },
      layout: {
        ...NETWORK_OPTIONS.layout,
        improvedLayout: false, // 初期レイアウトの計算を高速化
      },
      interaction: {
        ...NETWORK_OPTIONS.interaction,
        hideEdgesOnDrag: true, // ドラッグ中はエッジを非表示にしてパフォーマンス向上
        hideEdgesOnZoom: false,
      },
    };

    // ネットワークを初期化
    const network = new Network(
      containerRef.current,
      { nodes: nodesDataset, edges: edgesDataset },
      optimizedOptions,
    );

    networkRef.current = network;
    isInitialized.current = true;

    // 安定化後に物理エンジンを停止
    network.on("stabilizationIterationsDone", () => {
      if (physicsTimeoutRef.current) {
        clearTimeout(physicsTimeoutRef.current);
      }
      physicsTimeoutRef.current = setTimeout(() => {
        network.setOptions({ physics: { enabled: false } });
      }, 100);
    });

    // ドラッグ開始時の処理
    network.on("dragStart", (params) => {
      if (params.nodes.length > 0) {
        // 即座に物理エンジンを無効化
        network.setOptions({
          physics: { enabled: false },
        });
      }
    });

    // ドラッグ終了時の処理
    network.on("dragEnd", () => {
      // 物理エンジンは無効のまま
      network.setOptions({ physics: { enabled: false } });
    });

    // ズーム変更時の最適化
    let zoomTimeout: NodeJS.Timeout | null = null;
    network.on("zoom", () => {
      if (zoomTimeout) clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const scale = network.getScale();
        // ズームレベルに応じてエッジの表示を調整
        if (scale < 0.3) {
          network.setOptions({
            edges: { smooth: false }, // 低ズーム時は曲線を無効化
          });
        } else {
          network.setOptions({
            edges: {
              smooth: { enabled: true, type: "continuous", roundness: 0.5 },
            },
          });
        }
      }, 100);
    });

    return () => {
      if (physicsTimeoutRef.current) {
        clearTimeout(physicsTimeoutRef.current);
      }
      if (zoomTimeout) {
        clearTimeout(zoomTimeout);
      }
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
