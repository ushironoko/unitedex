import { useEffect, useState, useMemo, useCallback } from "react";
import AdvantageList from "./components/AdvantageList";
import ControlPanel from "./components/ControlPanel";
import NetworkGraph from "./components/NetworkGraph";
import { usePokemonData } from "./hooks/usePokemonData";
import "./styles/App.css";
import type { Role } from "./types";
import { ROLE_COLORS } from "./utils/constants";

function App() {
  const { data } = usePokemonData();
  const [searchValue, setSearchValue] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([]);
  const [edgeFilter, setEdgeFilter] = useState<
    "all" | "advantage" | "disadvantage"
  >("advantage");
  const [roleFilter, setRoleFilter] = useState<Role[]>(
    Object.keys(ROLE_COLORS) as Role[],
  );
  const [showDirectConnectionsOnly, setShowDirectConnectionsOnly] =
    useState(true);

  // Handle search - デバウンス処理を追加
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchValue.trim()) {
        setSelectedPokemon([]);
        return;
      }

      const searchTerms = searchValue
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);

      setSelectedPokemon(searchTerms);
    }, 200); // 200msのデバウンス

    return () => clearTimeout(timer);
  }, [searchValue]);

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Unite Graph</h1>
        <p className="subtitle">ユナグラフ</p>
      </header>

      <main className="main">
        <ControlPanel
          searchValue={searchValue}
          onSearchChange={useCallback(setSearchValue, [])}
          edgeFilter={edgeFilter}
          onEdgeFilterChange={useCallback(setEdgeFilter, [])}
          roleFilter={roleFilter}
          onRoleFilterChange={useCallback(setRoleFilter, [])}
          showDirectConnectionsOnly={showDirectConnectionsOnly}
          onShowDirectConnectionsOnlyChange={useCallback(
            setShowDirectConnectionsOnly,
            [],
          )}
        />

        <div className="contentContainer">
          <div className="graphContainer">
            <NetworkGraph
              data={data}
              selectedPokemon={selectedPokemon}
              edgeFilter={edgeFilter}
              roleFilter={roleFilter}
              showDirectConnectionsOnly={showDirectConnectionsOnly}
            />
          </div>

          {selectedPokemon.length > 0 && (
            <div className="sidePanel">
              <AdvantageList
                data={data}
                selectedPokemon={selectedPokemon}
                showDirectConnectionsOnly={showDirectConnectionsOnly}
              />
            </div>
          )}
        </div>

        <div className="stats">
          <span>総ポケモン数: {data.nodes.length}</span>
          <span style={{ marginLeft: "20px" }}>
            総エッジ数: {data.edges.length}
          </span>
          <span style={{ marginLeft: "20px" }}>
            有利:{" "}
            {useMemo(
              () => data.edges.filter((e) => e.type === "advantage").length,
              [data.edges],
            )}
          </span>
          <span style={{ marginLeft: "20px" }}>
            不利:{" "}
            {useMemo(
              () => data.edges.filter((e) => e.type === "disadvantage").length,
              [data.edges],
            )}
          </span>
        </div>
      </main>
    </div>
  );
}

export default App;
