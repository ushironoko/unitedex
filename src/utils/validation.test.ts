import { describe, it, expect } from "vitest";
import { validatePokemonData } from "./validation";
import type { PokemonData } from "../types";

describe("validatePokemonData", () => {
  describe("ノードIDのバリデーション", () => {
    it("英名のみのIDを受け入れる", () => {
      const data: PokemonData = {
        nodes: [
          { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
          { id: "mewtwo_y", label: "ミュウツーY", role: "メイジ" },
        ],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(true);
    });

    it("英名_日本語技名のIDを受け入れる", () => {
      const data: PokemonData = {
        nodes: [
          {
            id: "absol_サイコカッター",
            label: "アブソル (サイコカッター)",
            role: "アサシン",
          },
          {
            id: "tsareena_ふみつけ",
            label: "アマージョ (ふみつけ)",
            role: "ファイター",
          },
          {
            id: "lucario_しんそく",
            label: "ルカリオ (しんそく)",
            role: "ファイター",
          },
        ],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(true);
    });

    it("特殊文字を含む技名のIDを受け入れる", () => {
      const data: PokemonData = {
        nodes: [
          {
            id: "lucario_しんそく+ボーンラッシュ",
            label: "ルカリオ (しんそく+ボーンラッシュ)",
            role: "ファイター",
          },
          {
            id: "pikachu_10まんボルト",
            label: "ピカチュウ (10まんボルト)",
            role: "メイジ",
          },
          {
            id: "pikachu_10 万ボルト",
            label: "ピカチュウ (10 万ボルト)",
            role: "メイジ",
          },
          {
            id: "snorlax_ヘビーボンバー・じしん",
            label: "カビゴン (ヘビーボンバー・じしん)",
            role: "タンク",
          },
        ],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(true);
    });

    it("不正な形式のIDを拒否する", () => {
      const data: PokemonData = {
        nodes: [
          { id: "ピカチュウ", label: "ピカチュウ", role: "メイジ" }, // 日本語のみ
        ],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("IDは英名または英名_技名の形式");
    });

    it("大文字で始まるIDを拒否する", () => {
      const data: PokemonData = {
        nodes: [{ id: "Pikachu", label: "ピカチュウ", role: "メイジ" }],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(false);
    });
  });

  describe("エッジのバリデーション", () => {
    it("正しい形式のエッジを受け入れる", () => {
      const data: PokemonData = {
        nodes: [
          { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
          { id: "charizard", label: "リザードン", role: "ファイター" },
        ],
        edges: [{ from: "pikachu", to: "charizard", type: "advantage" }],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(true);
    });

    it("日本語技名を含むエッジを受け入れる", () => {
      const data: PokemonData = {
        nodes: [
          {
            id: "absol_サイコカッター",
            label: "アブソル (サイコカッター)",
            role: "アサシン",
          },
          {
            id: "tsareena_ふみつけ",
            label: "アマージョ (ふみつけ)",
            role: "ファイター",
          },
        ],
        edges: [
          {
            from: "absol_サイコカッター",
            to: "tsareena_ふみつけ",
            type: "disadvantage",
          },
        ],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(true);
    });

    it("存在しないノードを参照するエッジを拒否する", () => {
      const data: PokemonData = {
        nodes: [{ id: "pikachu", label: "ピカチュウ", role: "メイジ" }],
        edges: [
          { from: "pikachu", to: "charizard", type: "advantage" }, // charizardは存在しない
        ],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("エッジが存在しないノードを参照");
    });
  });

  describe("ロールのバリデーション", () => {
    it("有効なロールを受け入れる", () => {
      const validRoles = [
        "タンク",
        "サポート",
        "メイジ",
        "アサシン",
        "ファイター",
      ] as const;

      validRoles.forEach((role) => {
        const data: PokemonData = {
          nodes: [{ id: "pikachu", label: "ピカチュウ", role }],
          edges: [],
        };

        const result = validatePokemonData(data);
        expect(result.success).toBe(true);
      });
    });

    it("無効なロールを拒否する", () => {
      const data = {
        nodes: [{ id: "pikachu", label: "ピカチュウ", role: "無効なロール" }],
        edges: [],
      };

      const result = validatePokemonData(data);
      expect(result.success).toBe(false);
    });
  });

  describe("実際のデータで検証", () => {
    it("実際のpokemonMatchupDataの一部を検証できる", () => {
      const data: PokemonData = {
        nodes: [
          {
            id: "absol_サイコカッター",
            label: "アブソル (サイコカッター)",
            role: "アサシン",
          },
          {
            id: "absol_ふいうち",
            label: "アブソル (ふいうち)",
            role: "アサシン",
          },
          {
            id: "tsareena_トリプルアクセル",
            label: "アマージョ (トリプルアクセル)",
            role: "ファイター",
          },
          {
            id: "tsareena_ふみつけ",
            label: "アマージョ (ふみつけ)",
            role: "ファイター",
          },
          {
            id: "alolan_ninetales_ふぶき",
            label: "アローラキュウコン (ふぶき)",
            role: "メイジ",
          },
          {
            id: "alolan_raichu_エレキボール",
            label: "アローラライチュウ (エレキボール)",
            role: "メイジ",
          },
          {
            id: "crustle_シザークロス",
            label: "イワパレス (シザークロス)",
            role: "タンク",
          },
          {
            id: "inteleon_ねらいうち",
            label: "インテレオン (ねらいうち)",
            role: "メイジ",
          },
          { id: "urshifu", label: "ウーラオス", role: "ファイター" },
          { id: "pikachu", label: "ピカチュウ", role: "メイジ" },
          { id: "charizard", label: "リザードン", role: "ファイター" },
          { id: "blastoise", label: "カメックス", role: "タンク" },
        ],
        edges: [
          {
            from: "absol_サイコカッター",
            to: "tsareena_トリプルアクセル",
            type: "advantage",
          },
          {
            from: "absol_ふいうち",
            to: "alolan_ninetales_ふぶき",
            type: "disadvantage",
          },
          { from: "pikachu", to: "charizard", type: "advantage" },
          { from: "pikachu", to: "blastoise", type: "disadvantage" },
          { from: "charizard", to: "urshifu", type: "advantage" },
        ],
      };

      const result = validatePokemonData(data);
      if (!result.success) {
        console.log("Validation errors:", result.errors);
      }
      expect(result.success).toBe(true);
    });
  });
});
