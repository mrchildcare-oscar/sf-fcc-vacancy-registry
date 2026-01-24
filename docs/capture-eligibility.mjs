import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

console.log('Capturing eligibility screener screenshot...\n');

// Go to public listings page
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));

// Look for the eligibility screener section and expand it
try {
  // Find the eligibility card by looking for text about "qualify" or "eligibility"
  const expandButtons = await page.$$('button');
  for (const btn of expandButtons) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.toLowerCase().includes('qualify') || text.toLowerCase().includes('eligibility') || text.toLowerCase().includes('check')) {
      console.log('Found eligibility section, clicking to expand...');
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Also try clicking on the card itself if it's a collapsible
  const cards = await page.$$('div[class*="bg-gradient"]');
  for (const card of cards) {
    const text = await card.evaluate(el => el.textContent || '');
    if (text.toLowerCase().includes('qualify') || text.toLowerCase().includes('free')) {
      console.log('Found eligibility card, clicking...');
      await card.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Fill in some sample data to show the form in use
  const householdSelect = await page.$('select');
  if (householdSelect) {
    await householdSelect.select('4'); // Family of 4
    await new Promise(r => setTimeout(r, 500));
  }

  const incomeInput = await page.$('input[type="text"], input[type="number"]');
  if (incomeInput) {
    await incomeInput.type('85000');
    await new Promise(r => setTimeout(r, 500));
  }

  // Take screenshot
  await page.screenshot({ path: join(__dirname, 'screenshot-eligibility.png') });
  console.log('✓ Saved screenshot-eligibility.png\n');

} catch (e) {
  console.log('Error:', e.message);
  // Take screenshot anyway
  await page.screenshot({ path: join(__dirname, 'screenshot-eligibility.png') });
  console.log('✓ Saved screenshot (may not show expanded form)\n');
}

await browser.close();
console.log('Done!');
