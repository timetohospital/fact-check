import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000/interactive/colon-polyp-cancer-risk/';
const SCREENSHOT_DIR = path.join(__dirname, 'playwright-screenshots');

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  screenshot?: string;
  details?: any;
}

async function runPlaywrightTest() {
  const results: TestResult[] = [];

  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Starting Playwright test for colon-polyp-cancer-risk page...\n');

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page: Page = await context.newPage();

  try {
    // 1. Navigate to the page
    console.log('1. Navigating to page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const heroScreenshot = path.join(SCREENSHOT_DIR, '01-hero-section.png');
    await page.screenshot({ path: heroScreenshot, fullPage: false });

    results.push({
      step: 'Page Navigation',
      status: 'pass',
      message: 'Successfully navigated to the page',
      screenshot: heroScreenshot
    });

    // 2. Check Hero Section AnimatedNumbers
    console.log('2. Checking Hero Section AnimatedNumbers...');

    const heroStats = await page.evaluate(() => {
      const statCards = document.querySelectorAll('.grid.grid-cols-2 > div');
      const stats: { text: string; value: string }[] = [];

      statCards.forEach((card) => {
        const valueEl = card.querySelector('.text-2xl, .text-4xl');
        const labelEl = card.querySelector('p');
        if (valueEl && labelEl) {
          stats.push({
            value: valueEl.textContent?.trim() || '',
            text: labelEl.textContent?.trim() || ''
          });
        }
      });

      return stats;
    });

    console.log('   Hero Stats found:', heroStats);

    const expectedValues = ['5-10%', '40%', '8.6%', '10-15년'];
    const foundValues = heroStats.map(s => s.value);

    let heroStatus: 'pass' | 'fail' | 'warning' = 'pass';
    const missingValues = expectedValues.filter(v => !foundValues.some(fv => fv.includes(v.replace('%', '').replace('년', ''))));

    if (missingValues.length > 0) {
      heroStatus = 'warning';
    }

    results.push({
      step: 'Hero Section AnimatedNumbers',
      status: heroStatus,
      message: `Found ${heroStats.length} stat cards. Values: ${foundValues.join(', ')}`,
      details: { heroStats, missingValues }
    });

    // 3. Scroll through steps and capture charts
    console.log('3. Scrolling through steps and capturing charts...');

    const scrollSteps = [
      { name: 'intro-donut', scrollY: 1000, waitMs: 2000 },
      { name: 'step-1-30percent', scrollY: 1800, waitMs: 1500 },
      { name: 'step-2-5-10percent', scrollY: 2600, waitMs: 1500 },
      { name: 'step-3-classification', scrollY: 3400, waitMs: 2000 },
      { name: 'step-4-polyp-risk-tubular', scrollY: 4200, waitMs: 2500 },
      { name: 'step-5-polyp-risk-villous', scrollY: 5000, waitMs: 2500 },
      { name: 'step-6-size-risk', scrollY: 5800, waitMs: 2500 },
      { name: 'step-7-serrated-warning', scrollY: 6600, waitMs: 2000 },
      { name: 'step-8-timeline-risk', scrollY: 7400, waitMs: 2500 },
      { name: 'step-9-prevention', scrollY: 8200, waitMs: 1500 },
      { name: 'step-10-schedule', scrollY: 9000, waitMs: 1500 },
    ];

    for (let i = 0; i < scrollSteps.length; i++) {
      const step = scrollSteps[i];
      console.log(`   Scrolling to ${step.name}...`);

      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), step.scrollY);
      await page.waitForTimeout(step.waitMs);

      const screenshotPath = path.join(SCREENSHOT_DIR, `02-scroll-${String(i + 1).padStart(2, '0')}-${step.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      results.push({
        step: `Scroll Step: ${step.name}`,
        status: 'pass',
        message: `Captured screenshot at scroll position ${step.scrollY}`,
        screenshot: screenshotPath
      });
    }

    // 4. Check D3 Charts
    console.log('4. Checking D3 Charts...');

    // Scroll back to where charts should be visible
    await page.evaluate(() => window.scrollTo({ top: 4500, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    const chartInfo = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      const charts: {
        hasBars: boolean;
        hasLines: boolean;
        hasCircles: boolean;
        hasText: boolean;
        width: number;
        height: number;
        class: string;
      }[] = [];

      svgs.forEach((svg) => {
        const rect = svg.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          charts.push({
            hasBars: svg.querySelectorAll('rect.bar, rect[class*="bar"]').length > 0 ||
                     svg.querySelectorAll('rect').length > 3,
            hasLines: svg.querySelectorAll('path[stroke]').length > 0,
            hasCircles: svg.querySelectorAll('circle').length > 0,
            hasText: svg.querySelectorAll('text').length > 0,
            width: rect.width,
            height: rect.height,
            class: svg.className.baseVal || ''
          });
        }
      });

      return charts;
    });

    console.log('   Chart SVGs found:', chartInfo.length);

    const d3ChartsScreenshot = path.join(SCREENSHOT_DIR, '03-d3-charts-area.png');
    await page.screenshot({ path: d3ChartsScreenshot, fullPage: false });

    results.push({
      step: 'D3 Charts Detection',
      status: chartInfo.length > 0 ? 'pass' : 'warning',
      message: `Found ${chartInfo.length} chart SVGs with visual elements`,
      screenshot: d3ChartsScreenshot,
      details: chartInfo
    });

    // 5. Check PolypRiskChart specifically
    console.log('5. Checking PolypRiskChart...');
    await page.evaluate(() => window.scrollTo({ top: 4800, behavior: 'smooth' }));
    await page.waitForTimeout(2500);

    const polypRiskScreenshot = path.join(SCREENSHOT_DIR, '04-polyp-risk-chart.png');
    await page.screenshot({ path: polypRiskScreenshot, fullPage: false });

    const polypChartElements = await page.evaluate(() => {
      // Look for horizontal bar chart elements
      const allRects = document.querySelectorAll('svg rect');
      const barRects = Array.from(allRects).filter(r => {
        const width = parseFloat(r.getAttribute('width') || '0');
        const height = parseFloat(r.getAttribute('height') || '0');
        return width > 10 && height > 10 && height < 80;
      });

      return {
        totalRects: allRects.length,
        potentialBars: barRects.length,
        hasBarChart: barRects.length >= 4
      };
    });

    results.push({
      step: 'PolypRiskChart Check',
      status: polypChartElements.hasBarChart ? 'pass' : 'warning',
      message: `Found ${polypChartElements.potentialBars} potential bar elements`,
      screenshot: polypRiskScreenshot,
      details: polypChartElements
    });

    // 6. Check SizeRiskChart
    console.log('6. Checking SizeRiskChart...');
    await page.evaluate(() => window.scrollTo({ top: 5800, behavior: 'smooth' }));
    await page.waitForTimeout(2500);

    const sizeRiskScreenshot = path.join(SCREENSHOT_DIR, '05-size-risk-chart.png');
    await page.screenshot({ path: sizeRiskScreenshot, fullPage: false });

    const sizeChartElements = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      let hasVerticalBars = false;
      let hasGradients = false;

      svgs.forEach(svg => {
        const rects = svg.querySelectorAll('rect');
        rects.forEach(r => {
          const height = parseFloat(r.getAttribute('height') || '0');
          const width = parseFloat(r.getAttribute('width') || '0');
          if (height > 50 && width > 30 && width < 150) {
            hasVerticalBars = true;
          }
        });

        if (svg.querySelector('linearGradient')) {
          hasGradients = true;
        }
      });

      return { hasVerticalBars, hasGradients };
    });

    results.push({
      step: 'SizeRiskChart Check',
      status: sizeChartElements.hasVerticalBars ? 'pass' : 'warning',
      message: `Vertical bars: ${sizeChartElements.hasVerticalBars}, Gradients: ${sizeChartElements.hasGradients}`,
      screenshot: sizeRiskScreenshot,
      details: sizeChartElements
    });

    // 7. Check TimelineRiskChart
    console.log('7. Checking TimelineRiskChart...');
    await page.evaluate(() => window.scrollTo({ top: 7400, behavior: 'smooth' }));
    await page.waitForTimeout(2500);

    const timelineRiskScreenshot = path.join(SCREENSHOT_DIR, '06-timeline-risk-chart.png');
    await page.screenshot({ path: timelineRiskScreenshot, fullPage: false });

    const timelineChartElements = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      let hasLinePath = false;
      let hasAreaPath = false;
      let hasDataPoints = false;

      svgs.forEach(svg => {
        const paths = svg.querySelectorAll('path');
        paths.forEach(p => {
          const fill = p.getAttribute('fill');
          const stroke = p.getAttribute('stroke');
          if (fill && fill.includes('url(#')) hasAreaPath = true;
          if (stroke && stroke !== 'none') hasLinePath = true;
        });

        const circles = svg.querySelectorAll('circle');
        if (circles.length >= 3) hasDataPoints = true;
      });

      return { hasLinePath, hasAreaPath, hasDataPoints };
    });

    results.push({
      step: 'TimelineRiskChart Check',
      status: timelineChartElements.hasLinePath ? 'pass' : 'warning',
      message: `Line path: ${timelineChartElements.hasLinePath}, Area fill: ${timelineChartElements.hasAreaPath}, Data points: ${timelineChartElements.hasDataPoints}`,
      screenshot: timelineRiskScreenshot,
      details: timelineChartElements
    });

    // 8. Design Evaluation
    console.log('8. Performing design evaluation...');

    // Capture insights section
    await page.evaluate(() => window.scrollTo({ top: 10000, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    const insightsScreenshot = path.join(SCREENSHOT_DIR, '07-insights-section.png');
    await page.screenshot({ path: insightsScreenshot, fullPage: false });

    // Capture footer CTA
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight - 800, behavior: 'smooth' }));
    await page.waitForTimeout(1000);

    const footerScreenshot = path.join(SCREENSHOT_DIR, '08-footer-cta.png');
    await page.screenshot({ path: footerScreenshot, fullPage: false });

    // Full page screenshot
    const fullPageScreenshot = path.join(SCREENSHOT_DIR, '09-full-page.png');
    await page.screenshot({ path: fullPageScreenshot, fullPage: true });

    // Design analysis
    const designAnalysis = await page.evaluate(() => {
      const body = document.body;
      const computedStyles = window.getComputedStyle(body);

      // Check color consistency
      const colors = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.color && style.color !== 'rgba(0, 0, 0, 0)') {
          colors.add(style.color);
        }
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(style.backgroundColor);
        }
      });

      // Check spacing consistency
      const margins = new Set<string>();
      const paddings = new Set<string>();
      document.querySelectorAll('section, div.p-4, div.p-6, div.p-8').forEach(el => {
        const style = window.getComputedStyle(el);
        margins.add(style.marginTop);
        margins.add(style.marginBottom);
        paddings.add(style.paddingTop);
        paddings.add(style.paddingBottom);
      });

      // Check responsive elements
      const responsiveClasses = document.querySelectorAll('[class*="md:"], [class*="lg:"]');

      // Check animation elements
      const motionElements = document.querySelectorAll('[style*="transform"], [style*="opacity"]');

      return {
        uniqueColors: colors.size,
        spacingVariants: margins.size + paddings.size,
        responsiveElements: responsiveClasses.length,
        animatedElements: motionElements.length,
        hasScrollIndicator: !!document.querySelector('[class*="animate-"]'),
        hasShadows: document.querySelectorAll('[class*="shadow"]').length
      };
    });

    results.push({
      step: 'Design Evaluation',
      status: 'pass',
      message: 'Design analysis completed',
      screenshot: fullPageScreenshot,
      details: designAnalysis
    });

    // Mobile view test
    console.log('9. Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1000);

    const mobileHeroScreenshot = path.join(SCREENSHOT_DIR, '10-mobile-hero.png');
    await page.screenshot({ path: mobileHeroScreenshot, fullPage: false });

    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'smooth' }));
    await page.waitForTimeout(1500);

    const mobileContentScreenshot = path.join(SCREENSHOT_DIR, '11-mobile-content.png');
    await page.screenshot({ path: mobileContentScreenshot, fullPage: false });

    results.push({
      step: 'Mobile Responsiveness',
      status: 'pass',
      message: 'Mobile view captured successfully',
      screenshot: mobileHeroScreenshot
    });

  } catch (error: any) {
    results.push({
      step: 'Test Execution Error',
      status: 'fail',
      message: error.message
    });
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n========================================');
  console.log('         TEST RESULTS SUMMARY          ');
  console.log('========================================\n');

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  results.forEach((result, index) => {
    const statusIcon = result.status === 'pass' ? '[PASS]' : result.status === 'fail' ? '[FAIL]' : '[WARN]';
    console.log(`${index + 1}. ${statusIcon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.screenshot) {
      console.log(`   Screenshot: ${result.screenshot}`);
    }
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
    }
    console.log('');

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else warningCount++;
  });

  console.log('========================================');
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passCount} | Failed: ${failCount} | Warnings: ${warningCount}`);
  console.log('========================================\n');

  // Save results to JSON
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ results, summary: { passCount, failCount, warningCount } }, null, 2));
  console.log(`Report saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  return results;
}

runPlaywrightTest().catch(console.error);
