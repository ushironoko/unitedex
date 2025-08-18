const { chromium } = require("playwright");

async function scrapeUniteData(pokemonName, url) {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`Accessing ${pokemonName} page...`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    console.log("Waiting for content to load...");
    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      const result = {
        name: "",
        role: "",
        difficulty: "",
        stats: {},
        abilities: [],
        moves: [],
        items: [],
        fullText: "",
      };

      const nameElement = document.querySelector("h1, .pokemon-name, [class*='name']");
      if (nameElement) {
        result.name = nameElement.textContent.trim();
      }

      const roleElement = document.querySelector("[class*='role'], [class*='type']");
      if (roleElement) {
        result.role = roleElement.textContent.trim();
      }

      const difficultyElement = document.querySelector("[class*='difficulty']");
      if (difficultyElement) {
        result.difficulty = difficultyElement.textContent.trim();
      }

      const statContainers = document.querySelectorAll("[class*='stat'], [class*='Stat']");
      statContainers.forEach((container) => {
        const text = container.textContent.trim();
        if (text && text.includes(":")) {
          const [key, value] = text.split(":").map(s => s.trim());
          if (key && value) {
            result.stats[key] = value;
          }
        }
      });

      const moveContainers = document.querySelectorAll("[class*='move'], [class*='Move'], [class*='skill'], [class*='Skill']");
      moveContainers.forEach((container) => {
        const text = container.textContent.trim();
        if (text && text.length > 1 && !text.includes("Loading")) {
          result.moves.push(text);
        }
      });

      const itemContainers = document.querySelectorAll("[class*='item'], [class*='Item'], [class*='build'], [class*='Build']");
      itemContainers.forEach((container) => {
        const text = container.textContent.trim();
        if (text && text.length > 1 && !text.includes("Loading")) {
          result.items.push(text);
        }
      });

      const allTextElements = document.querySelectorAll("p, span, div, h1, h2, h3, h4, h5, h6, td, th, li");
      const textSet = new Set();
      allTextElements.forEach((el) => {
        const text = el.textContent.trim();
        if (text && text.length > 0) {
          textSet.add(text);
        }
      });
      result.fullText = Array.from(textSet).join("\n");

      return result;
    });

    console.log(`\n=== ${pokemonName} Information ===`);
    if (data.name) {
      console.log("Name:", data.name);
    }
    if (data.role) {
      console.log("Role:", data.role);
    }
    if (data.difficulty) {
      console.log("Difficulty:", data.difficulty);
    }
    
    if (Object.keys(data.stats).length > 0) {
      console.log("\n=== Stats ===");
      Object.entries(data.stats).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

    if (data.moves.length > 0) {
      console.log("\n=== Moves/Skills ===");
      const uniqueMoves = [...new Set(data.moves)];
      uniqueMoves.slice(0, 30).forEach((move) => {
        console.log(`- ${move}`);
      });
    }

    console.log("\n=== Full Page Text ===");
    const lines = data.fullText.split("\n");
    lines.forEach(line => {
      if (line.trim()) {
        console.log(line);
      }
    });

    return data;

  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: node scrape-unite.js <pokemon-name> <url>");
    console.log("Example: node scrape-unite.js Garchomp https://unite-db.com/pokemon/garchomp");
    process.exit(1);
  }
  
  const [pokemonName, url] = args;
  scrapeUniteData(pokemonName, url).catch(console.error);
}

module.exports = { scrapeUniteData };