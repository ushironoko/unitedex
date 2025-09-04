import { describe, it, expect, beforeEach } from "vitest";
import type { PokemonData, Role } from "../../types";
import { GraphStateComputer } from "./computeGraphStateOptimized";

describe("GraphStateComputer", () => {
  let mockData: PokemonData;
  let computer: GraphStateComputer;

  beforeEach(() => {
    // テスト用のモックデータ
    mockData = {
      nodes: [
        { id: "miraidon", label: "ミライドン", role: "アサシン" as Role },
        { id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role },
        { id: "charizard", label: "リザードン", role: "ファイター" as Role },
        { id: "blastoise", label: "カメックス", role: "タンク" as Role },
        { id: "venusaur", label: "フシギバナ", role: "メイジ" as Role },
        { id: "snorlax", label: "カビゴン", role: "タンク" as Role },
      ],
      edges: [
        // ミライドンの関係
        { from: "miraidon", to: "pikachu", type: "advantage" },
        { from: "miraidon", to: "charizard", type: "disadvantage" },
        // ピカチュウの関係
        { from: "pikachu", to: "blastoise", type: "disadvantage" },
        // リザードンの関係
        { from: "charizard", to: "venusaur", type: "advantage" },
        // 孤立したエッジ（ミライドンと関係ない）
        { from: "blastoise", to: "snorlax", type: "advantage" },
      ],
    };
    
    computer = new GraphStateComputer(mockData);
  });

  describe("検索なしの場合", () => {
    it("すべてのノードが表示される", () => {
      const result = computer.compute({
        searchTerms: [],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // すべてのノードが表示される（hidden = false）
      expect(result.nodes).toHaveLength(6);
      result.nodes.forEach(node => {
        expect(node.hidden).toBe(false);
      });
    });

    it("すべてのエッジが表示される", () => {
      const result = computer.compute({
        searchTerms: [],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // すべてのエッジが表示される（hidden = false）
      expect(result.edges).toHaveLength(5);
      result.edges.forEach(edge => {
        expect(edge.hidden).toBe(false);
      });
    });
  });

  describe("検索ありの場合（ミライドン）", () => {
    it("マッチしたノードと関連ノードのみが表示される", () => {
      const result = computer.compute({
        searchTerms: ["ミライドン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // ノードの表示状態を確認
      const nodeMap = new Map(result.nodes.map(n => [n.id, n]));
      
      // ミライドン：強調表示
      expect(nodeMap.get("miraidon")!.hidden).toBe(false);
      expect(nodeMap.get("miraidon")!.size).toBe(20);
      expect(nodeMap.get("miraidon")!.borderWidth).toBe(4);
      
      // 直接接続ノード：通常表示
      expect(nodeMap.get("pikachu")!.hidden).toBe(false);
      expect(nodeMap.get("charizard")!.hidden).toBe(false);
      
      // 二次接続ノード（showDirectConnectionsOnly = false なので表示）
      expect(nodeMap.get("blastoise")!.hidden).toBe(false); // ピカチュウから接続
      expect(nodeMap.get("venusaur")!.hidden).toBe(false); // リザードンから接続
      
      // 関係のないノード：非表示
      expect(nodeMap.get("snorlax")!.hidden).toBe(true);
    });

    it("関連エッジのみが表示される", () => {
      const result = computer.compute({
        searchTerms: ["ミライドン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // エッジの表示状態を確認
      const edgeMap = new Map(result.edges.map(e => [e.id, e]));
      
      // ミライドンに直接つながるエッジ：表示
      expect(edgeMap.get("miraidon-pikachu-advantage")!.hidden).toBe(false);
      expect(edgeMap.get("miraidon-charizard-disadvantage")!.hidden).toBe(false);
      
      // 一次接続ノード間のエッジ：表示
      expect(edgeMap.get("pikachu-blastoise-disadvantage")!.hidden).toBe(false);
      expect(edgeMap.get("charizard-venusaur-advantage")!.hidden).toBe(false);
      
      // 関係のないエッジ：非表示
      expect(edgeMap.get("blastoise-snorlax-advantage")!.hidden).toBe(true);
    });
  });

  describe("直接接続のみモード", () => {
    it("一次接続ノードのみが表示される", () => {
      const result = computer.compute({
        searchTerms: ["ミライドン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: true,
        isInitialRender: false,
      });

      const nodeMap = new Map(result.nodes.map(n => [n.id, n]));
      
      // ミライドン：表示
      expect(nodeMap.get("miraidon")!.hidden).toBe(false);
      
      // 直接接続ノード：表示
      expect(nodeMap.get("pikachu")!.hidden).toBe(false);
      expect(nodeMap.get("charizard")!.hidden).toBe(false);
      
      // 二次接続ノード：非表示
      expect(nodeMap.get("blastoise")!.hidden).toBe(true);
      expect(nodeMap.get("venusaur")!.hidden).toBe(true);
      expect(nodeMap.get("snorlax")!.hidden).toBe(true);
    });

    it("一次接続エッジのみが表示される", () => {
      const result = computer.compute({
        searchTerms: ["ミライドン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: true,
        isInitialRender: false,
      });

      const edgeMap = new Map(result.edges.map(e => [e.id, e]));
      
      // 直接エッジ：表示
      expect(edgeMap.get("miraidon-pikachu-advantage")!.hidden).toBe(false);
      expect(edgeMap.get("miraidon-charizard-disadvantage")!.hidden).toBe(false);
      
      // 二次エッジ：非表示
      expect(edgeMap.get("pikachu-blastoise-disadvantage")!.hidden).toBe(true);
      expect(edgeMap.get("charizard-venusaur-advantage")!.hidden).toBe(true);
      expect(edgeMap.get("blastoise-snorlax-advantage")!.hidden).toBe(true);
    });
  });

  describe("検索結果が0件の場合", () => {
    it("すべてのノードが表示される", () => {
      const result = computer.compute({
        searchTerms: ["存在しないポケモン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // すべてのノードが表示される
      result.nodes.forEach(node => {
        expect(node.hidden).toBe(false);
      });
    });

    it("すべてのエッジが表示される", () => {
      const result = computer.compute({
        searchTerms: ["存在しないポケモン"],
        edgeFilter: "all",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      // すべてのエッジが表示される
      result.edges.forEach(edge => {
        expect(edge.hidden).toBe(false);
      });
    });
  });

  describe("エッジフィルタ", () => {
    it("advantageフィルタで有利エッジのみ表示", () => {
      const result = computer.compute({
        searchTerms: [],
        edgeFilter: "advantage",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      const edgeMap = new Map(mockData.edges.map(e => [`${e.from}-${e.to}-${e.type}`, e]));
      
      result.edges.forEach(edge => {
        const originalEdge = edgeMap.get(edge.id);
        if (originalEdge?.type === "advantage") {
          expect(edge.hidden).toBe(false);
        } else if (originalEdge?.type === "disadvantage") {
          expect(edge.hidden).toBe(true);
        }
      });
    });

    it("disadvantageフィルタで不利エッジのみ表示", () => {
      const result = computer.compute({
        searchTerms: [],
        edgeFilter: "disadvantage",
        roleFilter: [],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      const edgeMap = new Map(mockData.edges.map(e => [`${e.from}-${e.to}-${e.type}`, e]));
      
      result.edges.forEach(edge => {
        const originalEdge = edgeMap.get(edge.id);
        if (originalEdge?.type === "disadvantage") {
          expect(edge.hidden).toBe(false);
        } else if (originalEdge?.type === "advantage") {
          expect(edge.hidden).toBe(true);
        }
      });
    });
  });

  describe("ロールフィルタ", () => {
    it("特定ロールのノードのみ表示", () => {
      const result = computer.compute({
        searchTerms: [],
        edgeFilter: "all",
        roleFilter: ["アサシン", "メイジ"],
        showDirectConnectionsOnly: false,
        isInitialRender: false,
      });

      const nodeMap = new Map(result.nodes.map(n => [n.id, n]));
      
      // フィルタに含まれるロール：表示
      expect(nodeMap.get("miraidon")!.hidden).toBe(false); // アサシン
      expect(nodeMap.get("pikachu")!.hidden).toBe(false); // メイジ
      expect(nodeMap.get("venusaur")!.hidden).toBe(false); // メイジ
      
      // フィルタに含まれないロール：非表示
      expect(nodeMap.get("charizard")!.hidden).toBe(true); // ファイター
      expect(nodeMap.get("blastoise")!.hidden).toBe(true); // タンク
      expect(nodeMap.get("snorlax")!.hidden).toBe(true); // タンク
    });
  });
});