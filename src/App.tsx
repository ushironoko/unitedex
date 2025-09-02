import { useEffect, useState } from "react";
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
  >("all");
  const [roleFilter, setRoleFilter] = useState<Role[]>(
    Object.keys(ROLE_COLORS) as Role[],
  );
  const [showDirectConnectionsOnly, setShowDirectConnectionsOnly] =
    useState(true);

  // Handle search
  useEffect(() => {
    if (!searchValue.trim()) {
      setSelectedPokemon([]);
      return;
    }

    const searchTerms = searchValue
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);

    setSelectedPokemon(searchTerms);
  }, [searchValue]);

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Pokemon Unite Matchup Visualizer</h1>
        <p className="subtitle">ポケモンの相性関係を可視化</p>
      </header>

      <main className="main">
        <ControlPanel
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          edgeFilter={edgeFilter}
          onEdgeFilterChange={setEdgeFilter}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          showDirectConnectionsOnly={showDirectConnectionsOnly}
          onShowDirectConnectionsOnlyChange={setShowDirectConnectionsOnly}
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
            有利: {data.edges.filter((e) => e.type === "advantage").length}
          </span>
          <span style={{ marginLeft: "20px" }}>
            不利: {data.edges.filter((e) => e.type === "disadvantage").length}
          </span>
        </div>
      </main>
    </div>
  );
}

export default App;
