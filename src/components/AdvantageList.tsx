import { ChevronDown, ChevronRight } from "lucide-react";
import type React from "react";
import { memo, useMemo, useState } from "react";
import type { PokemonData, Role } from "../types";
import { ROLE_COLORS } from "../utils/constants";
import RelationPopover from "./RelationPopover";
import "../styles/AdvantageList.css";

interface PokemonNodeWithCount {
  id: string;
  label: string;
  role: Role;
  relationCount: number;
}

interface PokemonNodeWithBothCounts extends PokemonNodeWithCount {
  disadvantageCount: number;
}

interface AdvantageListProps {
  data: PokemonData;
  selectedPokemon: string[];
  showDirectConnectionsOnly: boolean;
}

const AdvantageList: React.FC<AdvantageListProps> = memo(
  ({ data, selectedPokemon, showDirectConnectionsOnly }) => {
    const [expandedSections, setExpandedSections] = useState<{
      advantage: boolean;
      disadvantage: boolean;
    }>({
      advantage: true,
      disadvantage: true,
    });

    const pokemonRelations = useMemo((): {
      advantages: PokemonNodeWithCount[];
      disadvantages: PokemonNodeWithCount[];
      both: PokemonNodeWithBothCounts[];
    } => {
      if (selectedPokemon.length === 0) {
        return { advantages: [], disadvantages: [], both: [] };
      }

      // Find matching nodes
      const matchingNodes = selectedPokemon
        .flatMap((searchTerm) => {
          const trimmedSearch = searchTerm.trim();
          return data.nodes.filter((n) => {
            if (n.label === trimmedSearch) return true;
            if (n.id.toLowerCase() === trimmedSearch.toLowerCase()) return true;

            if (trimmedSearch.includes("(") || trimmedSearch.includes("（")) {
              return n.label.includes(trimmedSearch);
            }

            const baseId = n.id.split("_")[0];
            if (baseId.toLowerCase() === trimmedSearch.toLowerCase())
              return true;

            const baseLabel = n.label.split("(")[0].trim();
            if (baseLabel === trimmedSearch) return true;
            if (n.label.includes(trimmedSearch)) return true;
            return false;
          });
        })
        .filter(
          (node, index, self) =>
            self.findIndex((n) => n.id === node.id) === index,
        );

      if (matchingNodes.length === 0) {
        return { advantages: [], disadvantages: [], both: [] };
      }

      const matchingNodeIds = new Set(matchingNodes.map((n) => n.id));
      const advantageCount = new Map<string, number>();
      const disadvantageCount = new Map<string, number>();

      // Count relations for each matching node
      for (const edge of data.edges) {
        if (showDirectConnectionsOnly) {
          // Only count direct connections
          if (matchingNodeIds.has(edge.from) && edge.type === "advantage") {
            advantageCount.set(edge.to, (advantageCount.get(edge.to) || 0) + 1);
          }
          if (matchingNodeIds.has(edge.to) && edge.type === "disadvantage") {
            advantageCount.set(
              edge.from,
              (advantageCount.get(edge.from) || 0) + 1,
            );
          }
          if (matchingNodeIds.has(edge.from) && edge.type === "disadvantage") {
            disadvantageCount.set(
              edge.to,
              (disadvantageCount.get(edge.to) || 0) + 1,
            );
          }
          if (matchingNodeIds.has(edge.to) && edge.type === "advantage") {
            disadvantageCount.set(
              edge.from,
              (disadvantageCount.get(edge.from) || 0) + 1,
            );
          }
        } else {
          // Count all relations
          if (matchingNodeIds.has(edge.from)) {
            if (edge.type === "advantage") {
              advantageCount.set(
                edge.to,
                (advantageCount.get(edge.to) || 0) + 1,
              );
            } else if (edge.type === "disadvantage") {
              disadvantageCount.set(
                edge.to,
                (disadvantageCount.get(edge.to) || 0) + 1,
              );
            }
          }
          if (matchingNodeIds.has(edge.to)) {
            if (edge.type === "advantage") {
              disadvantageCount.set(
                edge.from,
                (disadvantageCount.get(edge.from) || 0) + 1,
              );
            } else if (edge.type === "disadvantage") {
              advantageCount.set(
                edge.from,
                (advantageCount.get(edge.from) || 0) + 1,
              );
            }
          }
        }
      }

      // Separate nodes into three categories
      const allNodeIds = new Set([
        ...advantageCount.keys(),
        ...disadvantageCount.keys(),
      ]);
      const advantageOnlyNodes: PokemonNodeWithCount[] = [];
      const disadvantageOnlyNodes: PokemonNodeWithCount[] = [];
      const bothNodes: PokemonNodeWithBothCounts[] = [];

      for (const nodeId of allNodeIds) {
        const node = data.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const advCount = advantageCount.get(nodeId) || 0;
        const disadvCount = disadvantageCount.get(nodeId) || 0;

        if (advCount > 0 && disadvCount > 0) {
          // Node has both advantage and disadvantage relations
          bothNodes.push({
            ...node,
            relationCount: advCount, // For advantage display
            disadvantageCount: disadvCount, // For disadvantage display
          });
        } else if (advCount > 0) {
          // Only advantage
          advantageOnlyNodes.push({ ...node, relationCount: advCount });
        } else if (disadvCount > 0) {
          // Only disadvantage
          disadvantageOnlyNodes.push({ ...node, relationCount: disadvCount });
        }
      }

      // Sort all arrays
      const sortFn = (a: { label: string }, b: { label: string }) => {
        if (!a || !b) return 0;
        return a.label.localeCompare(b.label);
      };

      return {
        advantages: advantageOnlyNodes.sort(sortFn),
        disadvantages: disadvantageOnlyNodes.sort(sortFn),
        both: bothNodes.sort(sortFn),
      };
    }, [data, selectedPokemon, showDirectConnectionsOnly]);

    const toggleSection = (section: "advantage" | "disadvantage") => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    };

    if (selectedPokemon.length === 0) {
      return null;
    }

    return (
      <div className="advantage-list">
        <h3 className="advantage-list__title">
          選択中: {selectedPokemon.join(", ")}
        </h3>

        <div className="advantage-list__section">
          <button
            type="button"
            className="advantage-list__section-header"
            onClick={() => toggleSection("advantage")}
          >
            {expandedSections.advantage ? <ChevronDown /> : <ChevronRight />}
            <span className="advantage-list__section-title">
              有利なポケモン (
              {pokemonRelations.advantages.length +
                pokemonRelations.both.length}
              )
            </span>
          </button>
          {expandedSections.advantage && (
            <div className="advantage-list__items">
              {pokemonRelations.advantages.length === 0 &&
              pokemonRelations.both.length === 0 ? (
                <div className="advantage-list__empty">なし</div>
              ) : (
                <>
                  {pokemonRelations.advantages.map((node) => (
                    <RelationPopover
                      key={node.id}
                      targetPokemonId={node.id}
                      selectedPokemon={selectedPokemon}
                      data={data}
                    >
                      <div
                        className="advantage-list__item"
                        style={{
                          borderLeftColor: ROLE_COLORS[node.role] || "#999",
                        }}
                      >
                        <span className="advantage-list__relation-symbol">
                          {node.relationCount > 1 ? "◎" : "○"}
                        </span>
                        <span
                          className="advantage-list__role-badge"
                          style={{
                            backgroundColor: ROLE_COLORS[node.role] || "#999",
                          }}
                        >
                          {node.role}
                        </span>
                        <span className="advantage-list__pokemon-name">
                          {node.label}
                        </span>
                      </div>
                    </RelationPopover>
                  ))}
                  {pokemonRelations.both.map((node) => (
                    <RelationPopover
                      key={node.id}
                      targetPokemonId={node.id}
                      selectedPokemon={selectedPokemon}
                      data={data}
                    >
                      <div
                        className="advantage-list__item"
                        style={{
                          borderLeftColor: ROLE_COLORS[node.role] || "#999",
                        }}
                      >
                        <span className="advantage-list__relation-symbol">
                          {node.relationCount > 1 ? "◎" : "○"}
                        </span>
                        <span className="advantage-list__relation-symbol disadvantage">
                          {node.disadvantageCount > 1 ? "×" : "△"}
                        </span>
                        <span
                          className="advantage-list__role-badge"
                          style={{
                            backgroundColor: ROLE_COLORS[node.role] || "#999",
                          }}
                        >
                          {node.role}
                        </span>
                        <span className="advantage-list__pokemon-name">
                          {node.label}
                        </span>
                      </div>
                    </RelationPopover>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="advantage-list__section">
          <button
            type="button"
            className="advantage-list__section-header"
            onClick={() => toggleSection("disadvantage")}
          >
            {expandedSections.disadvantage ? <ChevronDown /> : <ChevronRight />}
            <span className="advantage-list__section-title">
              不利なポケモン (
              {pokemonRelations.disadvantages.length +
                pokemonRelations.both.length}
              )
            </span>
          </button>
          {expandedSections.disadvantage && (
            <div className="advantage-list__items">
              {pokemonRelations.disadvantages.length === 0 &&
              pokemonRelations.both.length === 0 ? (
                <div className="advantage-list__empty">なし</div>
              ) : (
                <>
                  {pokemonRelations.disadvantages.map((node) => (
                    <RelationPopover
                      key={node.id}
                      targetPokemonId={node.id}
                      selectedPokemon={selectedPokemon}
                      data={data}
                    >
                      <div
                        className="advantage-list__item"
                        style={{
                          borderLeftColor: ROLE_COLORS[node.role] || "#999",
                        }}
                      >
                        <span className="advantage-list__relation-symbol disadvantage">
                          {node.relationCount > 1 ? "×" : "△"}
                        </span>
                        <span
                          className="advantage-list__role-badge"
                          style={{
                            backgroundColor: ROLE_COLORS[node.role] || "#999",
                          }}
                        >
                          {node.role}
                        </span>
                        <span className="advantage-list__pokemon-name">
                          {node.label}
                        </span>
                      </div>
                    </RelationPopover>
                  ))}
                  {pokemonRelations.both.map((node) => (
                    <RelationPopover
                      key={`${node.id}-disadvantage`}
                      targetPokemonId={node.id}
                      selectedPokemon={selectedPokemon}
                      data={data}
                    >
                      <div
                        className="advantage-list__item"
                        style={{
                          borderLeftColor: ROLE_COLORS[node.role] || "#999",
                        }}
                      >
                        <span className="advantage-list__relation-symbol">
                          {node.relationCount > 1 ? "◎" : "○"}
                        </span>
                        <span className="advantage-list__relation-symbol disadvantage">
                          {node.disadvantageCount > 1 ? "×" : "△"}
                        </span>
                        <span
                          className="advantage-list__role-badge"
                          style={{
                            backgroundColor: ROLE_COLORS[node.role] || "#999",
                          }}
                        >
                          {node.role}
                        </span>
                        <span className="advantage-list__pokemon-name">
                          {node.label}
                        </span>
                      </div>
                    </RelationPopover>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

AdvantageList.displayName = "AdvantageList";

export default AdvantageList;
