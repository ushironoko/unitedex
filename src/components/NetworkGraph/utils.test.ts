import { describe, it, expect } from "vitest";
import type { Role, EdgeType } from "../../types";
import {
  isNodeMatchingSearch,
  getMatchingNodes,
  getConnectedElementIds,
  createNodeData,
  createEdgeData,
  createNodeUpdateData,
  createEdgeUpdateData,
  createResetNodeData,
  createResetEdgeData,
} from "./utils";

// テスト用のモックデータ
const mockNodes = [
  { id: "pikachu", label: "ピカチュウ", role: "メイジ" as Role },
  {
    id: "pikachu_agility",
    label: "ピカチュウ(アジリティ)",
    role: "メイジ" as Role,
  },
  { id: "charizard", label: "リザードン", role: "ファイター" as Role },
  { id: "blastoise", label: "カメックス", role: "タンク" as Role },
  { id: "venusaur", label: "フシギバナ", role: "メイジ" as Role },
];

const mockEdges = [
  { from: "pikachu", to: "charizard", type: "advantage" as EdgeType },
  {
    from: "pikachu_agility",
    to: "blastoise",
    type: "disadvantage" as EdgeType,
  },
  { from: "charizard", to: "venusaur", type: "advantage" as EdgeType },
  { from: "blastoise", to: "venusaur", type: "disadvantage" as EdgeType },
];

describe("utils", () => {
  describe("isNodeMatchingSearch", () => {
    const node = { id: "pikachu_agility", label: "ピカチュウ(アジリティ)" };

    it("完全一致でマッチすることを確認", () => {
      expect(isNodeMatchingSearch(node, "ピカチュウ(アジリティ)")).toBe(true);
      expect(isNodeMatchingSearch(node, "pikachu_agility")).toBe(true);
    });

    it("IDの大文字小文字を無視してマッチすることを確認", () => {
      expect(isNodeMatchingSearch(node, "PIKACHU_AGILITY")).toBe(true);
      expect(isNodeMatchingSearch(node, "Pikachu_Agility")).toBe(true);
    });

    it("括弧が含まれている場合の部分一致を確認", () => {
      expect(isNodeMatchingSearch(node, "(アジリティ)")).toBe(true);
      expect(isNodeMatchingSearch(node, "ピカチュウ(")).toBe(true);
    });

    it("ベースポケモン名でマッチすることを確認", () => {
      expect(isNodeMatchingSearch(node, "ピカチュウ")).toBe(true);
      expect(isNodeMatchingSearch(node, "pikachu")).toBe(true);
    });

    it("部分一致でマッチすることを確認", () => {
      expect(isNodeMatchingSearch(node, "アジリティ")).toBe(true);
    });

    it("マッチしない場合を確認", () => {
      expect(isNodeMatchingSearch(node, "リザードン")).toBe(false);
      expect(isNodeMatchingSearch(node, "存在しない")).toBe(false);
    });

    it("空文字やスペースのみの検索語を適切に処理することを確認", () => {
      expect(isNodeMatchingSearch(node, "")).toBe(false);
      expect(isNodeMatchingSearch(node, "   ")).toBe(false);
    });
  });

  describe("getMatchingNodes", () => {
    it("単一の検索語でマッチするノードを取得", () => {
      const result = getMatchingNodes(["ピカチュウ"], mockNodes);
      expect(result).toHaveLength(2);
      expect(result.map((n) => n.id)).toContain("pikachu");
      expect(result.map((n) => n.id)).toContain("pikachu_agility");
    });

    it("複数の検索語でマッチするノードを取得", () => {
      const result = getMatchingNodes(["ピカチュウ", "リザードン"], mockNodes);
      expect(result).toHaveLength(3);
      expect(result.map((n) => n.id)).toContain("pikachu");
      expect(result.map((n) => n.id)).toContain("pikachu_agility");
      expect(result.map((n) => n.id)).toContain("charizard");
    });

    it("重複するマッチを除去することを確認", () => {
      const result = getMatchingNodes(["ピカチュウ", "pikachu"], mockNodes);
      expect(result).toHaveLength(2);
      const ids = result.map((n) => n.id);
      expect(new Set(ids)).toHaveProperty("size", ids.length);
    });

    it("マッチしない検索語の場合、空配列を返すことを確認", () => {
      const result = getMatchingNodes(["存在しない"], mockNodes);
      expect(result).toHaveLength(0);
    });

    it("空の検索語配列の場合、空配列を返すことを確認", () => {
      const result = getMatchingNodes([], mockNodes);
      expect(result).toHaveLength(0);
    });
  });

  describe("getConnectedElementIds", () => {
    const matchingNodeIds = new Set(["pikachu"]);

    it("直接接続のみの場合、接続されたノードとエッジを取得", () => {
      const result = getConnectedElementIds(matchingNodeIds, mockEdges, true);

      expect(result.connectedNodeIds.has("pikachu")).toBe(true);
      expect(result.connectedNodeIds.has("charizard")).toBe(true);
      expect(result.connectedNodeIds.size).toBe(2);

      expect(result.connectedEdgeIds.has("pikachu-charizard-advantage")).toBe(
        true,
      );
      expect(result.connectedEdgeIds.size).toBe(1);
    });

    it("二次接続も含む場合、より多くのノードとエッジを取得", () => {
      const result = getConnectedElementIds(matchingNodeIds, mockEdges, false);

      expect(result.connectedNodeIds.has("pikachu")).toBe(true);
      expect(result.connectedNodeIds.has("charizard")).toBe(true);
      expect(result.connectedNodeIds.has("venusaur")).toBe(true);
      expect(result.connectedNodeIds.size).toBe(3);

      expect(result.connectedEdgeIds.has("pikachu-charizard-advantage")).toBe(
        true,
      );
      expect(result.connectedEdgeIds.has("charizard-venusaur-advantage")).toBe(
        true,
      );
      expect(result.connectedEdgeIds.size).toBe(2);
    });

    it("複数の選択ノードからの接続を処理", () => {
      const multipleMatching = new Set(["pikachu", "blastoise"]);
      const result = getConnectedElementIds(multipleMatching, mockEdges, true);

      expect(result.connectedNodeIds.has("pikachu")).toBe(true);
      expect(result.connectedNodeIds.has("blastoise")).toBe(true);
      expect(result.connectedNodeIds.has("charizard")).toBe(true);
      expect(result.connectedNodeIds.has("venusaur")).toBe(true);
    });

    it("接続のないノードの場合、そのノードのみを返す", () => {
      const isolatedNodeIds = new Set(["isolated"]);
      const result = getConnectedElementIds(isolatedNodeIds, mockEdges, true);

      expect(result.connectedNodeIds.has("isolated")).toBe(true);
      expect(result.connectedNodeIds.size).toBe(1);
      expect(result.connectedEdgeIds.size).toBe(0);
    });
  });

  describe("createNodeData", () => {
    const node = {
      id: "pikachu",
      label: "ピカチュウ",
      role: "attacker" as Role,
    };
    const connectedNodes = new Set(["pikachu", "charizard"]);

    it("接続されたノードのデータを正しく作成", () => {
      const result = createNodeData(node, 0, 10, connectedNodes);

      expect(result.id).toBe("pikachu");
      expect(result.label).toBe("ピカチュウ");
      expect(result.role).toBe("attacker");
      expect(result.color.background).toBeDefined();
      expect(result.color.border).toBeDefined();
      expect(result.borderWidth).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThan(0);
      expect(result.font).toBeDefined();
      expect(result.x).toBeUndefined(); // 接続されているノードは座標固定されない
      expect(result.y).toBeUndefined();
    });

    it("孤立したノードのデータを正しく作成", () => {
      const isolatedConnected = new Set(["charizard"]);
      const result = createNodeData(node, 0, 10, isolatedConnected);

      expect(result.id).toBe("pikachu");
      expect(result.x).toBeUndefined(); // 孤立ノードも座標は設定されない（物理エンジンに任せる）
      expect(result.y).toBeUndefined();
      expect(result.physics).toBeUndefined();
    });

    it("インデックスに基づいて同じ形式のデータを生成", () => {
      const node1 = {
        id: "pikachu",
        label: "ピカチュウ",
        role: "メイジ" as Role,
      };
      const node2 = {
        id: "charizard",
        label: "リザードン",
        role: "ファイター" as Role,
      };
      const isolatedConnected = new Set(["blastoise"]); // どちらも含まれない
      const result1 = createNodeData(node1, 0, 10, isolatedConnected);
      const result2 = createNodeData(node2, 1, 10, isolatedConnected);

      expect(result1.x).toBeUndefined();
      expect(result1.y).toBeUndefined();
      expect(result2.x).toBeUndefined();
      expect(result2.y).toBeUndefined();
    });
  });

  describe("createEdgeData", () => {
    const edge = {
      from: "pikachu",
      to: "charizard",
      type: "advantage" as EdgeType,
    };

    it("エッジデータを正しく作成", () => {
      const result = createEdgeData(edge);

      expect(result.id).toBe("pikachu-charizard-advantage");
      expect(result.from).toBe("pikachu");
      expect(result.to).toBe("charizard");
      expect(result.type).toBe("advantage");
      expect(result.color.color).toBeDefined();
      expect(result.color.highlight).toBeDefined();
      expect(result.arrows.to.enabled).toBe(true);
      expect(result.arrows.to.scaleFactor).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
    });

    it("異なるエッジタイプで異なる色を設定", () => {
      const advantageEdge = {
        from: "a",
        to: "b",
        type: "advantage" as EdgeType,
      };
      const disadvantageEdge = {
        from: "a",
        to: "b",
        type: "disadvantage" as EdgeType,
      };

      const advantageResult = createEdgeData(advantageEdge);
      const disadvantageResult = createEdgeData(disadvantageEdge);

      expect(advantageResult.color.color).not.toBe(
        disadvantageResult.color.color,
      );
    });
  });

  describe("createNodeUpdateData", () => {
    const node = { id: "pikachu", role: "メイジ" as Role };

    it("選択されたノードの更新データを作成", () => {
      const result = createNodeUpdateData(node, true, true, false);

      expect(result.id).toBe("pikachu");
      expect(result.hidden).toBe(false);
      expect(result.opacity).toBe(1);
      expect(result.borderWidth).toBe(4); // 選択時は太い境界線 (BORDER_WIDTHS.selected)
      expect(result.size).toBe(20); // 選択時は大きいサイズ (NODE_SIZES.selected)
    });

    it("薄く表示されるノードの更新データを作成", () => {
      const result = createNodeUpdateData(node, false, false, false);

      expect(result.id).toBe("pikachu");
      expect(result.hidden).toBe(false);
      expect(result.opacity).toBeLessThan(1);
      expect(result.color.background).toContain("15"); // 透明度が追加される
      expect(result.font.color).toContain("15");
    });

    it("ロールフィルタで隠されるノードの更新データを作成", () => {
      const result = createNodeUpdateData(node, false, true, true);

      expect(result.id).toBe("pikachu");
      expect(result.hidden).toBe(true);
    });

    it("接続されたノードの更新データを作成", () => {
      const result = createNodeUpdateData(node, false, true, false);

      expect(result.id).toBe("pikachu");
      expect(result.hidden).toBe(false);
      expect(result.opacity).toBe(1);
    });
  });

  describe("createEdgeUpdateData", () => {
    const edge = {
      from: "pikachu",
      to: "charizard",
      type: "advantage" as EdgeType,
    };

    it("接続されたエッジの更新データを作成", () => {
      const result = createEdgeUpdateData(edge, true, false);

      expect(result.id).toBe("pikachu-charizard-advantage");
      expect(result.hidden).toBe(false);
      expect(result.color.opacity).toBe(1);
      expect(result.width).toBeGreaterThan(1);
      expect(result.arrows.to.scaleFactor).toBeGreaterThan(0.5);
    });

    it("薄く表示されるエッジの更新データを作成", () => {
      const result = createEdgeUpdateData(edge, false, false);

      expect(result.id).toBe("pikachu-charizard-advantage");
      expect(result.hidden).toBe(false);
      expect(result.color.color).toContain("0A"); // 透明度が追加される
      expect(result.color.opacity).toBeLessThan(1);
      expect(result.width).toBeLessThan(1);
      expect(result.arrows.to.scaleFactor).toBeLessThan(0.5);
    });

    it("ロールフィルタで隠されるエッジの更新データを作成", () => {
      const result = createEdgeUpdateData(edge, true, true);

      expect(result.id).toBe("pikachu-charizard-advantage");
      expect(result.hidden).toBe(true);
    });
  });

  describe("createResetNodeData", () => {
    const node = { id: "pikachu", role: "メイジ" as Role };

    it("リセット時のノードデータを作成", () => {
      const result = createResetNodeData(node);

      expect(result.id).toBe("pikachu");
      expect(result.hidden).toBe(false);
      expect(result.opacity).toBe(1);
      expect(result.color.background).toBeDefined();
      expect(result.color.border).toBeDefined();
      expect(result.borderWidth).toBeGreaterThan(0);
      expect(result.font.color).toBe("#000");
      expect(result.font.strokeColor).toBe("#fff");
    });
  });

  describe("createResetEdgeData", () => {
    const edge = {
      from: "pikachu",
      to: "charizard",
      type: "advantage" as EdgeType,
    };

    it("リセット時のエッジデータを作成", () => {
      const result = createResetEdgeData(edge);

      expect(result.id).toBe("pikachu-charizard-advantage");
      expect(result.hidden).toBe(false);
      expect(result.color.color).toBeDefined();
      expect(result.color.opacity).toBe(1);
      expect(result.width).toBeGreaterThan(0);
    });
  });
});
