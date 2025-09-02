import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Role, PokemonData } from "../src/types";

// ESモジュールで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ディレクトリ内のマークダウンファイルを取得
const uniteDir = path.join(__dirname, "..", "unite");
const excludeFiles = new Set([
  "items.md",
  "update_log.md",
  "over_power.md",
  "タンク.md",
  "メイジ.md",
  "サポート.md",
  "アサシン.md",
  "ファイター.md",
]);

// タイプ変換マッピング
const typeMapping: Record<string, Role> = {
  "Defender（ディフェンス型）": "タンク",
  "Supporter（サポート型）": "サポート",
  "Attacker（アタック型）": "メイジ",
  "Attacker（アタッカー型）": "メイジ",
  "All-Rounder（バランス型）": "ファイター",
  "Speedster（スピード型）": "アサシン",
  // 括弧なしのバリエーション
  Defender: "タンク",
  Supporter: "サポート",
  Attacker: "メイジ",
  "All-Rounder": "ファイター",
  Speedster: "アサシン",
};

interface PokemonType {
  original: string;
  mapped: Role;
}

async function extractTypes(): Promise<void> {
  const pokemonTypes: Record<string, PokemonType> = {};

  // 各ポケモンファイルを処理
  const files = fs.readdirSync(uniteDir);
  for (const filename of files) {
    if (filename.endsWith(".md") && !excludeFiles.has(filename)) {
      const pokemonName = filename.slice(0, -3); // .mdを除去

      const filepath = path.join(uniteDir, filename);
      try {
        const content = fs.readFileSync(filepath, "utf-8");

        // 基本情報セクションを探す
        const basicInfoMatch = content.match(/### 基本情報.*?(?=###|$)/s);
        if (basicInfoMatch) {
          const basicInfo = basicInfoMatch[0];

          // タイプ情報を抽出
          const typeMatch = basicInfo.match(/- \*\*タイプ\*\*:\s*(.+)/);
          if (typeMatch) {
            const typeInfo = typeMatch[1].trim();

            // マッピングを適用
            const mappedType = typeMapping[typeInfo];
            if (mappedType) {
              pokemonTypes[pokemonName] = {
                original: typeInfo,
                mapped: mappedType,
              };
            } else {
              console.warn(`Unknown type for ${pokemonName}: ${typeInfo}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }
    }
  }

  // 結果を出力
  console.log("ポケモンタイプ抽出結果:");
  const sortedPokemon = Object.entries(pokemonTypes).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [pokemon, types] of sortedPokemon) {
    console.log(`${pokemon}: ${types.original} → ${types.mapped}`);
  }

  // 各ロールの集計
  const roleCounts: Record<string, number> = {};
  for (const [, types] of Object.entries(pokemonTypes)) {
    const role = types.mapped;
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  }

  console.log("\nロール別体数:");
  const sortedRoles = Object.entries(roleCounts).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [role, count] of sortedRoles) {
    console.log(`${role}: ${count}体`);
  }

  // TypeScriptデータファイル読み込みと更新
  const dataPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "pokemonMatchupData.ts",
  );
  const dataContent = fs.readFileSync(dataPath, "utf-8");

  // データを抽出
  const dataMatch = dataContent.match(
    /export const pokemonMatchupData: PokemonData = ({[\s\S]*});/,
  );
  if (!dataMatch) {
    throw new Error("Could not extract data from TypeScript file");
  }

  // データをパース（evalは避けてJSON.parseを使用）
  const jsonStr = dataMatch[1]
    .replace(/(\w+):/g, '"$1":') // キーをクォート
    .replace(/'/g, '"'); // シングルクォートをダブルクォートに

  let data: PokemonData;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    // フォールバック: Function constructorを使用
    const func = new Function("return " + dataMatch[1]);
    data = func();
  }

  // ノードのroleフィールドを更新
  let updatedCount = 0;
  for (const node of data.nodes) {
    const pokemonLabel = node.label;
    if (pokemonLabel in pokemonTypes) {
      const newRole = pokemonTypes[pokemonLabel].mapped;
      if (node.role !== newRole) {
        console.log(`Updating ${pokemonLabel}: ${node.role} → ${newRole}`);
        node.role = newRole;
        updatedCount++;
      }
    }
  }

  console.log(`\n更新されたポケモン数: ${updatedCount}`);

  // 更新されたTypeScriptファイルを書き戻し
  const updatedContent = `import type { PokemonData } from "../types";

export const pokemonMatchupData: PokemonData = ${JSON.stringify(data, null, 2)};
`;

  fs.writeFileSync(dataPath, updatedContent, "utf-8");
  console.log("pokemonMatchupData.ts を更新しました");

  // Biomeでフォーマットを適用
  const { execSync } = await import("child_process");
  try {
    execSync("pnpm biome format --write src/data/pokemonMatchupData.ts", {
      stdio: "inherit",
    });
    console.log("Biomeフォーマットを適用しました");
  } catch (error) {
    console.error("Biomeフォーマットの適用に失敗しました:", error);
  }
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  extractTypes().catch(console.error);
}

export { extractTypes };
