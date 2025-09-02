import { type CSSProperties, useEffect, useState } from "react";
import AdvantageList from "./components/AdvantageList";
import ControlPanel from "./components/ControlPanel";
import NetworkGraph from "./components/NetworkGraph";
import { usePokemonData } from "./hooks/usePokemonData";
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
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Pokemon Unite Matchup Visualizer</h1>
        <p style={styles.subtitle}>ポケモンの相性関係を可視化</p>
      </header>

      <main style={styles.main}>
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

        <div style={styles.contentContainer}>
          <div style={styles.graphContainer}>
            <NetworkGraph
              data={data}
              selectedPokemon={selectedPokemon}
              edgeFilter={edgeFilter}
              roleFilter={roleFilter}
              showDirectConnectionsOnly={showDirectConnectionsOnly}
            />
          </div>

          {selectedPokemon.length > 0 && (
            <div style={styles.sidePanel}>
              <AdvantageList
                data={data}
                selectedPokemon={selectedPokemon}
                showDirectConnectionsOnly={showDirectConnectionsOnly}
              />
            </div>
          )}
        </div>

        <div style={styles.stats}>
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

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "20px",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1rem",
    opacity: 0.9,
  },
  main: {
    flex: 1,
    padding: "20px",
    maxWidth: "1600px",
    width: "100%",
    margin: "0 auto",
  },
  contentContainer: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  graphContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    minHeight: "800px",
    height: "calc(100vh - 400px)",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  sidePanel: {
    width: "320px",
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxHeight: "calc(100vh - 400px)",
    overflow: "auto",
  },
  stats: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  loading: {
    fontSize: "1.5rem",
    color: "white",
  },
  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  error: {
    fontSize: "1.5rem",
    color: "#f44336",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
  },
};

export default App;
