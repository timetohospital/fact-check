const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

  // Ensure screenshot directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('=== Mobile Charts Test (375x812) ===\n');
  console.log('Navigating to anticancer-generations page...');

  try {
    await page.goto('http://localhost:3000/interactive/anticancer-generations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for page to fully render
    await page.waitForTimeout(3000);

    console.log('Page loaded successfully\n');

    // Take full page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-full-page.png'),
      fullPage: true
    });
    console.log('1. Full page screenshot saved: mobile-full-page.png');

    // Test 1: SurvivalProgressChart - Check for milestone text overlap
    console.log('\n--- Test 1: SurvivalProgressChart ---');

    // Find the survival chart by its title
    const survivalChartTitle = await page.locator('h3:has-text("폐암 5년 생존율")').first();
    if (await survivalChartTitle.count() > 0) {
      await survivalChartTitle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Get the parent container and screenshot it
      const survivalChartContainer = survivalChartTitle.locator('..').first();
      await page.screenshot({
        path: path.join(screenshotDir, 'mobile-survival-chart.png')
      });
      console.log('   Screenshot saved: mobile-survival-chart.png');

      // Check for any overlapping text (by looking at bounding boxes)
      const svgTexts = await page.locator('text:has-text("암등록"), text:has-text("국가암관리")').all();
      console.log(`   Found ${svgTexts.length} milestone text elements`);

      if (svgTexts.length >= 2) {
        const boxes = [];
        for (const text of svgTexts) {
          try {
            const box = await text.boundingBox();
            if (box) boxes.push(box);
          } catch (e) {}
        }

        if (boxes.length >= 2) {
          // Check if boxes overlap
          const overlaps = boxes[0].x + boxes[0].width > boxes[1].x &&
                          boxes[1].x + boxes[1].width > boxes[0].x &&
                          boxes[0].y + boxes[0].height > boxes[1].y &&
                          boxes[1].y + boxes[1].height > boxes[0].y;
          console.log(`   Text overlap check: ${overlaps ? 'OVERLAP DETECTED' : 'No overlap'}`);
        }
      }
    } else {
      console.log('   SurvivalProgressChart title not found');
    }

    // Test 2: DrugTimelineChart - Check title and chart spacing
    console.log('\n--- Test 2: DrugTimelineChart ---');

    const drugTimelineTitle = await page.locator('h3:has-text("항암제 세대별 발전 타임라인")').first();
    if (await drugTimelineTitle.count() > 0) {
      await drugTimelineTitle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'mobile-drug-timeline.png')
      });
      console.log('   Screenshot saved: mobile-drug-timeline.png');

      // Get title position
      const titleBox = await drugTimelineTitle.boundingBox();
      if (titleBox) {
        console.log(`   Title position: y=${titleBox.y.toFixed(0)}, height=${titleBox.height.toFixed(0)}`);

        // Find the SVG element below the title
        const svg = await page.locator('h3:has-text("항암제 세대별 발전 타임라인") ~ div svg').first();
        if (await svg.count() > 0) {
          const svgBox = await svg.boundingBox();
          if (svgBox) {
            const spacing = svgBox.y - (titleBox.y + titleBox.height);
            console.log(`   Chart position: y=${svgBox.y.toFixed(0)}`);
            console.log(`   Title-Chart spacing: ${spacing.toFixed(0)}px`);
            console.log(`   Spacing assessment: ${spacing >= 8 ? 'Adequate' : 'Too tight'}`);
          }
        }
      }
    } else {
      console.log('   DrugTimelineChart title not found');
    }

    // Test 3: Scroll behavior (scroll snap should be removed)
    console.log('\n--- Test 3: Scroll Behavior ---');

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`   Page height: ${pageHeight}px`);

    // Scroll smoothly through the page
    let lastScrollY = 0;
    let scrollCount = 0;
    let smoothScrolling = true;

    for (let scrollTo = 0; scrollTo < pageHeight; scrollTo += 200) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollTo);
      await page.waitForTimeout(50);

      const currentY = await page.evaluate(() => window.scrollY);

      // Check if scroll snapped unexpectedly (jumped more than expected)
      const diff = Math.abs(currentY - scrollTo);
      if (diff > 300) {
        console.log(`   WARNING: Possible scroll snap at ${scrollTo}px (jumped to ${currentY}px)`);
        smoothScrolling = false;
      }

      lastScrollY = currentY;
      scrollCount++;
    }

    console.log(`   Scroll test completed (${scrollCount} scroll steps)`);
    console.log(`   Smooth scrolling: ${smoothScrolling ? 'PASSED' : 'FAILED (snap detected)'}`);

    // Take strategic screenshots at key positions
    console.log('\n--- Strategic Screenshots ---');

    // Scroll to 25%
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.25));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-scroll-25pct.png')
    });
    console.log('   Saved: mobile-scroll-25pct.png');

    // Scroll to 50%
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-scroll-50pct.png')
    });
    console.log('   Saved: mobile-scroll-50pct.png');

    // Scroll to 75%
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-scroll-75pct.png')
    });
    console.log('   Saved: mobile-scroll-75pct.png');

    // Bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-scroll-bottom.png')
    });
    console.log('   Saved: mobile-scroll-bottom.png');

    console.log('\n=== Test Summary ===');
    console.log('Screenshots saved to: ' + screenshotDir);
    console.log('\nManual Review Required:');
    console.log('1. mobile-survival-chart.png - Check if milestone texts overlap');
    console.log('2. mobile-drug-timeline.png - Check title-content spacing');
    console.log('3. All scroll screenshots - Verify natural scroll behavior');

  } catch (error) {
    console.error('\nError during test:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-error.png')
    });
    console.log('Error screenshot saved: mobile-error.png');
  } finally {
    await browser.close();
  }
}

testMobileCharts().catch(console.error);
