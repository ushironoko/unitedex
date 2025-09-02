import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { PokemonData } from "../types";
import { ROLE_COLORS } from "../utils/constants";
import "../styles/RelationPopover.css";

interface RelationPopoverProps {
  targetPokemonId: string;
  selectedPokemon: string[];
  data: PokemonData;
  position: { x: number; y: number };
  onClose: () => void;
}

interface RelationDetail {
  pokemonId: string;
  pokemonLabel: string;
  relationType: "advantage" | "disadvantage";
}

const RelationPopover: React.FC<RelationPopoverProps> = ({
  targetPokemonId,
  selectedPokemon,
  data,
  position,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Get relation details
  const relationDetails = (() => {
    const targetNode = data.nodes.find((n) => n.id === targetPokemonId);
    if (!targetNode) return { advantages: [], disadvantages: [] };

    // Find matching selected nodes
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
          if (baseId.toLowerCase() === trimmedSearch.toLowerCase()) return true;

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

    const advantages: RelationDetail[] = [];
    const disadvantages: RelationDetail[] = [];

    // Check edges for relations
    for (const selectedNode of matchingNodes) {
      for (const edge of data.edges) {
        // Check if selected has advantage over target
        if (
          edge.from === selectedNode.id &&
          edge.to === targetPokemonId &&
          edge.type === "advantage"
        ) {
          advantages.push({
            pokemonId: selectedNode.id,
            pokemonLabel: selectedNode.label,
            relationType: "advantage",
          });
        }
        // Check if target has advantage over selected (= selected is disadvantaged)
        if (
          edge.from === targetPokemonId &&
          edge.to === selectedNode.id &&
          edge.type === "advantage"
        ) {
          disadvantages.push({
            pokemonId: selectedNode.id,
            pokemonLabel: selectedNode.label,
            relationType: "disadvantage",
          });
        }
        // Check if selected is disadvantaged to target
        if (
          edge.from === selectedNode.id &&
          edge.to === targetPokemonId &&
          edge.type === "disadvantage"
        ) {
          disadvantages.push({
            pokemonId: selectedNode.id,
            pokemonLabel: selectedNode.label,
            relationType: "disadvantage",
          });
        }
        // Check if target is disadvantaged to selected (= selected has advantage)
        if (
          edge.from === targetPokemonId &&
          edge.to === selectedNode.id &&
          edge.type === "disadvantage"
        ) {
          advantages.push({
            pokemonId: selectedNode.id,
            pokemonLabel: selectedNode.label,
            relationType: "advantage",
          });
        }
      }
    }

    return { advantages, disadvantages };
  })();

  // Adjust position to keep popover within viewport
  useEffect(() => {
    if (!popoverRef.current) return;

    const rect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      newX = position.x - rect.width - 10;
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      newY = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const targetNode = data.nodes.find((n) => n.id === targetPokemonId);
  if (!targetNode) return null;

  return (
    <div
      ref={popoverRef}
      className="relation-popover"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="relation-popover__header">
        <span
          className="relation-popover__role-badge"
          style={{
            backgroundColor: ROLE_COLORS[targetNode.role] || "#999",
          }}
        >
          {targetNode.role}
        </span>
        <span className="relation-popover__title">{targetNode.label}</span>
      </div>

      <div className="relation-popover__content">
        {relationDetails.advantages.length > 0 && (
          <div className="relation-popover__section">
            <div className="relation-popover__section-title">
              有利な選択ポケモン
            </div>
            {relationDetails.advantages.map((detail) => (
              <div
                key={`${detail.pokemonId}-adv`}
                className="relation-popover__item advantage"
              >
                <span className="relation-popover__symbol">○</span>
                <span className="relation-popover__pokemon-name">
                  {detail.pokemonLabel}
                </span>
              </div>
            ))}
          </div>
        )}

        {relationDetails.disadvantages.length > 0 && (
          <div className="relation-popover__section">
            <div className="relation-popover__section-title">
              不利な選択ポケモン
            </div>
            {relationDetails.disadvantages.map((detail) => (
              <div
                key={`${detail.pokemonId}-dis`}
                className="relation-popover__item disadvantage"
              >
                <span className="relation-popover__symbol">△</span>
                <span className="relation-popover__pokemon-name">
                  {detail.pokemonLabel}
                </span>
              </div>
            ))}
          </div>
        )}

        {relationDetails.advantages.length === 0 &&
          relationDetails.disadvantages.length === 0 && (
            <div className="relation-popover__empty">
              選択中のポケモンとの関係はありません
            </div>
          )}
      </div>
    </div>
  );
};

export default RelationPopover;
