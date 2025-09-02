import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import type { PokemonData } from "../types";
import { ROLE_COLORS } from "../utils/constants";
import "../styles/RelationPopover.css";

interface RelationPopoverProps {
  children: React.ReactElement<Record<string, unknown>>;
  targetPokemonId: string;
  selectedPokemon: string[];
  data: PokemonData;
}

interface RelationDetail {
  pokemonId: string;
  pokemonLabel: string;
  relationType: "advantage" | "disadvantage";
}

const RelationPopover: React.FC<RelationPopoverProps> = ({
  children,
  targetPokemonId,
  selectedPokemon,
  data,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Get relation details
  const relationDetails = useMemo(() => {
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

    // Use Map to prevent duplicates
    const advantageMap = new Map<string, RelationDetail>();
    const disadvantageMap = new Map<string, RelationDetail>();

    // Check edges for relations
    for (const selectedNode of matchingNodes) {
      for (const edge of data.edges) {
        // Check if selected has advantage over target
        if (
          edge.from === selectedNode.id &&
          edge.to === targetPokemonId &&
          edge.type === "advantage"
        ) {
          advantageMap.set(selectedNode.id, {
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
          disadvantageMap.set(selectedNode.id, {
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
          disadvantageMap.set(selectedNode.id, {
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
          advantageMap.set(selectedNode.id, {
            pokemonId: selectedNode.id,
            pokemonLabel: selectedNode.label,
            relationType: "advantage",
          });
        }
      }
    }

    // Convert Maps to arrays
    const advantages = Array.from(advantageMap.values());
    const disadvantages = Array.from(disadvantageMap.values());

    return { advantages, disadvantages };
  }, [targetPokemonId, selectedPokemon, data]);

  // Calculate position when opening
  const updatePosition = useCallback(
    (event: React.MouseEvent) => {
      if (isMobile) {
        // Center on mobile
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popoverWidth = Math.min(300, viewportWidth - 40);
        const popoverHeight = 200;

        setPosition({
          x: (viewportWidth - popoverWidth) / 2,
          y: (viewportHeight - popoverHeight) / 2,
        });
      } else {
        // Use the actual target element for positioning
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const popoverWidth = 250; // Estimated width
        const popoverHeight = 200; // Estimated height

        let x = rect.right + 10;
        let y = rect.top;

        // Adjust if going off-screen
        if (x + popoverWidth > viewportWidth) {
          x = rect.left - popoverWidth - 10;
        }

        if (y + popoverHeight > viewportHeight) {
          y = viewportHeight - popoverHeight - 10;
        }

        if (y < 10) {
          y = 10;
        }

        setPosition({ x, y });
      }
    },
    [isMobile],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isMobile) {
        event.stopPropagation();
        if (!isOpen) {
          updatePosition(event);
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }
    },
    [isMobile, isOpen, updatePosition],
  );

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      if (!isMobile) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        updatePosition(event);
        setIsOpen(true);
      }
    },
    [isMobile, updatePosition],
  );

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    }
  }, [isMobile]);

  const handlePopoverMouseEnter = useCallback(() => {
    if (!isMobile && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isMobile]);

  const handlePopoverMouseLeave = useCallback(() => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    }
  }, [isMobile]);

  // Handle click outside for mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isMobile, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const targetNode = data.nodes.find((n) => n.id === targetPokemonId);
  if (!targetNode) return children;

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick: handleClick,
      })}
      {isOpen && isMobile && (
        <div
          className="relation-popover__overlay"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close popover"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
        />
      )}
      {isOpen && (
        <div
          ref={popoverRef}
          className="relation-popover"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          style={{
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
            ...(isMobile && {
              width: "calc(100vw - 40px)",
              maxWidth: "300px",
            }),
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
      )}
    </>
  );
};

export default RelationPopover;
