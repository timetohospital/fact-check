const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testScrollyCharts() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();
  const screenshotDir = path.join(__dirname, 'screenshots');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Scrolly Charts Test (375x812) ===\n');

  try {
    await page.goto('http://localhost:3000/interactive/anticancer-generations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(3000);
    console.log('Page loaded successfully\n');

    // Get page info
    const pageInfo = await page.evaluate(() => {
      return {
        pageHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollSteps: document.querySelectorAll('.scroll-step').length
      };
    });

    console.log(`Page info:`);
    console.log(`  Total height: ${pageInfo.pageHeight}px`);
    console.log(`  Viewport: ${pageInfo.viewportHeight}px`);
    console.log(`  Scroll steps: ${pageInfo.scrollSteps}`);

    // Navigate through scroll steps by finding them and scrolling into view
    console.log('\n--- Navigating through scroll steps ---\n');

    // First, scroll past the hero section
    await page.evaluate(() => window.scrollTo(0, window.innerHeight + 100));
    await page.waitForTimeout(1000);

    // Key steps to capture:
    // Step 1: survival chart (생존율 12.5%)
    // Step 2: timeline chart (1세대 화학항암제)
    // Step 11: survival chart (40.6%)
    // Step 12: timeline chart (final)

    const targetSteps = [
      { step: 1, name: 'Step1-SurvivalChart-12.5%', chartType: 'survival' },
      { step: 2, name: 'Step2-DrugTimeline-Gen1', chartType: 'timeline' },
      { step: 3, name: 'Step3-SurvivalChart-Improvement', chartType: 'survival' },
      { step: 11, name: 'Step11-SurvivalChart-40.6%', chartType: 'survival' },
      { step: 12, name: 'Step12-DrugTimeline-Final', chartType: 'timeline' }
    ];

    for (const target of targetSteps) {
      console.log(`\nNavigating to Step ${target.step} (${target.chartType})...`);

      // Find the scroll-step element by data-step attribute
      const stepElement = await page.locator(`[data-step="${target.step - 1}"]`).first();

      if (await stepElement.count() > 0) {
        // Scroll the step into view
        await stepElement.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500); // Wait for animation and chart render

        // Take screenshot
        await page.screenshot({
          path: path.join(screenshotDir, `${target.name}.png`)
        });
        console.log(`  Screenshot saved: ${target.name}.png`);

        // Check for specific chart elements based on chart type
        if (target.chartType === 'survival') {
          // Look for SurvivalProgressChart title
          const chartTitle = await page.locator('h3:has-text("폐암 5년 생존율")').first();
          if (await chartTitle.count() > 0) {
            console.log('  SurvivalProgressChart: VISIBLE');

            // Check for milestone texts
            const svgTexts = await page.evaluate(() => {
              const texts = Array.from(document.querySelectorAll('svg text'));
              return texts.map(t => t.textContent).filter(t => t && (t.includes('암등록') || t.includes('국가암관리')));
            });

            if (svgTexts.length > 0) {
              console.log(`  Milestone texts found: ${svgTexts.join(', ')}`);
            }
          } else {
            console.log('  SurvivalProgressChart: NOT RENDERED (chart renders conditionally)');
          }
        }

        if (target.chartType === 'timeline') {
          // Look for DrugTimelineChart title
          const chartTitle = await page.locator('h3:has-text("항암제 세대별 발전 타임라인")').first();
          if (await chartTitle.count() > 0) {
            console.log('  DrugTimelineChart: VISIBLE');

            // Get spacing info
            const spacingInfo = await page.evaluate(() => {
              const title = document.querySelector('h3');
              if (!title || !title.textContent?.includes('타임라인')) return null;

              const titleRect = title.getBoundingClientRect();
              const scrollContainer = title.nextElementSibling;
              if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                return {
                  spacing: containerRect.top - titleRect.bottom
                };
              }
              return null;
            });

            if (spacingInfo) {
              console.log(`  Title-Chart spacing: ${spacingInfo.spacing.toFixed(0)}px`);
            }
          } else {
            console.log('  DrugTimelineChart: NOT RENDERED');
          }
        }
      } else {
        console.log(`  Step element not found`);
      }
    }

    // Test scroll smoothness
    console.log('\n--- Scroll Smoothness Test ---');

    // Reset to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Scroll through the page in small increments and check for snap behavior
    let snappedCount = 0;
    const scrollPositions = [];

    for (let targetY = 0; targetY < Math.min(pageInfo.pageHeight, 10000); targetY += 300) {
      await page.evaluate((y) => window.scrollTo(0, y), targetY);
      await page.waitForTimeout(100);

      const actualY = await page.evaluate(() => window.scrollY);
      const diff = Math.abs(actualY - targetY);

      scrollPositions.push({ target: targetY, actual: actualY, diff });

      if (diff > 100) {
        snappedCount++;
      }
    }

    console.log(`  Total scroll steps: ${scrollPositions.length}`);
    console.log(`  Steps with significant deviation: ${snappedCount}`);

    if (snappedCount > scrollPositions.length * 0.3) {
      console.log('  RESULT: Scroll snap behavior DETECTED');
    } else {
      console.log('  RESULT: Scroll appears smooth (no snap)');
    }

    // Take a final full-page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'final-full-page.png'),
      fullPage: true
    });
    console.log('\nFinal full-page screenshot saved: final-full-page.png');

    console.log('\n=== Test Complete ===');
    console.log(`\nScreenshots saved to: ${screenshotDir}`);
    console.log('\nReview required:');
    console.log('1. Step1/Step3/Step11 screenshots: Check SurvivalProgressChart milestone text overlap');
    console.log('2. Step2/Step12 screenshots: Check DrugTimelineChart title-content spacing');
    console.log('3. Scroll behavior: Check if scroll snapping affects user experience');

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'scrolly-error.png')
    });
  } finally {
    await browser.close();
  }
}

testScrollyCharts().catch(console.error);
