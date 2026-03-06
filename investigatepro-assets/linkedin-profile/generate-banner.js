const puppeteer = require('puppeteer');
const path = require('path');

async function generateBanner() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1584, height: 396 });
  
  const htmlPath = path.join(__dirname, 'banner.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({
    path: path.join(__dirname, 'linkedin-banner.png'),
    type: 'png'
  });
  
  console.log('✅ Banner saved: linkedin-banner.png');
  await browser.close();
}

generateBanner().catch(console.error);
