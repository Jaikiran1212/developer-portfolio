// Optional browser smoke test.  npm i -D playwright && npx playwright install chromium
// Usage: npm run build && npm run preview  (in another terminal)  then:  npm run smoke
let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.log('playwright not installed - skipping smoke test'); process.exit(0); }

const base = process.env.SMOKE_URL || 'http://localhost:4173';
const browser = await chromium.launch();
const errors = [];
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await page.route('**/api/portfolio', (r) => r.abort()); // must still render from bundled data
  await page.goto(base);
  await page.waitForSelector('#nm .c');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) errors.push(`${name}: horizontal scroll`);
  if ((await page.locator('#pj .pj').count()) < 2) errors.push(`${name}: projects missing`);
  if ((await page.locator('#sk .sk').count()) < 10) errors.push(`${name}: skills missing`);
  await page.close();
}
await browser.close();
if (errors.length) { console.error('SMOKE FAILED\n' + errors.join('\n')); process.exit(1); }
console.log('Smoke test passed (desktop + mobile).');
