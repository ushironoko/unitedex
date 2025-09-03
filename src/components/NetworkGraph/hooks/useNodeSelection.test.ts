import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useNodeSelection } from "./useNodeSelection";
import type { NetworkRefs, NodeData, EdgeData } from "../types";
import type { PokemonData, Role } from "../../../types";
import * as utils from "../utils";

// utilsモジュールをモック
vi.mock("../utils", () => ({
  getMatchingNodes: vi.fn(),
  getConnectedElementIds: vi.fn(),
  createNodeUpdateData: vi.fn(),
  createEdgeUpdateData: vi.fn(),
  createResetNodeData: vi.fn(),
  createResetEdgeData: vi.fn(),
}));

describe("useNodeSelection", () => {
  const mockData: PokemonData = {
    nodes: [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
      { id: "charizard", label: "リザードン", role: "ファイター" },
      { id: "blastoise", label: "カメックス", role: "タンク" },
    ],
    edges: [
      { from: "pikachu", to: "charizard", type: "advantage" },
      { from: "charizard", to: "blastoise", type: "disadvantage" },
    ],
  };

  let mockRefs: NetworkRefs;
  let mockNetwork: any;
  let mockNodesDataset: any;
  let mockEdgesDataset: any;

  beforeEach(() => {
    // Networkのモック
    mockNetwork = {
      unselectAll: vi.fn(),
      selectNodes: vi.fn(),
      fit: vi.fn(),
    };

    // DataSetのモック
    mockNodesDataset = {
      update: vi.fn(),
    };

    mockEdgesDataset = {
      update: vi.fn(),
    };

    // NetworkRefsのモック
    mockRefs = {
      containerRef: { current: document.createElement("div") },
      networkRef: { current: mockNetwork },
      nodesDatasetRef: { current: mockNodesDataset },
      edgesDatasetRef: { current: mockEdgesDataset },
    };

    // utilsモックの設定
    vi.mocked(utils.getMatchingNodes).mockReturnValue([]);
    vi.mocked(utils.getConnectedElementIds).mockReturnValue({
      connectedNodeIds: new Set(),
      connectedEdgeIds: new Set(),
    });
    vi.mocked(utils.createNodeUpdateData).mockReturnValue({} as any);
    vi.mocked(utils.createEdgeUpdateData).mockReturnValue({} as any);
    vi.mocked(utils.createResetNodeData).mockReturnValue({} as any);
    vi.mocked(utils.createResetEdgeData).mockReturnValue({} as any);

    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("選択されたポケモンがない場合、全てを通常表示に戻すことを確認", () => {
    renderHook(() =>
      useNodeSelection(mockRefs, mockData, [], false, [])
    );

    // createResetNodeDataが各ノードに対して呼ばれることを確認
    expect(utils.createResetNodeData).toHaveBeenCalledTimes(3);
    expect(utils.createResetNodeData).toHaveBeenCalledWith(mockData.nodes[0]);
    expect(utils.createResetNodeData).toHaveBeenCalledWith(mockData.nodes[1]);
    expect(utils.createResetNodeData).toHaveBeenCalledWith(mockData.nodes[2]);

    // createResetEdgeDataが各エッジに対して呼ばれることを確認
    expect(utils.createResetEdgeData).toHaveBeenCalledTimes(2);
    expect(utils.createResetEdgeData).toHaveBeenCalledWith(mockData.edges[0]);
    expect(utils.createResetEdgeData).toHaveBeenCalledWith(mockData.edges[1]);

    // ネットワークの選択がクリアされることを確認
    expect(mockNetwork.unselectAll).toHaveBeenCalled();
  });

  it("マッチするノードがない場合、全てを薄く表示することを確認", () => {
    vi.mocked(utils.getMatchingNodes).mockReturnValue([]);

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["存在しない"], false, [])
    );

    // getMatchingNodesが呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalledWith(["存在しない"], mockData.nodes);

    // ノードが薄く表示されるように更新されることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu",
          opacity: 0.1,
        }),
        expect.objectContaining({
          id: "charizard",
          opacity: 0.1,
        }),
        expect.objectContaining({
          id: "blastoise",
          opacity: 0.1,
        }),
      ])
    );

    // エッジも薄く表示されるように更新されることを確認
    expect(mockEdgesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu-charizard-advantage",
          color: expect.objectContaining({
            opacity: 0.05,
          }),
        }),
      ])
    );
  });

  it("マッチするノードがある場合、適切に処理することを確認", () => {
    const matchingNodes = [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role }];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);
    vi.mocked(utils.getConnectedElementIds).mockReturnValue({
      connectedNodeIds: new Set(["pikachu", "charizard"]),
      connectedEdgeIds: new Set(["pikachu-charizard-advantage"]),
    });

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["ピカチュウ"], false, [])
    );

    // getMatchingNodesが呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalledWith(["ピカチュウ"], mockData.nodes);

    // getConnectedElementIdsが呼ばれることを確認
    expect(utils.getConnectedElementIds).toHaveBeenCalledWith(
      new Set(["pikachu"]),
      mockData.edges,
      false
    );

    // ノード更新関数が各ノードに対して呼ばれることを確認
    expect(utils.createNodeUpdateData).toHaveBeenCalledTimes(3);

    // エッジ更新関数が各エッジに対して呼ばれることを確認
    expect(utils.createEdgeUpdateData).toHaveBeenCalledTimes(2);

    // ネットワークでノードが選択されることを確認
    expect(mockNetwork.selectNodes).toHaveBeenCalledWith(["pikachu"]);
  });

  it("直接接続のみのオプションが適切に渡されることを確認", () => {
    const matchingNodes = [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role }];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["ピカチュウ"], true, [])
    );

    // showDirectConnectionsOnlyがtrueで呼ばれることを確認
    expect(utils.getConnectedElementIds).toHaveBeenCalledWith(
      expect.any(Set),
      mockData.edges,
      true
    );
  });

  it("ロールフィルタが適用されることを確認", () => {
    const matchingNodes = [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role }];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);
    vi.mocked(utils.getConnectedElementIds).mockReturnValue({
      connectedNodeIds: new Set(["pikachu"]),
      connectedEdgeIds: new Set([]),
    });

    const roleFilter: Role[] = ["メイジ"];

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["ピカチュウ"], false, roleFilter)
    );

    // createNodeUpdateDataがロールフィルタ情報と共に呼ばれることを確認
    expect(utils.createNodeUpdateData).toHaveBeenCalledWith(
      mockData.nodes[0], // pikachu
      true, // isSelected
      true, // isConnected
      false // isRoleFiltered (メイジなので含まれる)
    );

    expect(utils.createNodeUpdateData).toHaveBeenCalledWith(
      mockData.nodes[1], // charizard
      false, // isSelected
      false, // isConnected
      true // isRoleFiltered (メイジでないので除外)
    );
  });

  it("遅延してfitが実行されることを確認", () => {
    const matchingNodes = [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role }];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);
    vi.mocked(utils.getConnectedElementIds).mockReturnValue({
      connectedNodeIds: new Set(["pikachu", "charizard"]),
      connectedEdgeIds: new Set([]),
    });

    // nodesDatasetのgetメソッドをモック
    mockNodesDataset.get = vi.fn((nodeId: string) => ({ id: nodeId }));

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["ピカチュウ"], false, [])
    );

    // 即座にはfitが呼ばれないことを確認
    expect(mockNetwork.fit).not.toHaveBeenCalled();

    // 100ms経過後にfitが呼ばれることを確認
    vi.advanceTimersByTime(100);
    expect(mockNetwork.fit).toHaveBeenCalledWith({
      nodes: ["pikachu", "charizard"],
      animation: expect.any(Object),
    });
  });

  it("refがnullの場合、処理を行わないことを確認", () => {
    const nullRefs: NetworkRefs = {
      containerRef: { current: null },
      networkRef: { current: null },
      nodesDatasetRef: { current: null },
      edgesDatasetRef: { current: null },
    };

    renderHook(() =>
      useNodeSelection(nullRefs, mockData, ["ピカチュウ"], false, [])
    );

    // 何も処理されないことを確認
    expect(utils.getMatchingNodes).not.toHaveBeenCalled();
  });

  it("空のデータの場合、処理を行わないことを確認", () => {
    const emptyData: PokemonData = { nodes: [], edges: [] };

    renderHook(() =>
      useNodeSelection(mockRefs, emptyData, ["ピカチュウ"], false, [])
    );

    // 何も処理されないことを確認
    expect(utils.getMatchingNodes).not.toHaveBeenCalled();
  });

  it("エッジのロールフィルタが適用されることを確認", () => {
    const matchingNodes = [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role }];
    vi.mocked(utils.getMatchingNodes).mockReturnValue(matchingNodes);
    vi.mocked(utils.getConnectedElementIds).mockReturnValue({
      connectedNodeIds: new Set(["pikachu"]),
      connectedEdgeIds: new Set(["pikachu-charizard-advantage"]),
    });

    const roleFilter: Role[] = ["メイジ"];

    renderHook(() =>
      useNodeSelection(mockRefs, mockData, ["ピカチュウ"], false, roleFilter)
    );

    // createEdgeUpdateDataがロールフィルタ情報と共に呼ばれることを確認
    expect(utils.createEdgeUpdateData).toHaveBeenCalledWith(
      mockData.edges[0], // pikachu -> charizard
      true, // isConnected
      true // isRoleFiltered (charizardがファイターなので除外される)
    );
  });

  it("プロパティ変更時にuseEffectが再実行されることを確認", () => {
    const { rerender } = renderHook(
      ({ selectedPokemon }) =>
        useNodeSelection(mockRefs, mockData, selectedPokemon, false, []),
      { initialProps: { selectedPokemon: [] } }
    );

    // 初回実行でresetが呼ばれる
    expect(utils.createResetNodeData).toHaveBeenCalled();
    vi.clearAllMocks();

    // selectedPokemonを変更して再レンダリング
    rerender({ selectedPokemon: ["ピカチュウ"] });

    // 再度関数が呼ばれることを確認
    expect(utils.getMatchingNodes).toHaveBeenCalled();
  });
});