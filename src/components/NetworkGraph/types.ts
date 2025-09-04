import type { PokemonData, Role } from "../../types";

export interface NetworkGraphProps {
  data: PokemonData;
  selectedPokemon: string[];
  edgeFilter: "all" | "advantage" | "disadvantage";
  roleFilter: Role[];
  showDirectConnectionsOnly: boolean;
}

export interface NodeData {
  id: string;
  label: string;
  color: {
    background: string;
    border: string;
  };
  borderWidth: number;
  size: number;
  font: {
    color: string;
    size: number;
    bold?: string;
    strokeWidth: number;
    strokeColor: string;
    vadjust?: number;
  };
  role: Role;
  x?: number;
  y?: number;
  physics?: boolean;
  hidden?: boolean;
  opacity?: number;
}

export interface EdgeData {
  id: string;
  from: string;
  to: string;
  color: {
    color: string;
    highlight: string;
    opacity?: number;
  };
  arrows: {
    to: {
      enabled: boolean;
      scaleFactor: number;
    };
  };
  width: number;
  type: string;
  hidden?: boolean;
}

export interface NetworkRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  networkRef: React.MutableRefObject<
    import("vis-network/standalone").Network | null
  >;
  nodesDatasetRef: React.MutableRefObject<
    import("vis-data").DataSet<NodeData> | null
  >;
  edgesDatasetRef: React.MutableRefObject<
    import("vis-data").DataSet<EdgeData> | null
  >;
}

export interface NodeState {
  id: string;
  label: string;
  hidden: boolean;
  opacity: number;
  size: number;
  color: {
    background: string;
    border: string;
  };
  borderWidth: number;
  font: {
    color: string;
    size: number;
    bold?: string;
    strokeWidth: number;
    strokeColor: string;
    vadjust: number;
  };
  x?: number;
  y?: number;
}

export interface EdgeState {
  id: string;
  from: string;
  to: string;
  hidden: boolean;
  color: {
    color: string;
    opacity: number;
  };
  width: number;
  arrows: {
    to: {
      enabled: boolean;
      scaleFactor: number;
    };
  };
}

export interface GraphState {
  nodes: NodeState[];
  edges: EdgeState[];
}
