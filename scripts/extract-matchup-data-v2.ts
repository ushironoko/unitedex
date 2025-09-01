import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PokemonNode, PokemonEdge, PokemonData, Role } from "../src/types";

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
  };

  if (normalizationMap[name]) {
    return normalizationMap[name];
  }

  // Fallback to simple lowercase conversion
  return name.toLowerCase().replace(/\s+/g, "_");
}

// Extract role from pokemon file
function extractRole(content: string): Role {
  const roleMatch = content.match(/\*\*ロール\*\*:\s*([^（\n]+)/);
  if (roleMatch) {
    const roleText = roleMatch[1].trim();
    if (roleText.includes("Attacker") && !roleText.includes("Physical"))
      return "メイジ";
    if (roleText.includes("Physical Attacker")) return "アサシン";
    if (roleText.includes("Speedster")) return "アサシン";
    if (roleText.includes("All-Rounder")) return "ファイター";
    if (roleText.includes("Defender")) return "タンク";
    if (roleText.includes("Support")) return "サポート";
  }

  // Also check タイプ field
  const typeMatch = content.match(/\*\*タイプ\*\*:\s*([^（\n]+)/);
  if (typeMatch) {
    const typeText = typeMatch[1].trim();
    if (typeText.includes("Speedster")) return "アサシン";
    if (typeText.includes("All-Rounder")) return "ファイター";
    if (typeText.includes("Defender")) return "タンク";
    if (typeText.includes("Support")) return "サポート";
  }

  // Fallback: try to determine from file content
  if (content.includes("Physical Attacker")) return "アサシン";
  if (content.includes("Special Attacker")) return "メイジ";
  if (content.includes("All-Rounder")) return "ファイター";
  if (content.includes("Defender")) return "タンク";
  if (content.includes("Support")) return "サポート";

  // Default fallback
  return "メイジ";
}

interface MatchupWithMove {
  pokemon: string;
  move?: string;
}

interface DetailedMatchups {
  advantages: MatchupWithMove[];
  disadvantages: MatchupWithMove[];
}

// Extract advantages and disadvantages with move variations
function extractDetailedMatchups(content: string): DetailedMatchups {
  const advantages: MatchupWithMove[] = [];
  const disadvantages: MatchupWithMove[] = [];
  
  // Find the advantages section
  const advSectionMatch = content.match(
    /##[^#]*このポケモンが有利をとれる相手[^#]*?\n([\s\S]*?)(?=##[^#]*このポケモンが苦手な相手|##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );
  
  if (advSectionMatch) {
    const advText = advSectionMatch[1];
    let currentMove: string | undefined = undefined;
    const lines = advText.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for subsection headers (move names)
      if (trimmedLine.startsWith("###")) {
        currentMove = trimmedLine.replace(/^###\s*/, "").trim();
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract pokemon name and potential move specification in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)(?:[（(]([^）)]+)[）)])?/);
        if (match) {
          const pokemonName = match[1].trim();
          const moveNote = match[2]?.trim();
          
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
            !pokemonName.match(/^[a-zA-Z\s]+$/)
          ) {
            advantages.push({
              pokemon: pokemonName,
              move: currentMove || moveNote
            });
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
    let currentMove: string | undefined = undefined;
    const lines = disadvText.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for subsection headers (move names)
      if (trimmedLine.startsWith("###")) {
        currentMove = trimmedLine.replace(/^###\s*/, "").trim();
      } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemonWithNote = trimmedLine.replace(/^[-*]\s*/, "").trim();
        
        // Extract pokemon name and potential move specification in parentheses
        const match = pokemonWithNote.match(/^([^（(]+)(?:[（(]([^）)]+)[）)])?/);
        if (match) {
          const pokemonName = match[1].trim();
          const moveNote = match[2]?.trim();
          
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
            !pokemonName.match(/^[a-zA-Z\s]+$/)
          ) {
            disadvantages.push({
              pokemon: pokemonName,
              move: currentMove || moveNote
            });
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
  
  // First pass: collect all Pokemon and their move variations
  const pokemonVariations = new Map<string, { 
    baseName: string;
    variations: Set<string>;
    role: Role;
  }>();
  
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const role = extractRole(content);
    const { advantages, disadvantages } = extractDetailedMatchups(content);
    
    const variations = new Set<string>();
    
    // Collect unique move variations
    advantages.forEach(adv => {
      if (adv.move) variations.add(adv.move);
    });
    disadvantages.forEach(dis => {
      if (dis.move) variations.add(dis.move);
    });
    
    pokemonVariations.set(normalizedName, {
      baseName: pokemonName,
      variations,
      role
    });
  }
  
  // Second pass: create nodes
  for (const [normalizedName, info] of pokemonVariations) {
    if (info.variations.size > 0) {
      // Create nodes for each move variation
      for (const move of info.variations) {
        const nodeId = `${normalizedName}_${move.replace(/\s+/g, "_").toLowerCase()}`;
        nodes.push({
          id: nodeId,
          label: `${info.baseName} (${move})`,
          role: info.role,
        });
      }
    } else {
      // Create single node for Pokemon without move variations
      nodes.push({
        id: normalizedName,
        label: info.baseName,
        role: info.role,
      });
    }
  }
  
  // Third pass: create edges
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    
    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const { advantages, disadvantages } = extractDetailedMatchups(content);
    
    const sourceInfo = pokemonVariations.get(normalizedName)!;
    
    // Process advantages
    advantages.forEach(adv => {
      const targetNormalized = normalizePokemonName(adv.pokemon);
      const targetInfo = pokemonVariations.get(targetNormalized);
      
      if (!targetInfo) return; // Skip if target Pokemon not found
      
      // Determine source node ID
      let sourceNodeId: string;
      if (sourceInfo.variations.size > 0 && adv.move) {
        sourceNodeId = `${normalizedName}_${adv.move.replace(/\s+/g, "_").toLowerCase()}`;
      } else {
        sourceNodeId = normalizedName;
      }
      
      // Determine target node IDs (if target has variations, create edge to all)
      let targetNodeIds: string[] = [];
      if (targetInfo.variations.size > 0) {
        // Target has variations, connect to all of them
        for (const targetMove of targetInfo.variations) {
          targetNodeIds.push(`${targetNormalized}_${targetMove.replace(/\s+/g, "_").toLowerCase()}`);
        }
      } else {
        // Target has no variations
        targetNodeIds = [targetNormalized];
      }
      
      // Create edges
      for (const targetNodeId of targetNodeIds) {
        const edgeKey = `${sourceNodeId}-${targetNodeId}-advantage`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            from: sourceNodeId,
            to: targetNodeId,
            type: "advantage",
          });
        }
      }
    });
    
    // Process disadvantages
    disadvantages.forEach(dis => {
      const targetNormalized = normalizePokemonName(dis.pokemon);
      const targetInfo = pokemonVariations.get(targetNormalized);
      
      if (!targetInfo) return; // Skip if target Pokemon not found
      
      // Determine source node ID
      let sourceNodeId: string;
      if (sourceInfo.variations.size > 0 && dis.move) {
        sourceNodeId = `${normalizedName}_${dis.move.replace(/\s+/g, "_").toLowerCase()}`;
      } else {
        sourceNodeId = normalizedName;
      }
      
      // Determine target node IDs (if target has variations, create edge to all)
      let targetNodeIds: string[] = [];
      if (targetInfo.variations.size > 0) {
        // Target has variations, connect to all of them
        for (const targetMove of targetInfo.variations) {
          targetNodeIds.push(`${targetNormalized}_${targetMove.replace(/\s+/g, "_").toLowerCase()}`);
        }
      } else {
        // Target has no variations
        targetNodeIds = [targetNormalized];
      }
      
      // Create edges
      for (const targetNodeId of targetNodeIds) {
        const edgeKey = `${sourceNodeId}-${targetNodeId}-disadvantage`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            from: sourceNodeId,
            to: targetNodeId,
            type: "disadvantage",
          });
        }
      }
    });
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
  const tsContent = `import { PokemonData } from '../types';

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

  return matchupData;
}

// Run the extraction
extractMatchupData().catch(console.error);