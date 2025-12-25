const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testChartsDetailed() {
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

  console.log('=== Detailed Charts Test (375x812) ===\n');

  try {
    await page.goto('http://localhost:3000/interactive/anticancer-generations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(3000);
    console.log('Page loaded successfully\n');

    // Get page content info
    const pageInfo = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      return {
        h3Texts: h3s.map(h => ({
          text: h.textContent,
          top: h.getBoundingClientRect().top + window.scrollY
        })),
        pageHeight: document.body.scrollHeight
      };
    });

    console.log('Page structure:');
    console.log(`  Total height: ${pageInfo.pageHeight}px`);
    console.log(`  H3 titles found: ${pageInfo.h3Texts.length}`);
    pageInfo.h3Texts.forEach((h, i) => {
      console.log(`    ${i+1}. "${h.text}" at y=${h.top.toFixed(0)}px`);
    });

    // Find and screenshot SurvivalProgressChart
    console.log('\n--- SurvivalProgressChart ---');
    const survivalChart = pageInfo.h3Texts.find(h =>
      h.text && h.text.includes('생존율')
    );

    if (survivalChart) {
      // Scroll to position the chart in view
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 100)), survivalChart.top);
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'survival-chart-view1.png')
      });
      console.log(`  Screenshot 1 saved at scroll position ${survivalChart.top - 100}`);

      // Scroll down to see more of the chart
      await page.evaluate((y) => window.scrollTo(0, y + 200), survivalChart.top);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, 'survival-chart-view2.png')
      });
      console.log('  Screenshot 2 saved (scrolled down)');

      // Check for milestone text elements in SVG
      const milestoneInfo = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('svg text'));
        const milestones = texts.filter(t => {
          const content = t.textContent || '';
          return content.includes('암등록') || content.includes('국가암관리') || content.includes('시작');
        });
        return milestones.map(m => ({
          text: m.textContent,
          bbox: m.getBoundingClientRect()
        }));
      });

      console.log(`  Milestone texts found: ${milestoneInfo.length}`);
      milestoneInfo.forEach(m => {
        console.log(`    "${m.text}" at (${m.bbox.x.toFixed(0)}, ${m.bbox.y.toFixed(0)}) size: ${m.bbox.width.toFixed(0)}x${m.bbox.height.toFixed(0)}`);
      });

      // Check for overlap
      if (milestoneInfo.length >= 2) {
        for (let i = 0; i < milestoneInfo.length; i++) {
          for (let j = i + 1; j < milestoneInfo.length; j++) {
            const a = milestoneInfo[i].bbox;
            const b = milestoneInfo[j].bbox;
            const horizontalOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
            const verticalOverlap = a.y < b.y + b.height && a.y + a.height > b.y;
            if (horizontalOverlap && verticalOverlap) {
              console.log(`  WARNING: Text overlap detected between "${milestoneInfo[i].text}" and "${milestoneInfo[j].text}"`);
            }
          }
        }
      }
    } else {
      console.log('  SurvivalProgressChart not found');
    }

    // Find and screenshot DrugTimelineChart
    console.log('\n--- DrugTimelineChart ---');
    const drugTimeline = pageInfo.h3Texts.find(h =>
      h.text && h.text.includes('타임라인')
    );

    if (drugTimeline) {
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), drugTimeline.top);
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'drug-timeline-view1.png')
      });
      console.log(`  Screenshot 1 saved at scroll position ${drugTimeline.top - 50}`);

      // Check title and chart spacing
      const spacingInfo = await page.evaluate(() => {
        const title = Array.from(document.querySelectorAll('h3')).find(h =>
          h.textContent && h.textContent.includes('타임라인')
        );
        if (!title) return null;

        const titleRect = title.getBoundingClientRect();
        const nextDiv = title.nextElementSibling;

        if (nextDiv) {
          const nextRect = nextDiv.getBoundingClientRect();
          return {
            titleBottom: titleRect.bottom,
            nextTop: nextRect.top,
            spacing: nextRect.top - titleRect.bottom
          };
        }
        return { titleBottom: titleRect.bottom, nextTop: null, spacing: null };
      });

      if (spacingInfo) {
        console.log(`  Title bottom: ${spacingInfo.titleBottom.toFixed(0)}px`);
        console.log(`  Content top: ${spacingInfo.nextTop ? spacingInfo.nextTop.toFixed(0) + 'px' : 'N/A'}`);
        console.log(`  Spacing: ${spacingInfo.spacing ? spacingInfo.spacing.toFixed(0) + 'px' : 'N/A'}`);
        if (spacingInfo.spacing !== null) {
          console.log(`  Assessment: ${spacingInfo.spacing >= 8 ? 'ADEQUATE' : 'TOO TIGHT'}`);
        }
      }

      // Scroll to see more of the chart
      await page.evaluate((y) => window.scrollTo(0, y + 300), drugTimeline.top);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(screenshotDir, 'drug-timeline-view2.png')
      });
      console.log('  Screenshot 2 saved (scrolled down)');
    } else {
      console.log('  DrugTimelineChart not found');
    }

    // Test scroll behavior more precisely
    console.log('\n--- Scroll Behavior Test ---');

    // Reset to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Test scroll in small increments
    let snapDetected = false;
    const scrollSteps = [];

    for (let target = 0; target < 5000; target += 100) {
      await page.evaluate((y) => window.scrollTo(0, y), target);
      await page.waitForTimeout(30);

      const actual = await page.evaluate(() => window.scrollY);
      const diff = Math.abs(actual - target);

      if (diff > 50) {
        scrollSteps.push({ target, actual, diff });
        if (diff > 200) {
          snapDetected = true;
        }
      }
    }

    if (scrollSteps.length > 0) {
      console.log('  Scroll discrepancies detected:');
      scrollSteps.slice(0, 5).forEach(s => {
        console.log(`    Target: ${s.target}px, Actual: ${s.actual}px, Diff: ${s.diff}px`);
      });
    }

    console.log(`  Scroll snap behavior: ${snapDetected ? 'DETECTED (potential issue)' : 'NOT DETECTED (smooth scrolling)'}`);

    console.log('\n=== Test Complete ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({
      path: path.join(screenshotDir, 'error.png')
    });
  } finally {
    await browser.close();
  }
}

testChartsDetailed().catch(console.error);
