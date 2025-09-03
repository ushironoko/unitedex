import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { DataSet } from "vis-data";
import { Network } from "vis-network/standalone";
import { useNetwork } from "./useNetwork";
import type { PokemonData } from "../../../types";

// vis-network/standaloneをモック
vi.mock("vis-network/standalone", () => ({
  Network: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    on: vi.fn(),
    setOptions: vi.fn(),
  })),
}));

// vis-dataをモック
vi.mock("vis-data", () => ({
  DataSet: vi.fn().mockImplementation((data) => ({
    data: data || [],
    add: vi.fn(),
    update: vi.fn(),
    clear: vi.fn(),
    get: vi.fn().mockReturnValue(data || []),
  })),
}));

describe("useNetwork", () => {
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

  let mockNetwork: any;
  let mockNodesDataSet: any;
  let mockEdgesDataSet: any;

  beforeEach(() => {
    // Networkコンストラクタのモックを設定
    mockNetwork = {
      destroy: vi.fn(),
      on: vi.fn(),
      setOptions: vi.fn(),
    };
    (Network as any).mockImplementation(() => mockNetwork);

    // DataSetのモックを設定
    mockNodesDataSet = {
      data: [],
      add: vi.fn(),
      update: vi.fn(),
      clear: vi.fn(),
      get: vi.fn().mockReturnValue([]),
    };
    mockEdgesDataSet = {
      data: [],
      add: vi.fn(),
      update: vi.fn(),
      clear: vi.fn(),
      get: vi.fn().mockReturnValue([]),
    };

    (DataSet as any)
      .mockImplementationOnce(() => mockNodesDataSet) // nodes用
      .mockImplementationOnce(() => mockEdgesDataSet); // edges用
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("初期化時にrefを正しく返すことを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.networkRef).toBeDefined();
    expect(result.current.nodesDatasetRef).toBeDefined();
    expect(result.current.edgesDatasetRef).toBeDefined();
  });

  it("データが変更された時にネットワークを再初期化することを確認", () => {
    const { result, rerender } = renderHook(
      ({ data }) => useNetwork(data),
      { initialProps: { data: mockData } }
    );

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // データを変更して再レンダリング
    const updatedData = {
      ...mockData,
      nodes: [...mockData.nodes, { id: "venusaur", label: "フシギバナ", role: "attacker" }],
    };

    rerender({ data: updatedData });

    // DataSetが再作成されることを確認
    expect(DataSet).toHaveBeenCalledTimes(4); // 初回2回 + 再レンダリング2回
  });

  it("空のデータの場合、ネットワークを初期化しないことを確認", () => {
    const emptyData: PokemonData = { nodes: [], edges: [] };
    const { result } = renderHook(() => useNetwork(emptyData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // Networkが初期化されないことを確認
    expect(Network).not.toHaveBeenCalled();
  });

  it("ネットワークイベントハンドラが正しく設定されることを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // ネットワークが初期化されることを確認
    expect(Network).toHaveBeenCalled();
    
    // イベントハンドラが設定されることを確認
    expect(mockNetwork.on).toHaveBeenCalledWith("stabilizationIterationsDone", expect.any(Function));
    expect(mockNetwork.on).toHaveBeenCalledWith("dragStart", expect.any(Function));
    expect(mockNetwork.on).toHaveBeenCalledWith("dragEnd", expect.any(Function));
  });

  it("stabilizationIterationsDoneイベントで物理エンジンを停止することを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // stabilizationIterationsDoneイベントハンドラを取得
    const stabilizationHandler = mockNetwork.on.mock.calls.find(
      (call) => call[0] === "stabilizationIterationsDone"
    )[1];

    // イベントハンドラを実行
    stabilizationHandler();

    // 物理エンジンが停止されることを確認
    expect(mockNetwork.setOptions).toHaveBeenCalledWith({ physics: { enabled: false } });
  });

  it("dragStartイベントで物理エンジンを有効化することを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // dragStartイベントハンドラを取得
    const dragStartHandler = mockNetwork.on.mock.calls.find(
      (call) => call[0] === "dragStart"
    )[1];

    // イベントハンドラを実行
    dragStartHandler();

    // 物理エンジンが有効化されることを確認
    expect(mockNetwork.setOptions).toHaveBeenCalledWith({ physics: { enabled: true } });
  });

  it("dragEndイベントで遅延して物理エンジンを停止することを確認", async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // dragEndイベントハンドラを取得
    const dragEndHandler = mockNetwork.on.mock.calls.find(
      (call) => call[0] === "dragEnd"
    )[1];

    // setOptionsのモックをリセット
    mockNetwork.setOptions.mockClear();

    // イベントハンドラを実行
    dragEndHandler();

    // 即座には呼ばれないことを確認
    expect(mockNetwork.setOptions).not.toHaveBeenCalled();

    // 2秒経過後に呼ばれることを確認
    vi.advanceTimersByTime(2000);
    expect(mockNetwork.setOptions).toHaveBeenCalledWith({ physics: { enabled: false } });

    vi.useRealTimers();
  });

  it("コンポーネントアンマウント時にネットワークが破棄されることを確認", () => {
    const { result, unmount } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // アンマウント
    unmount();

    // destroyが呼ばれることを確認
    expect(mockNetwork.destroy).toHaveBeenCalled();
  });

  it("接続されたノードが正しく識別されることを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // NodesDataSetが作成されることを確認
    expect(DataSet).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pikachu",
          label: "ピカチュウ",
          role: "メイジ",
        }),
        expect.objectContaining({
          id: "charizard", 
          label: "リザードン",
          role: "ファイター",
        }),
        expect.objectContaining({
          id: "blastoise",
          label: "カメックス", 
          role: "タンク",
        }),
      ])
    );
  });

  it("エッジデータが正しく作成されることを確認", () => {
    const { result } = renderHook(() => useNetwork(mockData));

    // コンテナrefを設定
    const mockContainer = document.createElement("div");
    (result.current.containerRef as any).current = mockContainer;

    // EdgesDataSetが作成されることを確認
    expect(DataSet).toHaveBeenCalledWith(
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
      ])
    );
  });
});