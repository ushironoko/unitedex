import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { PokemonNode, PokemonEdge, PokemonData, Role } from "../src/types/index.js";

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
    if (typeText.includes("Supporter") || typeText.includes("Support")) return "サポート";
    if (typeText.includes("Attacker")) return "メイジ";
  }

  // Fallback to ロール field if タイプ is not found
  const roleMatch = content.match(/\*\*ロール\*\*:\s*([^（\n]+)/);
  if (roleMatch) {
    const roleText = roleMatch[1].trim();
    if (roleText.includes("Speedster")) return "アサシン";
    if (roleText.includes("All-Rounder")) return "ファイター";
    if (roleText.includes("Defender")) return "タンク";
    if (roleText.includes("Support")) return "サポート";
    // For Attacker, determine by Physical vs Special
    if (roleText.includes("Physical Attacker")) return "アサシン";
    if (roleText.includes("Special Attacker") || roleText.includes("Attacker")) return "メイジ";
  }

  // Default fallback
  return "メイジ";
}

// Define which Pokemon have actual move variations
const POKEMON_WITH_MOVE_VARIATIONS: Record<string, string[]> = {
  "ウーラオス": ["あんこくきょうだ", "すいりゅうれんだ"],
  "ルカリオ": ["神速", "グロウパンチ+ボーンラッシュ"],
  // Add more Pokemon with real move variations here as needed
};

// Extract matchups with proper move handling
function extractMatchupsWithMoves(content: string, pokemonName: string): {
  moveAdvantages: Map<string, string[]>;
  moveDisadvantages: Map<string, string[]>;
  generalAdvantages: string[];
  generalDisadvantages: string[];
} {
  const moveAdvantages = new Map<string, string[]>();
  const moveDisadvantages = new Map<string, string[]>();
  const generalAdvantages: string[] = [];
  const generalDisadvantages: string[] = [];
  
  const pokemonMoveVariations = POKEMON_WITH_MOVE_VARIATIONS[pokemonName] || [];
  
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
      
      // Check for section headers that match our move variations
      if (trimmedLine.startsWith("##")) {
        const sectionName = trimmedLine.replace(/^##\s*/, "").trim();
        if (pokemonMoveVariations.includes(sectionName)) {
          currentSection = sectionName;
          moveAdvantages.set(sectionName, []);
        } else {
          currentSection = null;
        }
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract just the pokemon name, ignoring any move in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)/);
        if (match) {
          const targetPokemon = match[1].trim();
          
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
            if (currentSection && moveAdvantages.has(currentSection)) {
              const moveList = moveAdvantages.get(currentSection)!;
              if (!moveList.includes(targetPokemon)) {
                moveList.push(targetPokemon);
              }
            } else {
              if (!generalAdvantages.includes(targetPokemon)) {
                generalAdvantages.push(targetPokemon);
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
      
      // Check for section headers that match our move variations
      if (trimmedLine.startsWith("##")) {
        const sectionName = trimmedLine.replace(/^##\s*/, "").trim();
        if (pokemonMoveVariations.includes(sectionName)) {
          currentSection = sectionName;
          moveDisadvantages.set(sectionName, []);
        } else {
          currentSection = null;
        }
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract just the pokemon name, ignoring any move in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)/);
        if (match) {
          const targetPokemon = match[1].trim();
          
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
              "ポーク",
            ].includes(targetPokemon) &&
            !targetPokemon.match(/^[a-zA-Z\s]+$/)
          ) {
            if (currentSection && moveDisadvantages.has(currentSection)) {
              const moveList = moveDisadvantages.get(currentSection)!;
              if (!moveList.includes(targetPokemon)) {
                moveList.push(targetPokemon);
              }
            } else {
              if (!generalDisadvantages.includes(targetPokemon)) {
                generalDisadvantages.push(targetPokemon);
              }
            }
          }
        }
      }
    }
  }
  
  return { moveAdvantages, moveDisadvantages, generalAdvantages, generalDisadvantages };
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
  
  // First pass: create all nodes
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const role = extractRole(content);
    
    // Check if this Pokemon has move variations
    const moveVariations = POKEMON_WITH_MOVE_VARIATIONS[pokemonName];
    
    if (moveVariations && moveVariations.length > 0) {
      // Create nodes for each move variation
      for (const move of moveVariations) {
        const nodeId = `${normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").toLowerCase()}`;
        nodes.push({
          id: nodeId,
          label: `${pokemonName} (${move})`,
          role: role,
        });
      }
    } else {
      // Create single node for Pokemon without move variations
      nodes.push({
        id: normalizedName,
        label: pokemonName,
        role: role,
      });
    }
    
    console.log(`Processing ${pokemonName} (${normalizedName}) - Role: ${role}`);
  }
  
  // Second pass: create edges
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const { moveAdvantages, moveDisadvantages, generalAdvantages, generalDisadvantages } = 
      extractMatchupsWithMoves(content, pokemonName);
    
    // Process move-specific matchups
    for (const [move, targets] of moveAdvantages) {
      const sourceNodeId = `${normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").toLowerCase()}`;
      for (const target of targets) {
        const targetNormalized = normalizePokemonName(target);
        // Find all nodes that match the target (including its variations)
        const targetNodes = nodes.filter(n => n.id === targetNormalized || n.id.startsWith(`${targetNormalized}_`));
        
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
      const sourceNodeId = `${normalizedName}_${move.replace(/\s+/g, "_").replace(/\+/g, "_").toLowerCase()}`;
      for (const target of targets) {
        const targetNormalized = normalizePokemonName(target);
        // Find all nodes that match the target (including its variations)
        const targetNodes = nodes.filter(n => n.id === targetNormalized || n.id.startsWith(`${targetNormalized}_`));
        
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
    const sourceNodes = nodes.filter(n => n.id === normalizedName || n.id.startsWith(`${normalizedName}_`));
    
    for (const sourceNode of sourceNodes) {
      // General advantages
      for (const target of generalAdvantages) {
        const targetNormalized = normalizePokemonName(target);
        // Find all nodes that match the target (including its variations)
        const targetNodes = nodes.filter(n => n.id === targetNormalized || n.id.startsWith(`${targetNormalized}_`));
        
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
        const targetNormalized = normalizePokemonName(target);
        // Find all nodes that match the target (including its variations)
        const targetNodes = nodes.filter(n => n.id === targetNormalized || n.id.startsWith(`${targetNormalized}_`));
        
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
    
    console.log(`  Processed ${pokemonName} - ${edges.filter(e => e.from.startsWith(normalizedName)).length} edges`);
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
  nodes.forEach(node => {
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