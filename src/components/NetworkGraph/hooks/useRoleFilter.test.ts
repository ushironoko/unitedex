import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useRoleFilter } from "./useRoleFilter";
import type { NetworkRefs } from "../types";
import type { PokemonData, Role } from "../../../types";

describe("useRoleFilter", () => {
  const mockData: PokemonData = {
    nodes: [
      { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
      { id: "charizard", label: "リザードン", role: "ファイター" },
      { id: "blastoise", label: "カメックス", role: "タンク" },
      { id: "clefairy", label: "ピッピ", role: "サポート" },
      { id: "garchomp", label: "ガブリアス", role: "アサシン" },
    ],
    edges: [
      { from: "pikachu", to: "charizard", type: "advantage" },
      { from: "charizard", to: "blastoise", type: "disadvantage" },
      { from: "blastoise", to: "clefairy", type: "advantage" },
      { from: "clefairy", to: "garchomp", type: "disadvantage" },
    ],
  };

  let mockRefs: NetworkRefs;
  let mockNodesDataset: any;
  let mockEdgesDataset: any;
  let mockExistingEdges: any[];

  beforeEach(() => {
    // 既存のエッジデータをモック
    mockExistingEdges = [
      { id: "pikachu-charizard-advantage", from: "pikachu", to: "charizard" },
      { id: "charizard-blastoise-disadvantage", from: "charizard", to: "blastoise" },
      { id: "blastoise-clefairy-advantage", from: "blastoise", to: "clefairy" },
      { id: "clefairy-garchomp-disadvantage", from: "clefairy", to: "garchomp" },
    ];

    // DataSetのモック
    mockNodesDataset = {
      update: vi.fn(),
    };

    mockEdgesDataset = {
      get: vi.fn().mockReturnValue(mockExistingEdges),
      update: vi.fn(),
    };

    // NetworkRefsのモック
    mockRefs = {
      containerRef: { current: document.createElement("div") },
      networkRef: { current: {} },
      nodesDatasetRef: { current: mockNodesDataset },
      edgesDatasetRef: { current: mockEdgesDataset },
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("ロールフィルタが未設定の場合、全てのノードを表示することを確認", () => {
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], [])
    );

    // 全てのノードがhidden=falseで更新されることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu",
          hidden: false,
        }),
        expect.objectContaining({
          id: "charizard",
          hidden: false,
        }),
        expect.objectContaining({
          id: "blastoise",
          hidden: false,
        }),
        expect.objectContaining({
          id: "clefairy",
          hidden: false,
        }),
        expect.objectContaining({
          id: "garchomp",
          hidden: false,
        }),
      ])
    );
  });

  it("全ロールが選択されている場合、全てのノードを表示することを確認", () => {
    const allRoles: Role[] = ["メイジ", "ファイター", "タンク", "サポート", "アサシン"];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], allRoles)
    );

    // 全てのノードがhidden=falseで更新されることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu",
          hidden: false,
        }),
        expect.objectContaining({
          id: "charizard", 
          hidden: false,
        }),
        expect.objectContaining({
          id: "blastoise",
          hidden: false,
        }),
        expect.objectContaining({
          id: "clefairy",
          hidden: false,
        }),
        expect.objectContaining({
          id: "garchomp",
          hidden: false,
        }),
      ])
    );
  });

  it("特定のロールのみを選択した場合、対応するノードのみを表示することを確認", () => {
    const roleFilter: Role[] = ["メイジ", "タンク"];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    // 指定されたロールのノードのみhidden=falseになることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu", // メイジ
          hidden: false,
        }),
        expect.objectContaining({
          id: "charizard", // ファイター
          hidden: true,
        }),
        expect.objectContaining({
          id: "blastoise", // タンク
          hidden: false,
        }),
        expect.objectContaining({
          id: "clefairy", // サポート
          hidden: true,
        }),
        expect.objectContaining({
          id: "garchomp", // アサシン
          hidden: true,
        }),
      ])
    );
  });

  it("単一のロールを選択した場合、対応するノードのみを表示することを確認", () => {
    const roleFilter: Role[] = ["メイジ"];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    // メイジノードのみhidden=falseになることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu", // メイジ
          hidden: false,
        }),
        expect.objectContaining({
          id: "charizard", // ファイター
          hidden: true,
        }),
        expect.objectContaining({
          id: "blastoise", // タンク
          hidden: true,
        }),
        expect.objectContaining({
          id: "clefairy", // サポート
          hidden: true,
        }),
        expect.objectContaining({
          id: "garchomp", // アサシン
          hidden: true,
        }),
      ])
    );
  });

  it("エッジの可視性が正しく更新されることを確認", () => {
    const roleFilter: Role[] = ["メイジ", "ファイター"];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    // エッジの更新が呼ばれることを確認
    expect(mockEdgesDataset.update).toHaveBeenCalled();

    const updateCalls = mockEdgesDataset.update.mock.calls[0][0];
    
    // pikachu(メイジ) <-> charizard(ファイター) のエッジは表示
    const visibleEdge = updateCalls.find((edge: any) => 
      edge.id === "pikachu-charizard-advantage"
    );
    expect(visibleEdge.hidden).toBe(false);

    // charizard(ファイター) <-> blastoise(タンク) のエッジは非表示（blastoiseが除外）
    const hiddenEdge = updateCalls.find((edge: any) => 
      edge.id === "charizard-blastoise-disadvantage"
    );
    expect(hiddenEdge.hidden).toBe(true);
  });

  it("両端のノードが除外されたエッジは非表示になることを確認", () => {
    const roleFilter: Role[] = ["attacker"]; // pikachuのみ
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    const updateCalls = mockEdgesDataset.update.mock.calls[0][0];
    
    // blastoise <-> clefairy のエッジは両方除外されるので非表示
    const hiddenEdge = updateCalls.find((edge: any) => 
      edge.id === "blastoise-clefairy-advantage"
    );
    expect(hiddenEdge.hidden).toBe(true);
  });

  it("片方のノードが含まれるエッジは非表示になることを確認", () => {
    const roleFilter: Role[] = ["メイジ", "ファイター"];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    const updateCalls = mockEdgesDataset.update.mock.calls[0][0];
    
    // charizard(ファイター) <-> blastoise(タンク) のエッジは片方除外で非表示
    const hiddenEdge = updateCalls.find((edge: any) => 
      edge.id === "charizard-blastoise-disadvantage"
    );
    expect(hiddenEdge.hidden).toBe(true);
  });

  it("選択されたポケモンがある場合、処理を行わないことを確認", () => {
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, ["ピカチュウ"], ["メイジ"])
    );

    // 検索がアクティブな場合は何も処理されないことを確認
    expect(mockNodesDataset.update).not.toHaveBeenCalled();
    expect(mockEdgesDataset.update).not.toHaveBeenCalled();
  });

  it("refがnullの場合、処理を行わないことを確認", () => {
    const nullRefs: NetworkRefs = {
      containerRef: { current: null },
      networkRef: { current: null },
      nodesDatasetRef: { current: null },
      edgesDatasetRef: { current: null },
    };

    renderHook(() =>
      useRoleFilter(nullRefs, mockData, [], ["メイジ"])
    );

    // 何も処理されないことを確認（モックが呼ばれない）
    expect(mockNodesDataset.update).not.toHaveBeenCalled();
  });

  it("edgesDatasetRefがnullの場合でもnodesの更新は行われることを確認", () => {
    const refsWithoutEdges: NetworkRefs = {
      containerRef: { current: document.createElement("div") },
      networkRef: { current: {} },
      nodesDatasetRef: { current: mockNodesDataset },
      edgesDatasetRef: { current: null },
    };

    renderHook(() =>
      useRoleFilter(refsWithoutEdges, mockData, [], ["メイジ"])
    );

    // ノードの更新は行われることを確認
    expect(mockNodesDataset.update).toHaveBeenCalled();
    // エッジの更新は行われないことを確認
    expect(mockEdgesDataset.update).not.toHaveBeenCalled();
  });

  it("プロパティ変更時にuseEffectが再実行されることを確認", () => {
    const { rerender } = renderHook(
      ({ roleFilter }) =>
        useRoleFilter(mockRefs, mockData, [], roleFilter),
      { initialProps: { roleFilter: [] as Role[] } }
    );

    // 初回実行でupdateが呼ばれる
    expect(mockNodesDataset.update).toHaveBeenCalledTimes(1);

    // roleFilterを変更して再レンダリング
    rerender({ roleFilter: ["メイジ"] });

    // 再度updateが呼ばれることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledTimes(2);
  });

  it("存在しないロールがフィルタに含まれている場合でも正常に処理されることを確認", () => {
    // @ts-ignore - テスト用に存在しないロールを使用
    const roleFilter = ["メイジ", "nonexistent"] as Role[];
    
    renderHook(() =>
      useRoleFilter(mockRefs, mockData, [], roleFilter)
    );

    // メイジノードのみhidden=falseになることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu", // メイジ
          hidden: false,
        }),
        expect.objectContaining({
          id: "charizard", // 存在しないロールなのでhidden=true
          hidden: true,
        }),
      ])
    );
  });

  it("空のノードデータでも正常に処理されることを確認", () => {
    const emptyData: PokemonData = { nodes: [], edges: [] };

    renderHook(() =>
      useRoleFilter(mockRefs, emptyData, [], ["メイジ"])
    );

    // 空の配列でupdateが呼ばれることを確認
    expect(mockNodesDataset.update).toHaveBeenCalledWith([]);
    expect(mockEdgesDataset.update).toHaveBeenCalledWith([]);
  });
});