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

interface Matchups {
  advantages: string[];
  disadvantages: string[];
}

// Extract advantages and disadvantages
function extractMatchups(content: string): Matchups {
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  // Find the advantages section - more flexible regex
  const advSectionMatch = content.match(
    /##[^#]*このポケモンが有利をとれる相手[^#]*?\n([\s\S]*?)(?=##[^#]*このポケモンが苦手な相手|##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );
  if (advSectionMatch) {
    const advText = advSectionMatch[1];
    // Look for all bullet points (both - and *) and subsection content
    const lines = advText.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemon = trimmedLine.replace(/^[-*]\s*/, "").trim();
        // Remove anything in parentheses and filter out role names
        const cleanPokemon = pokemon
          .replace(/\(.*?\)/g, "")
          .replace(/（.*?）/g, "")
          .trim();
        if (
          cleanPokemon &&
          ![
            "メイジ",
            "タンク",
            "アサシン",
            "ファイター",
            "サポート",
            "ADC",
            "べた足",
          ].includes(cleanPokemon) &&
          !cleanPokemon.match(/^[a-zA-Z\s]+$/)
        ) {
          // Skip English descriptions
          advantages.push(cleanPokemon);
        }
      }
    }
  }

  // Find the disadvantages section - more flexible regex
  const disadvSectionMatch = content.match(
    /##[^#]*このポケモンが苦手な相手[^#]*?\n([\s\S]*?)(?=##[^#]*適正レーン|##[^#]*パワースパイク|##[^#]*時間ごとのパワー|$)/,
  );
  if (disadvSectionMatch) {
    const disadvText = disadvSectionMatch[1];
    // Look for all bullet points (both - and *) and subsection content
    const lines = disadvText.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const pokemon = trimmedLine.replace(/^[-*]\s*/, "").trim();
        // Remove anything in parentheses and filter out role names
        const cleanPokemon = pokemon
          .replace(/\(.*?\)/g, "")
          .replace(/（.*?）/g, "")
          .trim();
        if (
          cleanPokemon &&
          ![
            "メイジ",
            "タンク",
            "アサシン",
            "ファイター",
            "サポート",
            "ADC",
          ].includes(cleanPokemon) &&
          !cleanPokemon.match(/^[a-zA-Z\s]+$/)
        ) {
          // Skip English descriptions
          disadvantages.push(cleanPokemon);
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
  const pokemonSet = new Set<string>();

  // Process each pokemon file
  for (const file of pokemonFiles) {
    const filePath = path.join(uniteDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const pokemonName = file.replace(".md", "");
    const normalizedName = normalizePokemonName(pokemonName);
    const role = extractRole(content);
    const { advantages, disadvantages } = extractMatchups(content);

    console.log(
      `Processing ${pokemonName} (${normalizedName}) - Role: ${role}`,
    );
    console.log(`  Advantages: ${advantages.join(", ")}`);
    console.log(`  Disadvantages: ${disadvantages.join(", ")}`);

    // Add to nodes
    nodes.push({
      id: normalizedName,
      label: pokemonName,
      role: role,
    });

    pokemonSet.add(normalizedName);

    // Add advantage edges (this pokemon has advantage over others) - with deduplication
    const uniqueAdvantages = [...new Set(advantages)]; // Remove duplicates
    uniqueAdvantages.forEach((target) => {
      const targetNormalized = normalizePokemonName(target);
      edges.push({
        from: normalizedName,
        to: targetNormalized,
        type: "advantage",
      });
    });

    // Add disadvantage edges (disadvantage arrows point FROM the target TO this pokemon) - with deduplication
    const uniqueDisadvantages = [...new Set(disadvantages)]; // Remove duplicates
    uniqueDisadvantages.forEach((target) => {
      const targetNormalized = normalizePokemonName(target);
      edges.push({
        from: targetNormalized, // 相手から
        to: normalizedName, // 自分へ
        type: "disadvantage",
      });
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
