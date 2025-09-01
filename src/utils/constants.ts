import type { Role, EdgeType } from "../types";

export const ROLE_COLORS: Record<Role, string> = {
  タンク: "#4CAF50", // 緑
  サポート: "#FFEB3B", // 黄色
  メイジ: "#F44336", // 赤
  アサシン: "#2196F3", // 青
  ファイター: "#9C27B0", // 紫
};

export const EDGE_COLORS: Record<EdgeType, string> = {
  advantage: "#4CAF50", // 緑
  disadvantage: "#F44336", // 赤
};

export const MY_POOL: string[] = [
  "miraidon",
  "alolan_raichu",
  "lucario",
  "machamp",
  "buzzwole",
];
