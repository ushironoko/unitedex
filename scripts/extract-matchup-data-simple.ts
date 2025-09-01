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

// Extract simple matchups without move variations
function extractSimpleMatchups(content: string): {
  advantages: string[];
  disadvantages: string[];
} {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  
  // Find the advantages section
  const advSectionMatch = content.match(
    /##[^#]*このポケモンが有利をとれる相手[^#]*?\n([\s\S]*?)(?=##[^#]*このポケモンが苦手な相手|##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );
  
  if (advSectionMatch) {
    const advText = advSectionMatch[1];
    const lines = advText.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip subsection headers
      if (trimmedLine.startsWith("#")) continue;
      
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract just the pokemon name, ignoring any move in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)/);
        if (match) {
          const pokemonName = match[1].trim();
          
          // Filter out role names and English descriptions
          if (
            pokemonName &&
            ![
              "メイジ",
              "タンク",
              "アサシン",
              "ファイター",
              "サポート",
              "ADC",
              "べた足",
              "ポーク",
            ].includes(pokemonName) &&
            !pokemonName.match(/^[a-zA-Z\s]+$/) &&
            !advantages.includes(pokemonName)
          ) {
            advantages.push(pokemonName);
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
    const lines = disadvText.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip subsection headers
      if (trimmedLine.startsWith("#")) continue;
      
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract just the pokemon name, ignoring any move in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)/);
        if (match) {
          const pokemonName = match[1].trim();
          
          // Filter out role names and English descriptions
          if (
            pokemonName &&
            ![
              "メイジ",
              "タンク",
              "アサシン",
              "ファイター",
              "サポート",
              "ADC",
              "ポーク",
            ].includes(pokemonName) &&
            !pokemonName.match(/^[a-zA-Z\s]+$/) &&
            !disadvantages.includes(pokemonName)
          ) {
            disadvantages.push(pokemonName);
          }
        }
      }
    }
  }
  
  return { advantages, disadvantages };
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
    
    nodes.push({
      id: normalizedName,
      label: pokemonName,
      role: role,
    });
    
    console.log(`Processing ${pokemonName} (${normalizedName}) - Role: ${role}`);
  }
  
  // Second pass: create edges
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const { advantages, disadvantages } = extractSimpleMatchups(content);
    
    // Process advantages
    advantages.forEach(targetPokemon => {
      const targetNormalized = normalizePokemonName(targetPokemon);
      const edgeKey = `${normalizedName}-${targetNormalized}-advantage`;
      
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          from: normalizedName,
          to: targetNormalized,
          type: "advantage",
        });
      }
    });
    
    // Process disadvantages
    disadvantages.forEach(targetPokemon => {
      const targetNormalized = normalizePokemonName(targetPokemon);
      const edgeKey = `${normalizedName}-${targetNormalized}-disadvantage`;
      
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          from: normalizedName,
          to: targetNormalized,
          type: "disadvantage",
        });
      }
    });
    
    console.log(`  Advantages: ${advantages.join(", ")}`);
    console.log(`  Disadvantages: ${disadvantages.join(", ")}`);
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