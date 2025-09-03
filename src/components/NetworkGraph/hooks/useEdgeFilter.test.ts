import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useEdgeFilter } from "./useEdgeFilter";
import type { NetworkRefs, NodeData, EdgeData } from "../types";
import type { PokemonData } from "../../../types";
import type { DataSet } from "vis-data";
import type { Network } from "vis-network/standalone";
import * as utils from "../utils";

// utilsモジュールをモック
vi.mock("../utils", () => ({
  getMatchingNodes: vi.fn(),
}));

// constantsをモック
vi.mock("../../../utils/constants", () => ({
  EDGE_COLORS: {
    advantage: "#00ff00",
    disadvantage: "#ff0000",
  },
}));

describe("useEdgeFilter", () => {
  const mockData: PokemonData = {
    nodes: [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
      { id: "charizard", label: "リザードン", role: "ファイター" },
      { id: "blastoise", label: "カメックス", role: "タンク" },
    ],
    edges: [
      { from: "pikachu", to: "charizard", type: "advantage" },
      { from: "charizard", to: "blastoise", type: "disadvantage" },
      { from: "pikachu", to: "blastoise", type: "advantage" },
    ],
  };

  let mockRefs: NetworkRefs;
  let mockNodesDataset: {
    update: ReturnType<typeof vi.fn>;
  };
  let mockEdgesDataset: {
    clear: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // DataSetのモック
    mockNodesDataset = {
      update: vi.fn(),
    };

    mockEdgesDataset = {
      clear: vi.fn(),
      add: vi.fn(),
    };

    // NetworkRefsのモック
    const mockNetwork = {} as Network;
    const mockNodesDataSetInstance =
      mockNodesDataset as unknown as DataSet<NodeData>;
    const mockEdgesDataSetInstance =
      mockEdgesDataset as unknown as DataSet<EdgeData>;

    mockRefs = {
      containerRef: { current: document.createElement("div") },
      networkRef: { current: mockNetwork },
      nodesDatasetRef: { current: mockNodesDataSetInstance },
      edgesDatasetRef: { current: mockEdgesDataSetInstance },
    };

    // utilsモックの設定
    vi.mocked(utils.getMatchingNodes).mockReturnValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("エッジフィルタが'all'の場合、全てのエッジを表示することを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "all"));

    // エッジデータセットがクリアされることを確認
    expect(mockEdgesDataset.clear).toHaveBeenCalled();

    // 全てのエッジが追加されることを確認
    expect(mockEdgesDataset.add).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu-charizard-advantage",
          from: "pikachu",
          to: "charizard",
          type: "advantage",
        }),
        expect.objectContaining({
          id: "charizard-blastoise-disadvantage",
          from: "charizard",
          to: "blastoise",
          type: "disadvantage",
        }),
        expect.objectContaining({
          id: "pikachu-blastoise-advantage",
          from: "pikachu",
          to: "blastoise",
          type: "advantage",
        }),
      ]),
    );
  });

  it("エッジフィルタが'advantage'の場合、advantageエッジのみを表示することを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "advantage"));

    // エッジデータセットがクリアされることを確認
    expect(mockEdgesDataset.clear).toHaveBeenCalled();

    // advantageエッジのみが追加されることを確認
    expect(mockEdgesDataset.add).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu-charizard-advantage",
          type: "advantage",
        }),
        expect.objectContaining({
          id: "pikachu-blastoise-advantage",
          type: "advantage",
        }),
      ]),
    );

    // disadvantageエッジが含まれていないことを確認
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];
    expect(addedEdges).not.toContainEqual(
      expect.objectContaining({
        id: "charizard-blastoise-disadvantage",
        type: "disadvantage",
      }),
    );
  });

  it("エッジフィルタが'disadvantage'の場合、disadvantageエッジのみを表示することを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "disadvantage"));

    // エッジデータセットがクリアされることを確認
    expect(mockEdgesDataset.clear).toHaveBeenCalled();

    // disadvantageエッジのみが追加されることを確認
    expect(mockEdgesDataset.add).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "charizard-blastoise-disadvantage",
          type: "disadvantage",
        }),
      ]),
    );

    // advantageエッジが含まれていないことを確認
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];
    expect(addedEdges).toHaveLength(1);
  });

  it("選択されたポケモンがない場合、全てのエッジが通常表示されることを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "all"));

    // getMatchingNodesが空の配列で呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalledWith([], mockData.nodes);

    // 追加されたエッジの色が通常の色であることを確認
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];
    addedEdges.forEach((edge) => {
      expect(edge.color.color).not.toContain("0A"); // 透明度が追加されていない
      expect(edge.color.opacity).toBe(1);
    });
  });

  it("選択されたポケモンがある場合、接続されたエッジがハイライトされることを確認", () => {
    // マッチするノードを設定
    const matchingNodes = [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
    ];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);

    renderHook(() => useEdgeFilter(mockRefs, mockData, ["ピカチュウ"], "all"));

    // getMatchingNodesが呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalledWith(
      ["ピカチュウ"],
      mockData.nodes,
    );

    // 追加されたエッジを確認
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];

    // pikachuから接続されているエッジは通常の色
    const pikachuEdges = addedEdges.filter(
      (edge) => edge.from === "pikachu" || edge.to === "pikachu",
    );
    pikachuEdges.forEach((edge) => {
      expect(edge.color.color).not.toContain("0A");
      expect(edge.color.opacity).toBe(1);
    });

    // pikachuに接続されていないエッジは薄い色
    const otherEdges = addedEdges.filter(
      (edge) => edge.from !== "pikachu" && edge.to !== "pikachu",
    );
    otherEdges.forEach((edge) => {
      expect(edge.color.color).toContain("0A");
      expect(edge.color.opacity).toBeLessThan(1);
    });
  });

  it("選択されたポケモンと複数のエッジタイプフィルタが組み合わされることを確認", () => {
    const matchingNodes = [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
    ];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);

    renderHook(() =>
      useEdgeFilter(mockRefs, mockData, ["ピカチュウ"], "advantage"),
    );

    // advantageエッジのみがフィルタされ、その中でpikachuに接続されたものがハイライト
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];

    // 全てのエッジがadvantageタイプであることを確認
    addedEdges.forEach((edge) => {
      expect(edge.type).toBe("advantage");
    });

    // pikachuから/へのエッジがハイライトされていることを確認
    const highlightedEdges = addedEdges.filter(
      (edge) => edge.color.opacity === 1,
    );
    expect(highlightedEdges).toHaveLength(2); // pikachu->charizard, pikachu->blastoise
  });

  it("refがnullの場合、処理を行わないことを確認", () => {
    const nullRefs: NetworkRefs = {
      containerRef: { current: null },
      networkRef: { current: null },
      nodesDatasetRef: { current: null },
      edgesDatasetRef: { current: null },
    };

    renderHook(() => useEdgeFilter(nullRefs, mockData, [], "all"));

    // 何も処理されないことを確認
    expect(utils.getMatchingNodes).not.toHaveBeenCalled();
  });

  it("エッジの色が正しく設定されることを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "all"));

    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];

    // advantageエッジの色を確認
    const advantageEdge = addedEdges.find((edge) => edge.type === "advantage");
    expect(advantageEdge?.color.color).toBe("#00ff00");
    expect(advantageEdge?.color.highlight).toBe("#00ff00");

    // disadvantageエッジの色を確認
    const disadvantageEdge = addedEdges.find(
      (edge) => edge.type === "disadvantage",
    );
    expect(disadvantageEdge?.color.color).toBe("#ff0000");
    expect(disadvantageEdge?.color.highlight).toBe("#ff0000");
  });

  it("矢印の設定が正しくされることを確認", () => {
    renderHook(() => useEdgeFilter(mockRefs, mockData, [], "all"));

    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];

    addedEdges.forEach((edge) => {
      expect(edge.arrows.to.enabled).toBe(true);
      expect(edge.arrows.to.scaleFactor).toBeGreaterThan(0);
    });
  });

  it("プロパティ変更時にuseEffectが再実行されることを確認", () => {
    const { rerender } = renderHook(
      ({ edgeFilter }) => useEdgeFilter(mockRefs, mockData, [], edgeFilter),
      {
        initialProps: {
          edgeFilter: "all" as "all" | "advantage" | "disadvantage",
        },
      },
    );

    // 初回実行でclearが呼ばれる
    expect(mockEdgesDataset.clear).toHaveBeenCalledTimes(1);

    // edgeFilterを変更して再レンダリング
    rerender({ edgeFilter: "advantage" });

    // 再度clearが呼ばれることを確認
    expect(mockEdgesDataset.clear).toHaveBeenCalledTimes(2);
  });

  it("複数のポケモンが選択された場合、正しく処理されることを確認", () => {
    const matchingNodes = [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
      { id: "charizard", label: "リザードン", role: "ファイター" },
    ];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);

    renderHook(() =>
      useEdgeFilter(mockRefs, mockData, ["ピカチュウ", "リザードン"], "all"),
    );

    // getMatchingNodesが正しい引数で呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalledWith(
      ["ピカチュウ", "リザードン"],
      mockData.nodes,
    );

    // 全てのエッジがハイライトされることを確認（全ノードが選択されているため）
    const addedEdges = mockEdgesDataset.add.mock.calls[0][0] as EdgeData[];
    const highlightedEdges = addedEdges.filter(
      (edge) => edge.color.opacity === 1,
    );
    expect(highlightedEdges).toHaveLength(3);
  });
});
