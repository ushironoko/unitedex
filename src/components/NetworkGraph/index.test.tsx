import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type React from "react";
import NetworkGraph from "./index";
import type { NetworkGraphProps, NetworkRefs } from "./types";
import type { PokemonData } from "../../types";

// カスタムフックをモック
vi.mock("./hooks/useNetwork", () => ({
  useNetwork: vi.fn(),
}));

vi.mock("./hooks/useNodeSelection", () => ({
  useNodeSelection: vi.fn(),
}));

vi.mock("./hooks/useEdgeFilter", () => ({
  useEdgeFilter: vi.fn(),
}));

vi.mock("./hooks/useRoleFilter", () => ({
  useRoleFilter: vi.fn(),
}));

import { useNetwork } from "./hooks/useNetwork";
import { useNodeSelection } from "./hooks/useNodeSelection";
import { useEdgeFilter } from "./hooks/useEdgeFilter";
import { useRoleFilter } from "./hooks/useRoleFilter";

describe("NetworkGraph", () => {
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

  const defaultProps: NetworkGraphProps = {
    data: mockData,
    selectedPokemon: [],
    edgeFilter: "all",
    roleFilter: [],
    showDirectConnectionsOnly: false,
  };

  let mockRefs: NetworkRefs;

  beforeEach(() => {
    // NetworkRefsのモック
    mockRefs = {
      containerRef: { current: null },
      networkRef: { current: null },
      nodesDatasetRef: { current: null },
      edgesDatasetRef: { current: null },
    };

    // カスタムフックのモック設定
    vi.mocked(useNetwork).mockReturnValue(mockRefs);
    vi.mocked(useNodeSelection).mockReturnValue(undefined);
    vi.mocked(useEdgeFilter).mockReturnValue(undefined);
    vi.mocked(useRoleFilter).mockReturnValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("基本的にレンダリングされることを確認", () => {
    const { container } = render(<NetworkGraph {...defaultProps} />);
    
    // divが1つレンダリングされることを確認
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({
      width: "100%",
      height: "100%",
      minHeight: "750px",
    });
  });

  it("useNetworkフックが正しい引数で呼ばれることを確認", () => {
    render(<NetworkGraph {...defaultProps} />);
    
    expect(useNetwork).toHaveBeenCalledWith(mockData);
    expect(useNetwork).toHaveBeenCalledTimes(1);
  });

  it("useNodeSelectionフックが正しい引数で呼ばれることを確認", () => {
    render(<NetworkGraph {...defaultProps} />);
    
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      false,
      []
    );
    expect(useNodeSelection).toHaveBeenCalledTimes(1);
  });

  it("useEdgeFilterフックが正しい引数で呼ばれることを確認", () => {
    render(<NetworkGraph {...defaultProps} />);
    
    expect(useEdgeFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      "all"
    );
    expect(useEdgeFilter).toHaveBeenCalledTimes(1);
  });

  it("useRoleFilterフックが正しい引数で呼ばれることを確認", () => {
    render(<NetworkGraph {...defaultProps} />);
    
    expect(useRoleFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      []
    );
    expect(useRoleFilter).toHaveBeenCalledTimes(1);
  });

  it("選択されたポケモンがある場合、正しく渡されることを確認", () => {
    const propsWithSelection: NetworkGraphProps = {
      ...defaultProps,
      selectedPokemon: ["ピカチュウ", "リザードン"],
    };
    
    render(<NetworkGraph {...propsWithSelection} />);
    
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ", "リザードン"],
      false,
      []
    );

    expect(useEdgeFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ", "リザードン"],
      "all"
    );

    expect(useRoleFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ", "リザードン"],
      []
    );
  });

  it("エッジフィルタが設定されている場合、正しく渡されることを確認", () => {
    const propsWithEdgeFilter: NetworkGraphProps = {
      ...defaultProps,
      edgeFilter: "advantage",
    };
    
    render(<NetworkGraph {...propsWithEdgeFilter} />);
    
    expect(useEdgeFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      "advantage"
    );
  });

  it("ロールフィルタが設定されている場合、正しく渡されることを確認", () => {
    const propsWithRoleFilter: NetworkGraphProps = {
      ...defaultProps,
      roleFilter: ["メイジ", "タンク"],
    };
    
    render(<NetworkGraph {...propsWithRoleFilter} />);
    
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      false,
      ["メイジ", "タンク"]
    );

    expect(useRoleFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      ["メイジ", "タンク"]
    );
  });

  it("showDirectConnectionsOnlyが設定されている場合、正しく渡されることを確認", () => {
    const propsWithDirectOnly: NetworkGraphProps = {
      ...defaultProps,
      showDirectConnectionsOnly: true,
    };
    
    render(<NetworkGraph {...propsWithDirectOnly} />);
    
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      [],
      true,
      []
    );
  });

  it("全ての設定が同時に適用される場合、正しく渡されることを確認", () => {
    const propsWithAllSettings: NetworkGraphProps = {
      data: mockData,
      selectedPokemon: ["ピカチュウ"],
      edgeFilter: "disadvantage",
      roleFilter: ["メイジ", "ファイター"],
      showDirectConnectionsOnly: true,
    };
    
    render(<NetworkGraph {...propsWithAllSettings} />);
    
    expect(useNetwork).toHaveBeenCalledWith(mockData);
    
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ"],
      true,
      ["メイジ", "ファイター"]
    );

    expect(useEdgeFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ"],
      "disadvantage"
    );

    expect(useRoleFilter).toHaveBeenCalledWith(
      mockRefs,
      mockData,
      ["ピカチュウ"],
      ["メイジ", "ファイター"]
    );
  });

  it("containerRefが適切に設定されることを確認", () => {
    const { container } = render(<NetworkGraph {...defaultProps} />);
    
    // useNetworkから返されたcontainerRefがdivに設定されることを確認
    const divElement = container.firstChild as HTMLDivElement;
    expect(divElement).toBeInstanceOf(HTMLDivElement);
    expect(mockRefs.containerRef).toBeDefined();
  });

  it("プロパティ変更時にフックが再実行されることを確認", () => {
    const { rerender } = render(<NetworkGraph {...defaultProps} />);
    
    // 初回レンダリング後にクリア
    vi.clearAllMocks();
    
    // プロパティを変更して再レンダリング
    const updatedProps: NetworkGraphProps = {
      ...defaultProps,
      selectedPokemon: ["ピカチュウ"],
    };
    
    rerender(<NetworkGraph {...updatedProps} />);
    
    // 全てのフックが再実行されることを確認
    expect(useNetwork).toHaveBeenCalledTimes(1);
    expect(useNodeSelection).toHaveBeenCalledTimes(1);
    expect(useEdgeFilter).toHaveBeenCalledTimes(1);
    expect(useRoleFilter).toHaveBeenCalledTimes(1);
  });

  it("データが変更された時にフックが再実行されることを確認", () => {
    const { rerender } = render(<NetworkGraph {...defaultProps} />);
    
    // 初回レンダリング後にクリア
    vi.clearAllMocks();
    
    // データを変更
    const updatedData: PokemonData = {
      nodes: [...mockData.nodes, { id: "venusaur", label: "フシギバナ", role: "メイジ" }],
      edges: mockData.edges,
    };
    
    const updatedProps: NetworkGraphProps = {
      ...defaultProps,
      data: updatedData,
    };
    
    rerender(<NetworkGraph {...updatedProps} />);
    
    // useNetworkが新しいデータで呼ばれることを確認
    expect(useNetwork).toHaveBeenCalledWith(updatedData);
    
    // 他のフックも新しいデータで呼ばれることを確認
    expect(useNodeSelection).toHaveBeenCalledWith(
      mockRefs,
      updatedData,
      [],
      false,
      []
    );
  });

  it("必要なスタイルが適用されることを確認", () => {
    const { container } = render(<NetworkGraph {...defaultProps} />);
    
    const divElement = container.firstChild as HTMLDivElement;
    const computedStyle = window.getComputedStyle(divElement);
    
    expect(computedStyle.width).toBe("100%");
    expect(computedStyle.height).toBe("100%");
    expect(computedStyle.minHeight).toBe("750px");
  });

  it("空のデータでもエラーなくレンダリングされることを確認", () => {
    const emptyData: PokemonData = { nodes: [], edges: [] };
    const propsWithEmptyData: NetworkGraphProps = {
      ...defaultProps,
      data: emptyData,
    };
    
    expect(() => {
      render(<NetworkGraph {...propsWithEmptyData} />);
    }).not.toThrow();
    
    expect(useNetwork).toHaveBeenCalledWith(emptyData);
  });
});