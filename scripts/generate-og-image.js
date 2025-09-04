import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOGImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to OGP image size
  await page.setViewportSize({ width: 1200, height: 630 });
  
  // Read the HTML template
  const htmlPath = path.join(__dirname, '../api/og-image-generator.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // Load the HTML content
  await page.setContent(htmlContent);
  
  // Wait for fonts to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for font rendering
  
  // Take a screenshot
  const outputPath = path.join(__dirname, '../public/og-image.png');
  await page.screenshot({ 
    path: outputPath,
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  
  console.log(`OGP image generated: ${outputPath}`);
}

generateOGImage().catch(console.error);