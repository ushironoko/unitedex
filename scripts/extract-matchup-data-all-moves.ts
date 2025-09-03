import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  PokemonNode,
  PokemonEdge,
  PokemonData,
  Role,
} from "../src/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pokemon name normalization function
function normalizePokemonName(name: string): string {
  const normalizationMap: Record<string, string> = {
    ミュウツーY: "mewtwo_y",
    アローラキュウコン: "alolan_ninetales",
    アローラライチュウ: "alolan_raichu",
    ガラルギャロップ: "galarian_rapidash",
    アブソル: "absol",
    アマージョ: "tsareena",
    イワパレス: "crustle",
    ウーラオス: "urshifu",
    エースバーン: "cinderace",
    エーフィ: "espeon",
    オーロット: "trevenant",
    カイリキー: "machamp",
    カイリュー: "dragonite",
    カビゴン: "snorlax",
    カメックス: "blastoise",
    ガブリアス: "garchomp",
    キュワワー: "comfey",
    ギャラドス: "gyarados",
    ギルガルド: "aegislash",
    グレイシア: "glaceon",
    グレンアルマ: "armarouge",
    ゲッコウガ: "greninja",
    ゲンガー: "gengar",
    コダック: "psyduck",
    サーナイト: "gardevoir",
    ザシアン: "zacian",
    ジュナイパー: "decidueye",
    ジュラルドン: "duraludon",
    スイクン: "suicune",
    ストライク: "scyther",
    ゼラオラ: "zeraora",
    ソウブレイズ: "ceruledge",
    ゾロアーク: "zoroark",
    タイレーツ: "falinks",
    ダークライ: "darkrai",
    デカヌチャン: "tinkaton",
    ドードリオ: "dodrio",
    ニンフィア: "sylveon",
    ハピナス: "blissey",
    バシャーモ: "blaziken",
    ピカチュウ: "pikachu",
    ピクシー: "clefable",
    ファイアロー: "talonflame",
    フーパ: "hoopa",
    ブラッキー: "umbreon",
    プクリン: "wigglytuff",
    ホウオウ: "ho_oh",
    マスカーニャ: "meowscarada",
    マッシブーン: "buzzwole",
    マフォクシー: "delphox",
    マホイップ: "alcremie",
    マリルリ: "azumarill",
    マンムー: "mamoswine",
    ミミッキュ: "mimikyu",
    ミュウ: "mew",
    ミライドン: "miraidon",
    メタグロス: "metagross",
    ヤドラン: "slowbro",
    ヤミラミ: "sableye",
    ラティアス: "latias",
    ラティオス: "latios",
    リザードン: "charizard",
    リーフィア: "leafeon",
    ルカリオ: "lucario",
    フシギバナ: "venusaur",
    インテレオン: "inteleon",
    バンギラス: "tyranitar",
    ドラパルト: "dragapult",
    ワタシラガ: "eldegoss",
  };

  if (normalizationMap[name]) {
    return normalizationMap[name];
  }

  // Fallback to simple lowercase conversion
  return name.toLowerCase().replace(/\s+/g, "_");
}

// Extract role from pokemon file
function extractRole(content: string): Role {
  // First check タイプ field (this is the actual role classification)
  const typeMatch = content.match(/\*\*タイプ\*\*:\s*([^（\n]+)/);
  if (typeMatch) {
    const typeText = typeMatch[1].trim();
    if (typeText.includes("Speedster")) return "アサシン";
    if (typeText.includes("All-Rounder")) return "ファイター";
    if (typeText.includes("Defender")) return "タンク";
    if (typeText.includes("Supporter")) return "サポート";
    if (typeText.includes("Attacker")) return "メイジ";
  }
  // Default fallback
  return "メイジ";
}

// Target info interface
interface TargetInfo {
  pokemonName: string;
  moveName?: string; // Move name in parentheses (if specified)
}

// Extract matchups and automatically detect move variations
function extractMatchupsWithAutoMoves(content: string): {
  moveAdvantages: Map<string, TargetInfo[]>;
  moveDisadvantages: Map<string, TargetInfo[]>;
  generalAdvantages: TargetInfo[];
  generalDisadvantages: TargetInfo[];
  detectedMoves: Set<string>;
} {
  const moveAdvantages = new Map<string, TargetInfo[]>();
  const moveDisadvantages = new Map<string, TargetInfo[]>();
  const generalAdvantages: TargetInfo[] = [];
  const generalDisadvantages: TargetInfo[] = [];
  const detectedMoves = new Set<string>();

  // Find the advantages section
  const advSectionMatch = content.match(
    /##[^#]*このポケモンが有利をとれる相手[^#]*?\n([\s\S]*?)(?=##[^#]*このポケモンが苦手な相手|##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );

  if (advSectionMatch) {
    const advText = advSectionMatch[1];
    let currentSection: string | null = null;
    const lines = advText.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for section headers (these are move names)
      if (
        trimmedLine.startsWith("##") &&
        !trimmedLine.includes("このポケモン")
      ) {
        const sectionName = trimmedLine
          .replace(/^##\s*/, "")
          .replace(/^#\s*/, "")
          .trim();
        // Filter out generic section names that aren't moves
        if (
          sectionName &&
          !sectionName.includes("適正レーン") &&
          !sectionName.includes("パワースパイク") &&
          !sectionName.includes("時間ごと") &&
          !sectionName.includes("シナジー") &&
          sectionName.length > 0
        ) {
          currentSection = sectionName;
          detectedMoves.add(sectionName);
          moveAdvantages.set(sectionName, []);
        }
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();

        // Extract pokemon name and optional move
        const fullMatch = pokemonWithNote.match(
          /^([^（(]+)(?:[（(]([^）)]+)[）)])?/,
        );
        if (fullMatch) {
          const targetPokemon = fullMatch[1].trim();
          const moveName = fullMatch[2]?.trim();

          // Filter out role names and English descriptions
          if (
            targetPokemon &&
            ![
              "メイジ",
              "タンク",
              "アサシン",
              "ファイター",
              "サポート",
              "ADC",
              "べた足",
              "ポーク",
            ].includes(targetPokemon) &&
            !targetPokemon.match(/^[a-zA-Z\s]+$/)
          ) {
            const targetInfo: TargetInfo = {
              pokemonName: targetPokemon,
              moveName: moveName,
            };

            if (currentSection && moveAdvantages.has(currentSection)) {
              const moveList = moveAdvantages.get(currentSection)!;
              // Check for duplicates
              const exists = moveList.some(
                (t) =>
                  t.pokemonName === targetInfo.pokemonName &&
                  t.moveName === targetInfo.moveName,
              );
              if (!exists) {
                moveList.push(targetInfo);
              }
            } else {
              // Check for duplicates
              const exists = generalAdvantages.some(
                (t) =>
                  t.pokemonName === targetInfo.pokemonName &&
                  t.moveName === targetInfo.moveName,
              );
              if (!exists) {
                generalAdvantages.push(targetInfo);
              }
            }
          }
        }
      }
    }
  }

  // Find the disadvantages section
  const disadvSectionMatch = content.match(
    /##[^#]*このポケモンが苦手な相手[^#]*?\n([\s\S]*?)(?=##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );

  if (disadvSectionMatch) {
    const disadvText = disadvSectionMatch[1];
    let currentSection: string | null = null;
    const lines = disadvText.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check for section headers (these are move names)
      if (
        trimmedLine.startsWith("##") &&
        !trimmedLine.includes("このポケモン")
      ) {
        const sectionName = trimmedLine
          .replace(/^##\s*/, "")
          .replace(/^#\s*/, "")
          .trim();
        // Filter out generic section names that aren't moves
        if (
          sectionName &&
          !sectionName.includes("適正レーン") &&
          !sectionName.includes("パワースパイク") &&
          !sectionName.includes("時間ごと") &&
          sectionName.length > 0
        ) {
          currentSection = sectionName;
          detectedMoves.add(sectionName);
          moveDisadvantages.set(sectionName, []);
        }
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();

        // Extract pokemon name and optional move
        const fullMatch = pokemonWithNote.match(
          /^([^（(]+)(?:[（(]([^）)]+)[）)])?/,
        );
        if (fullMatch) {
          const targetPokemon = fullMatch[1].trim();
          const moveName = fullMatch[2]?.trim();

          // Filter out role names and English descriptions
          if (
            targetPokemon &&
            ![
              "メイジ",
              "タンク",
              "アサシン",
              "ファイター",
              "サポート",
              "ADC",
              "べた足",
              "ポーク",
            ].includes(targetPokemon) &&
            !targetPokemon.match(/^[a-zA-Z\s]+$/)
          ) {
            const targetInfo: TargetInfo = {
              pokemonName: targetPokemon,
              moveName: moveName,
            };

            if (currentSection && moveDisadvantages.has(currentSection)) {
              const moveList = moveDisadvantages.get(currentSection)!;
              // Check for duplicates
              const exists = moveList.some(
                (t) =>
                  t.pokemonName === targetInfo.pokemonName &&
                  t.moveName === targetInfo.moveName,
              );
              if (!exists) {
                moveList.push(targetInfo);
              }
            } else {
              // Check for duplicates
              const exists = generalDisadvantages.some(
                (t) =>
                  t.pokemonName === targetInfo.pokemonName &&
                  t.moveName === targetInfo.moveName,
              );
              if (!exists) {
                generalDisadvantages.push(targetInfo);
              }
            }
          }
        }
      }
    }
  }

  return {
    moveAdvantages,
    moveDisadvantages,
    generalAdvantages,
    generalDisadvantages,
    detectedMoves,
  };
}

// Main extraction function
async function extractMatchupData(): Promise<PokemonData> {
  const uniteDir = path.join(__dirname, "..", "unite");
  const files = fs.readdirSync(uniteDir);

  // Filter pokemon files (exclude role files and other files)
  const excludeFiles = [
    "items.md",
    "update_log.md",
    "over_power.md",
    "アサシン.md",
    "サポート.md",
    "タンク.md",
    "ファイター.md",
    "メイジ.md",
  ];
  const pokemonFiles = files.filter(
    (file) => file.endsWith(".md") && !excludeFiles.includes(file),
  );

  console.log(`Found ${pokemonFiles.length} pokemon files`);

  const nodes: PokemonNode[] = [];
  const edges: PokemonEdge[] = [];
  const edgeSet = new Set<string>(); // For deduplication

  // Store Pokemon info for creating nodes
  const pokemonInfo = new Map<
    string,
    {
      baseName: string;
      normalizedName: string;
      role: Role;
      moves: Set<string>;
    }
  >();

  // First pass: collect all Pokemon and their move variations
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const role = extractRole(content);
    const { detectedMoves } = extractMatchupsWithAutoMoves(content);

    pokemonInfo.set(pokemonName, {
      baseName: pokemonName,
      normalizedName,
      role,
      moves: detectedMoves,
    });

    console.log(
      `Detected moves for ${pokemonName}: ${Array.from(detectedMoves).join(", ") || "none"}`,
    );
  }

  // Second pass: create nodes
  for (const [pokemonName, info] of pokemonInfo) {
    if (info.moves.size > 0) {
      // Create nodes for each move variation
      for (const move of info.moves) {
        const nodeId = `${info.normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;
        nodes.push({
          id: nodeId,
          label: `${pokemonName} (${move})`,
          role: info.role,
        });
      }
    } else {
      // Create single node for Pokemon without move variations
      nodes.push({
        id: info.normalizedName,
        label: pokemonName,
        role: info.role,
      });
    }
  }

  console.log(`\nCreated ${nodes.length} nodes\n`);

  // Third pass: create edges
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const pokemonName = file.replace(".md", "");
    const sourceInfo = pokemonInfo.get(pokemonName)!;
    const {
      moveAdvantages,
      moveDisadvantages,
      generalAdvantages,
      generalDisadvantages,
    } = extractMatchupsWithAutoMoves(content);

    // Process move-specific matchups
    for (const [move, targets] of moveAdvantages) {
      const sourceNodeId = `${sourceInfo.normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;

      for (const target of targets) {
        const targetPokemonInfo = pokemonInfo.get(target.pokemonName);
        if (!targetPokemonInfo) continue; // Skip if target Pokemon not found

        // Find nodes that match the target
        let targetNodes: typeof nodes = [];

        if (target.moveName) {
          // If a specific move is specified, only match that move variation
          const targetMoveId = `${targetPokemonInfo.normalizedName}_${target.moveName.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;
          targetNodes = nodes.filter((n) => n.id === targetMoveId);
        } else {
          // If no move specified, match all variations (including base)
          targetNodes = nodes.filter(
            (n) =>
              n.id === targetPokemonInfo.normalizedName ||
              n.id.startsWith(`${targetPokemonInfo.normalizedName}_`),
          );
        }

        for (const targetNode of targetNodes) {
          const edgeKey = `${sourceNodeId}-${targetNode.id}-advantage`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              from: sourceNodeId,
              to: targetNode.id,
              type: "advantage",
            });
          }
        }
      }
    }

    for (const [move, targets] of moveDisadvantages) {
      const sourceNodeId = `${sourceInfo.normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;

      for (const target of targets) {
        const targetPokemonInfo = pokemonInfo.get(target.pokemonName);
        if (!targetPokemonInfo) continue; // Skip if target Pokemon not found

        // Find nodes that match the target
        let targetNodes: typeof nodes = [];

        if (target.moveName) {
          // If a specific move is specified, only match that move variation
          const targetMoveId = `${targetPokemonInfo.normalizedName}_${target.moveName.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;
          targetNodes = nodes.filter((n) => n.id === targetMoveId);
        } else {
          // If no move specified, match all variations (including base)
          targetNodes = nodes.filter(
            (n) =>
              n.id === targetPokemonInfo.normalizedName ||
              n.id.startsWith(`${targetPokemonInfo.normalizedName}_`),
          );
        }

        for (const targetNode of targetNodes) {
          const edgeKey = `${sourceNodeId}-${targetNode.id}-disadvantage`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              from: sourceNodeId,
              to: targetNode.id,
              type: "disadvantage",
            });
          }
        }
      }
    }

    // Process general matchups (apply to all variations if any)
    const sourceNodes = nodes.filter(
      (n) =>
        n.id === sourceInfo.normalizedName ||
        n.id.startsWith(`${sourceInfo.normalizedName}_`),
    );

    for (const sourceNode of sourceNodes) {
      // General advantages
      for (const target of generalAdvantages) {
        const targetPokemonInfo = pokemonInfo.get(target.pokemonName);
        if (!targetPokemonInfo) continue; // Skip if target Pokemon not found

        // Find nodes that match the target
        let targetNodes: typeof nodes = [];

        if (target.moveName) {
          // If a specific move is specified, only match that move variation
          const targetMoveId = `${targetPokemonInfo.normalizedName}_${target.moveName.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;
          targetNodes = nodes.filter((n) => n.id === targetMoveId);
        } else {
          // If no move specified, match all variations
          targetNodes = nodes.filter(
            (n) =>
              n.id === targetPokemonInfo.normalizedName ||
              n.id.startsWith(`${targetPokemonInfo.normalizedName}_`),
          );
        }

        for (const targetNode of targetNodes) {
          const edgeKey = `${sourceNode.id}-${targetNode.id}-advantage`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              from: sourceNode.id,
              to: targetNode.id,
              type: "advantage",
            });
          }
        }
      }

      // General disadvantages
      for (const target of generalDisadvantages) {
        const targetPokemonInfo = pokemonInfo.get(target.pokemonName);
        if (!targetPokemonInfo) continue; // Skip if target Pokemon not found

        // Find nodes that match the target
        let targetNodes: typeof nodes = [];

        if (target.moveName) {
          // If a specific move is specified, only match that move variation
          const targetMoveId = `${targetPokemonInfo.normalizedName}_${target.moveName.replace(/\s+/g, "_").replace(/\+/g, "_").replace(/[・]/g, "_").toLowerCase()}`;
          targetNodes = nodes.filter((n) => n.id === targetMoveId);
        } else {
          // If no move specified, match all variations
          targetNodes = nodes.filter(
            (n) =>
              n.id === targetPokemonInfo.normalizedName ||
              n.id.startsWith(`${targetPokemonInfo.normalizedName}_`),
          );
        }

        for (const targetNode of targetNodes) {
          const edgeKey = `${sourceNode.id}-${targetNode.id}-disadvantage`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              from: sourceNode.id,
              to: targetNode.id,
              type: "disadvantage",
            });
          }
        }
      }
    }

    console.log(
      `Processed ${pokemonName} - ${edges.filter((e) => e.from.startsWith(sourceInfo.normalizedName)).length} edges`,
    );
  }

  // Create the final data structure
  const matchupData: PokemonData = {
    nodes: nodes,
    edges: edges,
  };

  // Write to TypeScript file
  const outputPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "pokemonMatchupData.ts",
  );
  const tsContent = `import type { PokemonData } from '../types';

export const pokemonMatchupData: PokemonData = ${JSON.stringify(
    matchupData,
    null,
    2,
  )};
`;
  fs.writeFileSync(outputPath, tsContent, "utf-8");

  console.log(`\nExtraction completed!`);
  console.log(`Total nodes: ${nodes.length}`);
  console.log(`Total edges: ${edges.length}`);
  console.log(`Output file: ${outputPath}`);

  // Print role distribution
  const roleCount = new Map<Role, number>();
  nodes.forEach((node) => {
    roleCount.set(node.role, (roleCount.get(node.role) || 0) + 1);
  });
  console.log("\nRole distribution:");
  roleCount.forEach((count, role) => {
    console.log(`  ${role}: ${count}`);
  });

  return matchupData;
}

// Run the extraction
extractMatchupData().catch(console.error);
