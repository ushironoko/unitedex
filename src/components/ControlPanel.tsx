import type React from "react";
import type { CSSProperties } from "react";
import type { Role } from "../types";
import { ROLE_COLORS } from "../utils/constants";
import "../styles/ControlPanel.css";

interface ControlPanelProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  edgeFilter: "all" | "advantage" | "disadvantage";
  onEdgeFilterChange: (filter: "all" | "advantage" | "disadvantage") => void;
  roleFilter: Role[];
  onRoleFilterChange: (roles: Role[]) => void;
  showDirectConnectionsOnly: boolean;
  onShowDirectConnectionsOnlyChange: (value: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  searchValue,
  onSearchChange,
  edgeFilter,
  onEdgeFilterChange,
  roleFilter,
  onRoleFilterChange,
  showDirectConnectionsOnly,
  onShowDirectConnectionsOnlyChange,
}) => {
  const roles = Object.keys(ROLE_COLORS) as Role[];

  const handleRoleToggle = (role: Role) => {
    if (roleFilter.includes(role)) {
      onRoleFilterChange(roleFilter.filter((r) => r !== role));
    } else {
      onRoleFilterChange([...roleFilter, role]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>ポケモン検索</h3>
        <input
          type="text"
          placeholder="ポケモン名をカンマ区切りで入力"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div className="desktop-only">
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>エッジフィルター</h3>
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => onEdgeFilterChange("all")}
              style={{
                ...styles.button,
                ...(edgeFilter === "all" ? styles.activeButton : {}),
              }}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => onEdgeFilterChange("advantage")}
              style={{
                ...styles.button,
                ...(edgeFilter === "advantage" ? styles.activeButton : {}),
                ...(edgeFilter === "advantage"
                  ? { backgroundColor: "#4CAF50" }
                  : {}),
              }}
            >
              有利のみ
            </button>
            <button
              type="button"
              onClick={() => onEdgeFilterChange("disadvantage")}
              style={{
                ...styles.button,
                ...(edgeFilter === "disadvantage" ? styles.activeButton : {}),
                ...(edgeFilter === "disadvantage"
                  ? { backgroundColor: "#F44336" }
                  : {}),
              }}
            >
              不利のみ
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>表示オプション</h3>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showDirectConnectionsOnly}
              onChange={(e) =>
                onShowDirectConnectionsOnlyChange(e.target.checked)
              }
              style={styles.checkbox}
            />
            <span style={styles.checkboxText}>
              直接接続のみ表示（孫ノードを非表示）
            </span>
          </label>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>ロールフィルター</h3>
          <div style={styles.roleButtonGroup}>
            {roles.map((role) => (
              <button
                type="button"
                key={role}
                onClick={() => handleRoleToggle(role)}
                style={{
                  ...styles.roleButton,
                  backgroundColor: ROLE_COLORS[role],
                  opacity: roleFilter.includes(role) ? 1 : 0.3,
                  transform: roleFilter.includes(role)
                    ? "scale(1)"
                    : "scale(0.95)",
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  searchInput: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    border: "2px solid #ddd",
    borderRadius: "5px",
    outline: "none",
    transition: "border-color 0.3s",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
  },
  button: {
    padding: "8px 16px",
    fontSize: "14px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#f0f0f0",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  activeButton: {
    backgroundColor: "#2196F3",
    color: "white",
    transform: "scale(1.05)",
  },
  roleButtonGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  roleButton: {
    padding: "8px 16px",
    fontSize: "14px",
    border: "none",
    borderRadius: "5px",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s",
    fontWeight: "bold",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
  checkbox: {
    marginRight: "8px",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  checkboxText: {
    color: "#333",
  },
};

export default ControlPanel;
