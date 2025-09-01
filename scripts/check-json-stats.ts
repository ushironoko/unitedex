import fs from "fs";
import path from "path";
import { PokemonData } from "../src/types";

const dataPath = path.join(__dirname, "../src/data/pokemonMatchupData.ts");
const dataContent = fs.readFileSync(dataPath, "utf-8");

// Extract the data from the TypeScript file
const dataMatch = dataContent.match(
  /export const pokemonMatchupData: PokemonData = ({[\s\S]*});/,
);
if (!dataMatch) {
  throw new Error("Could not extract data from TypeScript file");
}

// Parse the data
const data: PokemonData = eval(`(${dataMatch[1]})`);

console.log("=== Pokemon Unite Matchup Data Statistics ===\n");

console.log(`Total Nodes (Pokemon): ${data.nodes.length}`);
console.log(`Total Edges (Matchup Relationships): ${data.edges.length}\n`);

// Count by role
const roleCount: Record<string, number> = {};
data.nodes.forEach((node) => {
  roleCount[node.role] = (roleCount[node.role] || 0) + 1;
});

console.log("=== Pokemon by Role ===");
Object.entries(roleCount).forEach(([role, count]) => {
  console.log(`${role}: ${count}`);
});

// Count by edge type
const edgeTypeCount: Record<string, number> = {};
data.edges.forEach((edge) => {
  edgeTypeCount[edge.type] = (edgeTypeCount[edge.type] || 0) + 1;
});

console.log("\n=== Edges by Type ===");
Object.entries(edgeTypeCount).forEach(([type, count]) => {
  console.log(`${type}: ${count}`);
});

// Find pokemon with most advantages/disadvantages
const advantageCount: Record<string, number> = {};
const disadvantageCount: Record<string, number> = {};

data.edges.forEach((edge) => {
  if (edge.type === "advantage") {
    advantageCount[edge.from] = (advantageCount[edge.from] || 0) + 1;
  } else if (edge.type === "disadvantage") {
    disadvantageCount[edge.to] = (disadvantageCount[edge.to] || 0) + 1;
  }
});

console.log("\n=== Top 5 Pokemon with Most Advantages ===");
Object.entries(advantageCount)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .forEach(([pokemon, count]) => {
    const node = data.nodes.find((n) => n.id === pokemon);
    console.log(`${node?.label || pokemon}: ${count} advantages`);
  });

console.log("\n=== Top 5 Pokemon with Most Disadvantages ===");
Object.entries(disadvantageCount)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .forEach(([pokemon, count]) => {
    const node = data.nodes.find((n) => n.id === pokemon);
    console.log(`${node?.label || pokemon}: ${count} disadvantages`);
  });

console.log("\n=== File Information ===");
const stats = fs.statSync(dataPath);
console.log(`File Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`Created: ${stats.birthtime.toLocaleString()}`);
console.log(`Modified: ${stats.mtime.toLocaleString()}`);

console.log("\n=== Sample Data ===");
console.log("First 3 nodes:", JSON.stringify(data.nodes.slice(0, 3), null, 2));
console.log("First 3 edges:", JSON.stringify(data.edges.slice(0, 3), null, 2));
