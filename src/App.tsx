import { useEffect, useState, useMemo, useCallback } from "react";
import AdvantageList from "./components/AdvantageList";
import ControlPanel from "./components/ControlPanel";
import { DataManager } from "./components/DataManager";
import NetworkGraph from "./components/NetworkGraph";
import HelpModal from "./components/HelpModal";
import { usePokemonData } from "./hooks/usePokemonData";
import "./styles/App.css";
import type { Role } from "./types";
import { ROLE_COLORS } from "./utils/constants";
import { HelpCircle } from "lucide-react";

function App() {
  const {
    data,
    isCustomData,
    uploadCustomData,
    resetToDefault,
    downloadDefaultData,
  } = usePokemonData();
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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
        <div className="header-content">
          <div className="header-title">
            <p className="subtitle">ユナグラフ</p>
            <h1 className="title">Unite Graph</h1>
          </div>
          <button
            type="button"
            className="help-button"
            onClick={() => setIsHelpModalOpen(true)}
            aria-label="使い方を見る"
          >
            <HelpCircle size={24} />
            <span>使い方</span>
          </button>
        </div>
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

        <DataManager
          isCustomData={isCustomData}
          uploadCustomData={uploadCustomData}
          resetToDefault={resetToDefault}
          downloadDefaultData={downloadDefaultData}
        />

        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      </main>
    </div>
  );
}

export default App;
