import type React from "react";
import { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { ROLE_COLORS, EDGE_COLORS, MY_POOL } from "../utils/constants";
import type { PokemonData, Role } from "../types";

interface NetworkGraphProps {
  data: PokemonData;
  selectedPokemon: string[];
  edgeFilter: "all" | "advantage" | "disadvantage";
  roleFilter: Role[];
  showDirectConnectionsOnly: boolean;
}

interface NodeData {
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
}

interface EdgeData {
  id: string;
  from: string;
  to: string;
  color: {
    color: string;
    highlight: string;
  };
  arrows: {
    to: {
      enabled: boolean;
      scaleFactor: number;
    };
  };
  width: number;
  type: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  selectedPokemon,
  edgeFilter,
  roleFilter,
  showDirectConnectionsOnly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDatasetRef = useRef<DataSet<NodeData> | null>(null);
  const edgesDatasetRef = useRef<DataSet<EdgeData> | null>(null);

  // Initialize network
  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    // Check for isolated nodes
    const connectedNodes = new Set([
      ...data.edges.map((e) => e.from),
      ...data.edges.map((e) => e.to),
    ]);

    // Create datasets
    const nodes = new DataSet<NodeData>(
      data.nodes.map((node, index) => {
        const isIsolated = !connectedNodes.has(node.id);
        const nodeData: NodeData = {
          id: node.id,
          label: node.label,
          color: {
            background: ROLE_COLORS[node.role] || "#999",
            border: MY_POOL.includes(node.id) ? "#FFD700" : "#333",
          },
          borderWidth: MY_POOL.includes(node.id) ? 3 : 2,
          size: 15,
          font: {
            color: "#000",
            size: 11,
            bold: MY_POOL.includes(node.id) ? "bold" : undefined,
            strokeWidth: 2,
            strokeColor: "#fff",
            vadjust: -20, // ラベルを円の下に配置
          },
          role: node.role,
        };

        // Fix position for isolated nodes
        if (isIsolated) {
          const angle = (index / data.nodes.length) * Math.PI * 2;
          nodeData.x = Math.cos(angle) * 800;
          nodeData.y = Math.sin(angle) * 800;
          nodeData.physics = false; // Disable physics for isolated nodes
        }

        return nodeData;
      }),
    );

    const edges = new DataSet<EdgeData>(
      data.edges.map((edge) => ({
        id: `${edge.from}-${edge.to}-${edge.type}`,
        from: edge.from,
        to: edge.to,
        color: {
          color: EDGE_COLORS[edge.type],
          highlight: EDGE_COLORS[edge.type],
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8,
          },
        },
        width: 1.5,
        type: edge.type,
      })),
    );

    nodesDatasetRef.current = nodes;
    edgesDatasetRef.current = edges;

    const options = {
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0,
        },
        maxVelocity: 30,
        minVelocity: 0.1,
        solver: "forceAtlas2Based" as const,
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 100,
          onlyDynamicEdges: false,
          fit: true,
        },
        timestep: 0.35,
        adaptiveTimestep: true,
      },
      interaction: {
        hover: true,
        tooltipDelay: 300,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        keyboard: {
          enabled: true,
        },
        zoomView: true,
      },
      layout: {
        improvedLayout: false,
        clusterThreshold: 150,
      },
      nodes: {
        shape: "dot" as const,
        scaling: {
          min: 10,
          max: 25,
        },
        mass: 1,
      },
      edges: {
        smooth: {
          enabled: true,
          type: "continuous" as const,
          roundness: 0.5,
        },
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes, edges },
      options,
    );
    networkRef.current = network;

    // Stop physics after stabilization to prevent continuous movement
    network.on("stabilizationIterationsDone", () => {
      network.setOptions({ physics: { enabled: false } });
    });

    // Enable physics temporarily when dragging nodes
    network.on("dragStart", () => {
      network.setOptions({ physics: { enabled: true } });
    });

    network.on("dragEnd", () => {
      setTimeout(() => {
        network.setOptions({ physics: { enabled: false } });
      }, 2000);
    });

    return () => {
      network.destroy();
    };
  }, [data]);

  // Handle selection and filtering
  useEffect(() => {
    if (
      !networkRef.current ||
      !nodesDatasetRef.current ||
      !edgesDatasetRef.current
    )
      return;
    if (!data || !data.nodes || data.nodes.length === 0) return;

    if (selectedPokemon.length === 0) {
      // Reset all nodes to normal appearance when no search
      nodesDatasetRef.current.update(
        data.nodes.map((node) => ({
          id: node.id,
          hidden: false,
          opacity: 1,
          size: 15,
          color: {
            background: ROLE_COLORS[node.role] || "#999",
            border: MY_POOL.includes(node.id) ? "#FFD700" : "#333",
          },
          borderWidth: MY_POOL.includes(node.id) ? 3 : 2,
          font: {
            color: "#000",
            size: 11,
            bold: MY_POOL.includes(node.id) ? "bold" : undefined,
            strokeWidth: 2,
            strokeColor: "#fff",
            vadjust: -20,
          },
        })),
      );
      if (edgesDatasetRef.current) {
        edgesDatasetRef.current.update(
          data.edges.map((edge) => ({
            id: `${edge.from}-${edge.to}-${edge.type}`,
            hidden: false,
            color: {
              color: EDGE_COLORS[edge.type],
              opacity: 1,
            },
            width: 1.5,
          })),
        );
      }
      networkRef.current.unselectAll();
      return;
    }

    // Find matching nodes
    const matchingNodes = selectedPokemon
      .flatMap((searchTerm) => {
        // Handle both Japanese and English search terms
        const trimmedSearch = searchTerm.trim();

        // Find all nodes that match (including move variations)
        return data.nodes.filter((n) => {
          // First, check for exact match (including move variations)
          if (n.label === trimmedSearch) return true;
          if (n.id.toLowerCase() === trimmedSearch.toLowerCase()) return true;

          // Check if search includes parentheses (searching for specific move)
          if (trimmedSearch.includes("(") || trimmedSearch.includes("（")) {
            // For move-specific searches, only match if label includes the search term
            return n.label.includes(trimmedSearch);
          }

          // For base pokemon searches (no parentheses)
          // Check ID (English, lowercase) - also handle move variations
          const baseId = n.id.split("_")[0]; // Get base pokemon ID without move suffix
          if (baseId.toLowerCase() === trimmedSearch.toLowerCase()) return true;

          // Check label (Japanese, exact or partial match)
          const baseLabel = n.label.split("(")[0].trim(); // Get base pokemon name without move
          if (baseLabel === trimmedSearch) return true;
          if (n.label.includes(trimmedSearch)) return true;

          return false;
        });
      })
      .filter(
        (node, index, self) =>
          // Remove duplicates
          self.findIndex((n) => n.id === node.id) === index,
      );

    // If no nodes match, don't proceed
    if (matchingNodes.length === 0) {
      // Reset all nodes to dimmed state
      nodesDatasetRef.current.update(
        data.nodes.map((node) => ({
          id: node.id,
          hidden: false,
          opacity: 0.1,
          color: {
            background: `${ROLE_COLORS[node.role] || "#999"}15`,
            border: "#33333315",
          },
          borderWidth: MY_POOL.includes(node.id) ? 2 : 1,
          size: 15,
          font: {
            color: "#00000015",
            size: 11,
            bold: MY_POOL.includes(node.id) ? "bold" : undefined,
            strokeWidth: 1,
            strokeColor: "#ffffff15",
            vadjust: -20,
          },
        })),
      );
      if (edgesDatasetRef.current) {
        edgesDatasetRef.current.update(
          data.edges.map((edge) => ({
            id: `${edge.from}-${edge.to}-${edge.type}`,
            hidden: false,
            color: {
              color: `${EDGE_COLORS[edge.type]}0A`,
              opacity: 0.05,
            },
            width: 0.3,
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 0.3,
              },
            },
          })),
        );
      }
      return;
    }

    const matchingNodeIds = new Set(
      matchingNodes.map((n) => n?.id).filter(Boolean) as string[],
    );

    // Find connected nodes and edges
    const connectedNodeIds = new Set(matchingNodeIds);
    const connectedEdgeIds = new Set<string>();

    if (showDirectConnectionsOnly) {
      // Only show nodes directly connected to selected nodes
      for (const edge of data.edges) {
        if (matchingNodeIds.has(edge.from)) {
          connectedNodeIds.add(edge.to);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
        if (matchingNodeIds.has(edge.to)) {
          connectedNodeIds.add(edge.from);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }
    } else {
      // Show all connections (current behavior - includes secondary connections)
      for (const edge of data.edges) {
        if (matchingNodeIds.has(edge.from)) {
          connectedNodeIds.add(edge.to);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
        if (matchingNodeIds.has(edge.to)) {
          connectedNodeIds.add(edge.from);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }

      // Find secondary connections (nodes connected to the directly connected nodes)
      const firstLevelConnected = new Set(connectedNodeIds);
      for (const edge of data.edges) {
        if (
          firstLevelConnected.has(edge.from) &&
          !matchingNodeIds.has(edge.from)
        ) {
          connectedNodeIds.add(edge.to);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
        if (firstLevelConnected.has(edge.to) && !matchingNodeIds.has(edge.to)) {
          connectedNodeIds.add(edge.from);
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }
    }

    // Update node appearance with role filter consideration
    nodesDatasetRef.current.update(
      data.nodes.map((node) => {
        const isSelected = matchingNodeIds.has(node.id);
        const isConnected = connectedNodeIds.has(node.id);
        const isDimmed = !isSelected && !isConnected;

        // Apply role filter - hide nodes that don't match the role filter
        const isRoleFiltered =
          roleFilter.length > 0 &&
          roleFilter.length < 5 &&
          !roleFilter.includes(node.role);

        return {
          id: node.id,
          hidden: isRoleFiltered,
          opacity: isDimmed ? 0.1 : 1,
          color: {
            background: isDimmed
              ? `${ROLE_COLORS[node.role] || "#999"}15`
              : ROLE_COLORS[node.role] || "#999",
            border: isSelected
              ? "#FFD700"
              : MY_POOL.includes(node.id) && !isDimmed
                ? "#FFD700"
                : isDimmed
                  ? "#33333315"
                  : "#333",
          },
          borderWidth: isSelected
            ? 4
            : MY_POOL.includes(node.id) && !isDimmed
              ? 3
              : isDimmed
                ? 1
                : 2,
          size: isSelected ? 20 : 15,
          font: {
            color: isDimmed ? "#00000015" : "#000",
            size: isSelected ? 12 : 11,
            bold: isSelected || MY_POOL.includes(node.id) ? "bold" : undefined,
            strokeWidth: isDimmed ? 1 : 2,
            strokeColor: isDimmed ? "#ffffff15" : "#fff",
            vadjust: -20,
          },
        };
      }),
    );

    // Update edge appearance with role filter consideration
    edgesDatasetRef.current.update(
      data.edges.map((edge) => {
        const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
        const isConnected = connectedEdgeIds.has(edgeId);

        // Find the nodes to check their roles
        const fromNode = data.nodes.find((n) => n.id === edge.from);
        const toNode = data.nodes.find((n) => n.id === edge.to);

        // Hide edge if either node is role-filtered
        const isRoleFiltered =
          roleFilter.length > 0 &&
          roleFilter.length < 5 &&
          ((fromNode && !roleFilter.includes(fromNode.role)) ||
            (toNode && !roleFilter.includes(toNode.role)));

        return {
          id: edgeId,
          hidden: isRoleFiltered,
          color: {
            color: isConnected
              ? EDGE_COLORS[edge.type]
              : `${EDGE_COLORS[edge.type]}0A`,
            opacity: isConnected ? 1 : 0.05,
          },
          width: isConnected ? 2 : 0.3,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: isConnected ? 1 : 0.3,
            },
          },
        };
      }),
    );

    // Select and focus on searched nodes
    if (matchingNodeIds.size > 0) {
      try {
        networkRef.current.selectNodes(Array.from(matchingNodeIds));

        // Delay fit to ensure DOM updates are complete
        setTimeout(() => {
          if (!networkRef.current || !nodesDatasetRef.current) return;

          // Only fit if we have nodes to focus on
          if (connectedNodeIds.size > 0) {
            // Verify nodes exist in the dataset before fitting
            const existingNodes = Array.from(connectedNodeIds).filter(
              (nodeId) => {
                try {
                  const node = nodesDatasetRef.current?.get(nodeId);
                  return node !== null && node !== undefined;
                } catch {
                  return false;
                }
              },
            );

            if (existingNodes.length > 0) {
              try {
                networkRef.current.fit({
                  nodes: existingNodes,
                  animation: {
                    duration: 500,
                    easingFunction: "easeInOutQuad",
                  },
                });
              } catch (fitError) {
                console.error("Error in fit operation:", fitError);
              }
            }
          }
        }, 100);
      } catch (error) {
        console.error("Error selecting nodes:", error);
      }
    }
  }, [selectedPokemon, data, showDirectConnectionsOnly, roleFilter]);

  // Handle edge filtering combined with search selection
  useEffect(() => {
    if (!edgesDatasetRef.current || !nodesDatasetRef.current) return;

    const allEdges = data.edges;
    let filteredEdges = allEdges;

    // Apply edge type filter
    if (edgeFilter !== "all") {
      filteredEdges = allEdges.filter((edge) => edge.type === edgeFilter);
    }

    // If there are selected Pokemon, determine which edges to highlight
    const connectedEdgeIds = new Set<string>();
    if (selectedPokemon.length > 0) {
      // Find matching nodes (including move variations)
      const matchingNodes = selectedPokemon
        .flatMap((searchTerm) => {
          const trimmedSearch = searchTerm.trim();
          return data.nodes.filter((n) => {
            // First, check for exact match (including move variations)
            if (n.label === trimmedSearch) return true;
            if (n.id.toLowerCase() === trimmedSearch.toLowerCase()) return true;

            // Check if search includes parentheses (searching for specific move)
            if (trimmedSearch.includes("(") || trimmedSearch.includes("（")) {
              // For move-specific searches, only match if label includes the search term
              return n.label.includes(trimmedSearch);
            }

            // For base pokemon searches (no parentheses)
            // Check ID (English, lowercase) - also handle move variations
            const baseId = n.id.split("_")[0];
            if (baseId.toLowerCase() === trimmedSearch.toLowerCase())
              return true;

            // Check label (Japanese, exact or partial match)
            const baseLabel = n.label.split("(")[0].trim();
            if (baseLabel === trimmedSearch) return true;
            if (n.label.includes(trimmedSearch)) return true;
            return false;
          });
        })
        .filter(
          (node, index, self) =>
            // Remove duplicates
            self.findIndex((n) => n.id === node.id) === index,
        );

      const matchingNodeIds = new Set(
        matchingNodes.map((n) => n?.id).filter(Boolean) as string[],
      );

      // Find connected edges
      for (const edge of filteredEdges) {
        if (matchingNodeIds.has(edge.from) || matchingNodeIds.has(edge.to)) {
          connectedEdgeIds.add(`${edge.from}-${edge.to}-${edge.type}`);
        }
      }
    }

    // Update edges with appropriate styling
    edgesDatasetRef.current.clear();
    edgesDatasetRef.current.add(
      filteredEdges.map((edge) => {
        const edgeId = `${edge.from}-${edge.to}-${edge.type}`;
        const isConnected =
          selectedPokemon.length === 0 || connectedEdgeIds.has(edgeId);

        return {
          id: edgeId,
          from: edge.from,
          to: edge.to,
          color: {
            color: isConnected
              ? EDGE_COLORS[edge.type]
              : `${EDGE_COLORS[edge.type]}0A`,
            highlight: EDGE_COLORS[edge.type],
            opacity: isConnected ? 1 : 0.05,
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: isConnected ? 0.8 : 0.3,
            },
          },
          width: isConnected ? 1.5 : 0.3,
          type: edge.type,
        };
      }),
    );
  }, [edgeFilter, data, selectedPokemon]);

  // Handle role filtering
  useEffect(() => {
    if (!nodesDatasetRef.current) return;

    // If search is active, role filter should be applied within search results
    // If no search, role filter applies to all nodes
    if (selectedPokemon.length > 0) {
      // Role filtering is handled within search effect, skip here
      return;
    }

    const allNodes = data.nodes;
    let visibleNodeIds: string[];

    if (roleFilter.length === 0 || roleFilter.length === 5) {
      visibleNodeIds = allNodes.map((n) => n.id);
    } else {
      visibleNodeIds = allNodes
        .filter((node) => roleFilter.includes(node.role))
        .map((n) => n.id);
    }

    // Update node visibility
    nodesDatasetRef.current.update(
      allNodes.map((node) => ({
        id: node.id,
        hidden: !visibleNodeIds.includes(node.id),
      })),
    );

    // Update edge visibility
    if (edgesDatasetRef.current) {
      const allEdges = edgesDatasetRef.current.get();
      edgesDatasetRef.current.update(
        allEdges.map((edge) => ({
          id: edge.id,
          hidden:
            !visibleNodeIds.includes(edge.from) ||
            !visibleNodeIds.includes(edge.to),
        })),
      );
    }
  }, [roleFilter, data, selectedPokemon]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "750px",
      }}
    />
  );
};

export default NetworkGraph;
