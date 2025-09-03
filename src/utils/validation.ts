import { z } from "zod";
import type { Role, EdgeType } from "../types";

// 定義済みのロール
const VALID_ROLES: Role[] = [
  "タンク",
  "サポート",
  "メイジ",
  "アサシン",
  "ファイター",
];

// 定義済みのエッジタイプ
const VALID_EDGE_TYPES: EdgeType[] = ["advantage", "disadvantage"];

// ポケモン名と技名の形式をチェックする正規表現
// 英名_技名 または 英名のみ
// 技名には日本語（ひらがな・カタカナ・漢字）と数字、特殊文字も許可
const POKEMON_ID_PATTERN =
  /^[a-z][a-z0-9_]*(_[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBFa-zA-Z0-9_+・\s]+)?$/;

// PokemonNodeのスキーマ
const PokemonNodeSchema = z.object({
  id: z
    .string()
    .min(1)
    .refine((id) => POKEMON_ID_PATTERN.test(id), {
      message:
        "IDは英名または英名_技名の形式である必要があります（例: pikachu, mewtwo_y, lucario_しんそく）",
    }),
  label: z.string().min(1),
  role: z.enum(VALID_ROLES as [Role, ...Role[]]),
});

// PokemonEdgeのスキーマ
const PokemonEdgeSchema = z.object({
  from: z
    .string()
    .min(1)
    .refine((id) => POKEMON_ID_PATTERN.test(id), {
      message: "fromは英名または英名_技名の形式である必要があります",
    }),
  to: z
    .string()
    .min(1)
    .refine((id) => POKEMON_ID_PATTERN.test(id), {
      message: "toは英名または英名_技名の形式である必要があります",
    }),
  type: z.enum(VALID_EDGE_TYPES as [EdgeType, ...EdgeType[]]),
});

// PokemonDataのスキーマ
export const PokemonDataSchema = z
  .object({
    nodes: z.array(PokemonNodeSchema).min(1, "少なくとも1つのノードが必要です"),
    edges: z.array(PokemonEdgeSchema),
  })
  .refine(
    (data) => {
      // エッジで参照されているノードIDが存在するか確認
      const nodeIds = new Set(data.nodes.map((node) => node.id));
      const invalidEdges = data.edges.filter(
        (edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to),
      );

      return invalidEdges.length === 0;
    },
    {
      message: "エッジが存在しないノードを参照しています",
    },
  );

// バリデーション関数
export function validatePokemonData(data: unknown): {
  success: boolean;
  data?: z.infer<typeof PokemonDataSchema>;
  errors?: string[];
} {
  try {
    const validatedData = PokemonDataSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: ["不明なエラーが発生しました"],
    };
  }
}
