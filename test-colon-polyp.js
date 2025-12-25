const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testColonPolypPage() {
  console.log('=== Colon Polyp Cancer Risk Page - Color Palette Test ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    console.log('Navigating to colon-polyp-cancer-risk page...');
    await page.goto('http://localhost:3001/interactive/colon-polyp-cancer-risk', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('Page loaded successfully\n');

    // Take initial screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'colon-polyp-initial.png'),
      fullPage: false
    });
    console.log('1. Initial screenshot saved: colon-polyp-initial.png');

    // Check for Hero stats
    console.log('\n--- Hero Stats Check ---');
    const heroStats = await page.$$eval('.text-4xl, .text-5xl', els =>
      els.map(el => el.textContent).filter(t => t && t.includes('%'))
    );
    console.log('   Hero stats found:', heroStats.length > 0 ? heroStats.join(', ') : 'None');

    // Scroll to check charts
    console.log('\n--- Scrolling through steps ---');

    // Scroll 50%
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'colon-polyp-50pct.png'),
      fullPage: false
    });
    console.log('2. 50% scroll screenshot saved: colon-polyp-50pct.png');

    // Scroll 75%
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'colon-polyp-75pct.png'),
      fullPage: false
    });
    console.log('3. 75% scroll screenshot saved: colon-polyp-75pct.png');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, 'colon-polyp-bottom.png'),
      fullPage: false
    });
    console.log('4. Bottom screenshot saved: colon-polyp-bottom.png');

    // Full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'colon-polyp-full.png'),
      fullPage: true
    });
    console.log('5. Full page screenshot saved: colon-polyp-full.png');

    // Check color palette usage
    console.log('\n--- Color Palette Check ---');

    // Check for old red colors (should NOT be present)
    const pageContent = await page.content();
    const hasRed = pageContent.includes('#EF4444') ||
                   pageContent.includes('#DC2626') ||
                   pageContent.includes('#F59E0B') ||
                   pageContent.includes('red-');

    const hasBlue800 = pageContent.includes('#1E40AF') ||
                       pageContent.includes('blue-800');

    const hasGreen = pageContent.includes('#10B981') ||
                     pageContent.includes('green-500');

    const hasGray = pageContent.includes('#6B7280') ||
                    pageContent.includes('gray-500');

    console.log(`   Old Red/Amber colors: ${hasRed ? 'FOUND (needs review)' : 'NOT FOUND (good)'}`);
    console.log(`   Blue-800 (high risk): ${hasBlue800 ? 'FOUND (good)' : 'NOT FOUND'}`);
    console.log(`   Green-500 (safe): ${hasGreen ? 'FOUND (good)' : 'NOT FOUND'}`);
    console.log(`   Gray-500 (neutral): ${hasGray ? 'FOUND (good)' : 'NOT FOUND'}`);

    console.log('\n=== Test Complete ===');
    console.log(`Screenshots saved to: ${screenshotsDir}\n`);
    console.log('Color Palette Summary:');
    console.log('  - Expected: Green (safe) → Gray (neutral) → Blue-800 (high risk)');
    console.log('  - Old red/orange colors should be replaced with Blue-800');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testColonPolypPage();
