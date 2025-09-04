import { useRef, useCallback } from "react";
import type { DataSet } from "vis-data";
import type { Node, Edge } from "vis-network";
import type { NodeState, EdgeState } from "../types";

interface DiffResult<T> {
  added: T[];
  removed: string[];
  updated: T[];
}

export function useDifferentialUpdate() {
  const prevNodesRef = useRef<Map<string, NodeState>>(new Map());
  const prevEdgesRef = useRef<Map<string, EdgeState>>(new Map());

  const diffNodes = useCallback(
    (newNodes: NodeState[]): DiffResult<NodeState> => {
      const prevNodes = prevNodesRef.current;
      const newNodeMap = new Map(newNodes.map((n) => [n.id, n]));

      const added: NodeState[] = [];
      const removed: string[] = [];
      const updated: NodeState[] = [];

      // 新規・更新ノードの検出
      for (const node of newNodes) {
        const prevNode = prevNodes.get(node.id);
        if (!prevNode) {
          added.push(node);
        } else if (hasNodeChanged(prevNode, node)) {
          updated.push(node);
        }
      }

      // 削除されたノードの検出
      for (const [id] of prevNodes) {
        if (!newNodeMap.has(id)) {
          removed.push(id);
        }
      }

      prevNodesRef.current = newNodeMap;
      return { added, removed, updated };
    },
    [],
  );

  const diffEdges = useCallback(
    (newEdges: EdgeState[]): DiffResult<EdgeState> => {
      const prevEdges = prevEdgesRef.current;
      const newEdgeMap = new Map(newEdges.map((e) => [e.id, e]));

      const added: EdgeState[] = [];
      const removed: string[] = [];
      const updated: EdgeState[] = [];

      // 新規・更新エッジの検出
      for (const edge of newEdges) {
        const prevEdge = prevEdges.get(edge.id);
        if (!prevEdge) {
          added.push(edge);
        } else if (hasEdgeChanged(prevEdge, edge)) {
          updated.push(edge);
        }
      }

      // 削除されたエッジの検出
      for (const [id] of prevEdges) {
        if (!newEdgeMap.has(id)) {
          removed.push(id);
        }
      }

      prevEdgesRef.current = newEdgeMap;
      return { added, removed, updated };
    },
    [],
  );

  const applyNodeDiff = useCallback(
    (
      dataSet: DataSet<Node>,
      diff: DiffResult<NodeState>,
      preservePositions = true,
    ) => {
      const operations: Array<() => void> = [];

      if (diff.removed.length > 0) {
        operations.push(() => dataSet.remove(diff.removed));
      }

      if (diff.added.length > 0) {
        operations.push(() => dataSet.add(diff.added));
      }

      if (diff.updated.length > 0) {
        const updates = preservePositions
          ? diff.updated.map(({ x, y, ...node }) => node)
          : diff.updated;
        operations.push(() => dataSet.update(updates));
      }

      // バッチ実行
      if (operations.length > 0) {
        operations.forEach((op) => op());
      }

      return operations.length > 0;
    },
    [],
  );

  const applyEdgeDiff = useCallback(
    (dataSet: DataSet<Edge>, diff: DiffResult<EdgeState>) => {
      const operations: Array<() => void> = [];

      if (diff.removed.length > 0) {
        operations.push(() => dataSet.remove(diff.removed));
      }

      if (diff.added.length > 0) {
        operations.push(() => dataSet.add(diff.added));
      }

      if (diff.updated.length > 0) {
        operations.push(() => dataSet.update(diff.updated));
      }

      // バッチ実行
      if (operations.length > 0) {
        operations.forEach((op) => op());
      }

      return operations.length > 0;
    },
    [],
  );

  return {
    diffNodes,
    diffEdges,
    applyNodeDiff,
    applyEdgeDiff,
  };
}

function hasNodeChanged(prev: NodeState, next: NodeState): boolean {
  return (
    prev.hidden !== next.hidden ||
    prev.opacity !== next.opacity ||
    prev.size !== next.size ||
    prev.borderWidth !== next.borderWidth ||
    JSON.stringify(prev.color) !== JSON.stringify(next.color) ||
    JSON.stringify(prev.font) !== JSON.stringify(next.font)
  );
}

function hasEdgeChanged(prev: EdgeState, next: EdgeState): boolean {
  return (
    prev.hidden !== next.hidden ||
    prev.width !== next.width ||
    JSON.stringify(prev.color) !== JSON.stringify(next.color) ||
    JSON.stringify(prev.arrows) !== JSON.stringify(next.arrows)
  );
}
