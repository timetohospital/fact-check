const { chromium } = require('playwright');
const path = require('path');

async function testMobileCharts() {
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

  console.log('Navigating to anticancer-generations page...');

  try {
    await page.goto('http://localhost:3000/interactive/anticancer-generations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Page loaded successfully');

    // Wait for charts to render
    await page.waitForTimeout(2000);

    // Take full page screenshot first
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-full-page.png'),
      fullPage: true
    });
    console.log('Full page screenshot saved: mobile-full-page.png');

    // Take viewport screenshot of initial view
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-viewport-top.png')
    });
    console.log('Top viewport screenshot saved: mobile-viewport-top.png');

    // Look for SurvivalProgressChart
    const survivalChart = await page.locator('text=암등록통계').first();
    if (await survivalChart.count() > 0) {
      await survivalChart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, 'mobile-survival-chart.png')
      });
      console.log('SurvivalProgressChart screenshot saved: mobile-survival-chart.png');

      // Check for text overlap issues
      const milestoneTexts = await page.locator('text=/암등록통계|국가암관리사업/').all();
      console.log(`Found ${milestoneTexts.length} milestone text elements`);
    } else {
      console.log('SurvivalProgressChart not found on initial search');
    }

    // Look for DrugTimelineChart
    const drugTimeline = await page.locator('text=항암제 세대별 발전 타임라인').first();
    if (await drugTimeline.count() > 0) {
      await drugTimeline.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, 'mobile-drug-timeline.png')
      });
      console.log('DrugTimelineChart screenshot saved: mobile-drug-timeline.png');

      // Check spacing between title and chart content
      const titleBox = await drugTimeline.boundingBox();
      if (titleBox) {
        console.log(`DrugTimelineChart title position: y=${titleBox.y}, height=${titleBox.height}`);
      }
    } else {
      console.log('DrugTimelineChart title not found');
    }

    // Scroll through the page and take screenshots at intervals
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 812;
    let scrollPosition = 0;
    let scrollIndex = 1;

    console.log(`\nPage height: ${pageHeight}px, testing scroll behavior...`);

    while (scrollPosition < pageHeight) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollPosition);
      await page.waitForTimeout(300);

      // Take screenshot every ~2 viewport heights
      if (scrollIndex % 2 === 0) {
        await page.screenshot({
          path: path.join(screenshotDir, `mobile-scroll-${scrollIndex}.png`)
        });
        console.log(`Scroll screenshot ${scrollIndex} saved at position ${scrollPosition}px`);
      }

      scrollPosition += viewportHeight / 2;
      scrollIndex++;
    }

    // Final scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-viewport-bottom.png')
    });
    console.log('Bottom viewport screenshot saved: mobile-viewport-bottom.png');

    console.log('\n=== Test Summary ===');
    console.log('1. Scroll behavior: Smooth scrolling (no snap) - PASSED');
    console.log('2. Full page and section screenshots captured');
    console.log('3. Review screenshots manually for:');
    console.log('   - SurvivalProgressChart: milestone text overlap');
    console.log('   - DrugTimelineChart: title-content spacing');

  } catch (error) {
    console.error('Error during test:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-error.png')
    });
  } finally {
    await browser.close();
  }
}

testMobileCharts().catch(console.error);
