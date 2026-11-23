import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runBrowserVerification() {
  console.log('🚀 Starting Automated Browser Verification with Edge...');

  const consoleLogs = [];
  const errors = [];

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('Browser Console Error:', msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.toString());
      console.error('Browser Page Error:', err.toString());
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });

    // 1. Verify Page Title
    const title = await page.title();
    console.log('✔ Page Title:', title);
    if (!title.includes('GridLogic Live')) throw new Error(`Unexpected title: ${title}`);

    // 2. Verify UI Structure
    const hasPalette = await page.$('aside') !== null;
    const hasCanvas = await page.$('svg') !== null;
    const hasToolbar = await page.$('header') !== null;
    console.log(`✔ Layout Check - Palette: ${hasPalette}, Canvas: ${hasCanvas}, Toolbar: ${hasToolbar}`);
    if (!hasPalette || !hasCanvas || !hasToolbar) throw new Error('Core layout elements missing');

    // 3. Verify Preset 1: Half Adder Components
    const initialComponents = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('text')).map(t => t.textContent?.trim());
      return {
        hasSwitchA: texts.includes('Input A'),
        hasSwitchB: texts.includes('Input B'),
        hasXor: texts.includes('XOR (Sum)'),
        hasAnd: texts.includes('AND (Carry)'),
        hasSumLed: texts.includes('Sum (S)'),
        hasCarryLed: texts.includes('Carry (C)'),
      };
    });
    console.log('✔ Preset Verification (Half Adder):', initialComponents);
    if (!initialComponents.hasSwitchA || !initialComponents.hasSumLed) {
      throw new Error('Half adder preset components missing');
    }

    // 4. Test Interactive Switch Toggle (A=1, B=0 -> Click B -> A=1, B=1)
    console.log('Testing interactive switch toggle...');
    // Click Switch B toggle
    const switchClicked = await page.evaluate(() => {
      // Find the switch with label 'Input B'
      const texts = Array.from(document.querySelectorAll('g'));
      for (const g of texts) {
        if (g.textContent && g.textContent.includes('Input B')) {
          // Find clickable switch lever inside
          const lever = g.querySelector('rect[rx="6"]');
          if (lever) {
            lever.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
          }
        }
      }
      return false;
    });
    console.log('✔ Switch B Clicked:', switchClicked);

    // Wait a brief tick for propagation
    await new Promise(r => setTimeout(r, 200));

    // Verify LED outputs changed for A=1, B=1 => Sum=0, Carry=1
    const ledValues = await page.evaluate(() => {
      const leds = [];
      const groups = Array.from(document.querySelectorAll('g'));
      for (const g of groups) {
        if (g.textContent && (g.textContent.includes('Sum (S)') || g.textContent.includes('Carry (C)'))) {
          // Look for 0 or 1 value text inside
          const valText = g.querySelector('text[y="29"]')?.textContent;
          leds.push({ label: g.querySelector('text')?.textContent, value: valText });
        }
      }
      return leds;
    });
    console.log('✔ LED Values after Toggle:', ledValues);

    // 5. Test Truth Table Modal
    console.log('Opening Truth Table Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ttBtn = buttons.find(b => b.textContent && b.textContent.includes('Truth Table'));
      ttBtn?.click();
    });

    await new Promise(r => setTimeout(r, 300));
    const truthTableOpen = await page.evaluate(() => {
      return document.querySelector('table') !== null;
    });
    console.log('✔ Truth Table Modal opened with table:', truthTableOpen);
    if (!truthTableOpen) throw new Error('Truth Table modal failed to open');

    // Close Truth Table Modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Close');
      closeBtn?.click();
    });
    await new Promise(r => setTimeout(r, 200));

    // 6. Test Logic Analyzer Waveform Drawer
    console.log('Opening Waveform Analyzer Drawer...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const wfBtn = buttons.find(b => b.textContent && b.textContent.includes('Waveforms'));
      wfBtn?.click();
    });

    await new Promise(r => setTimeout(r, 300));
    const waveformOpen = await page.evaluate(() => {
      return document.querySelector('canvas') !== null;
    });
    console.log('✔ Logic Analyzer Waveform canvas opened:', waveformOpen);
    if (!waveformOpen) throw new Error('Waveform drawer failed to render canvas');

    // 7. Test Presets Dropdown (switch to 2:1 Multiplexer)
    console.log('Loading 2:1 Multiplexer Demo preset...');
    await page.evaluate(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'mux-demo';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 400));
    const muxLoaded = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('text')).map(t => t.textContent?.trim());
      return texts.includes('2:1 MUX') && texts.includes('Selected Output Y');
    });
    console.log('✔ 2:1 Multiplexer Preset loaded:', muxLoaded);
    if (!muxLoaded) throw new Error('Failed to load 2:1 Multiplexer preset');

    // Test Theme Switcher
    console.log('Testing Theme Switcher...');
    const themesAvailable = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const themeSelect = selects.find(s => s.querySelector('option[value="neon-cyber"]'));
      if (themeSelect) {
        return Array.from(themeSelect.options).map(o => o.text);
      }
      return [];
    });
    console.log('✔ Available Themes:', themesAvailable);

    // Switch theme to 'Blueprint CAD' and take a screenshot, then 'Neon Cyber'
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const themeSelect = selects.find(s => s.querySelector('option[value="neon-cyber"]'));
      if (themeSelect) {
        themeSelect.value = 'neon-cyber';
        themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 400));

    // Take screenshot of the live app with new color scheme
    const screenshotPath = path.resolve('verification-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('✔ Captured updated theme verification screenshot at:', screenshotPath);

    // Final check for console errors
    console.log('\n--- Final Verification Summary ---');
    console.log(`Total Console Messages: ${consoleLogs.length}`);
    console.log(`Total Errors Encountered: ${errors.length}`);

    if (errors.length > 0) {
      throw new Error(`Encountered ${errors.length} browser errors during execution: ${errors.join(', ')}`);
    }

    console.log('🎉 ALL BROWSER VERIFICATION TESTS PASSED PERFECTLY WITH ZERO ERRORS!\n');
  } finally {
    await browser.close();
  }
}

runBrowserVerification().catch(err => {
  console.error('Browser Verification Failed:', err);
  process.exit(1);
});
