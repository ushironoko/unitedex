export interface PokemonNode {
  id: string;
  label: string;
  role: Role;
}

export interface PokemonEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface PokemonData {
  nodes: PokemonNode[];
  edges: PokemonEdge[];
}

export type Role = "タンク" | "サポート" | "メイジ" | "アサシン" | "ファイター";
export type EdgeType = "advantage" | "disadvantage";

export interface UsePokemonDataReturn {
  data: PokemonData;
}
