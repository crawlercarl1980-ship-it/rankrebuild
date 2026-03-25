const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = 'crawler.carl1980@gmail.com';
const PASSWORD = '!Ibckeg1';
const SCREENSHOT_DIR = path.join(__dirname, 'instawp-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${name}.png`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  let apiKey = null;

  try {
    // ── Login ──────────────────────────────────────────────────────────────────
    console.log('Navigating to login...');
    await page.goto('https://app.instawp.io/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);

    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(3000);
    await screenshot(page, 'key-01-dashboard');

    const postLoginUrl = page.url();
    console.log('URL after login:', postLoginUrl);

    if (postLoginUrl.includes('/login')) {
      console.error('Login failed - still on login page');
      await browser.close();
      process.exit(1);
    }

    // ── Find API tokens page ───────────────────────────────────────────────────
    console.log('Looking for API tokens page...');
    const candidatePaths = [
      'https://app.instawp.io/user/api-tokens',
      'https://app.instawp.io/settings/api-tokens',
      'https://app.instawp.io/profile/api-tokens',
      'https://app.instawp.io/api-tokens',
      'https://app.instawp.io/settings',
      'https://app.instawp.io/profile',
    ];

    let onApiPage = false;
    for (const p of candidatePaths) {
      await page.goto(p, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      if (page.url().includes('/login')) continue;
      const body = await page.evaluate(() => document.body.innerText.toLowerCase());
      if (body.includes('api token') || body.includes('api key') || body.includes('personal access') || body.includes('create new token')) {
        console.log('Found API tokens page:', page.url());
        onApiPage = true;
        break;
      }
    }

    // Fallback: scan nav links
    if (!onApiPage) {
      await page.goto('https://app.instawp.io/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const links = await page.$$eval('a', els => els.map(a => ({ href: a.href, text: a.textContent?.trim() })));
      const apiLink = links.find(l =>
        l.href && (l.href.includes('token') || l.href.includes('api-key') ||
          (l.text && (l.text.toLowerCase().includes('api') || l.text.toLowerCase().includes('token'))))
      );
      if (apiLink) {
        await page.goto(apiLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        onApiPage = true;
        console.log('Found API page via nav link:', apiLink.href);
      }
    }

    if (!onApiPage) {
      console.error('Could not find API tokens page');
      await screenshot(page, 'key-02-api-page');
      await browser.close();
      process.exit(1);
    }

    await screenshot(page, 'key-02-api-page');

    // ── Dismiss any credit-card / promo modal ─────────────────────────────────
    const dismissBtn = await page.$('button:has-text("Dismiss"), button:has-text("Close"), button:has-text("Skip")');
    if (dismissBtn) {
      console.log('Dismissing modal...');
      await dismissBtn.click();
      await page.waitForTimeout(1000);
    }

    // ── Create token named RankRebuild ────────────────────────────────────────
    console.log('Creating API token "RankRebuild"...');

    // Be specific: prefer "Add New" over bare "Add" to avoid the credit-card modal
    const createBtnSelectors = [
      'button:has-text("Add New")',
      'button:has-text("Create New Token")',
      'button:has-text("Create token")',
      'button:has-text("Generate")',
      'button:has-text("New Token")',
      'button:has-text("Add Token")',
      'a:has-text("Create")',
    ];

    let createBtn = null;
    for (const sel of createBtnSelectors) {
      createBtn = await page.$(sel);
      if (createBtn) { console.log('Create button found:', sel); break; }
    }

    // Last resort: find the button near the "API Token" heading
    if (!createBtn) {
      createBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent?.trim() === 'Add New') || null;
      }).catch(() => null);
      if (createBtn) console.log('Found Add New via evaluate');
    }

    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);

      // Fill token name
      const nameInput = await page.$('input[placeholder*="token" i], input[placeholder*="name" i], input[name*="name" i], input[id*="name" i], input[type="text"]');
      if (nameInput) {
        await nameInput.fill('');
        await nameInput.type('RankRebuild');
        console.log('Filled token name');
      }

      // Submit
      for (const sel of ['button[type="submit"]', 'button:has-text("Create")', 'button:has-text("Generate")', 'button:has-text("Add")']) {
        const btn = await page.$(sel);
        if (btn) { await btn.click(); break; }
      }
      await page.waitForTimeout(3000);
    } else {
      console.log('No create button found - checking for existing tokens...');
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Page content:', bodyText);
    }

    // ── Extract token value ────────────────────────────────────────────────────
    console.log('Extracting token value...');

    // Wait for modal to appear with the token
    await page.waitForTimeout(2000);
    await screenshot(page, 'key-03-token');

    // Try to get value from all inputs on the page (including inside dialog)
    apiKey = await page.evaluate(() => {
      // Check all inputs for a long token-like value
      const inputs = Array.from(document.querySelectorAll('input'));
      for (const inp of inputs) {
        const val = inp.value || inp.getAttribute('value') || '';
        if (val.length >= 20 && val.length < 500 && !/\s/.test(val)) return val;
      }
      // Check code/pre elements
      const codeEls = Array.from(document.querySelectorAll('code, pre, [class*="token"], [class*="api-key"]'));
      for (const el of codeEls) {
        const txt = el.textContent?.trim() || '';
        if (txt.length >= 20 && txt.length < 500 && !/\s/.test(txt)) return txt;
      }
      // Check paragraph text inside a dialog
      const dialog = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
      if (dialog) {
        const text = dialog.innerText || '';
        const match = text.match(/[0-9a-zA-Z]{40,}/);
        if (match) return match[0];
      }
      return null;
    });

    if (!apiKey) {
      // Last resort: scan all page text for token pattern
      const pageSource = await page.evaluate(() => document.documentElement.innerHTML);
      const matches = pageSource.match(/"value"\s*:\s*"([0-9a-zA-Z]{40,})"/);
      if (matches) {
        apiKey = matches[1];
        console.log('Token found in page source');
      }
    }

    if (!apiKey) {
      const pageText = await page.evaluate(() => document.body.innerText);
      const matches = pageText.match(/[0-9a-zA-Z]{40,}/g);
      if (matches) {
        console.log('Token candidates in page text:', matches.slice(0, 3).map(m => m.substring(0, 8) + '...'));
        apiKey = matches[0];
      }
    }

    if (apiKey) {
      console.log('\n=== API KEY CAPTURED ===');
      console.log('Masked:', apiKey.substring(0, 8) + '...');
      fs.writeFileSync(path.join(__dirname, 'instawp-api-key.txt'), apiKey.trim());
      console.log('Written to scripts/instawp-api-key.txt');
    } else {
      const finalText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
      console.log('Could not find token. Final page text:\n', finalText);
      await browser.close();
      process.exit(1);
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
    await screenshot(page, 'key-error').catch(() => {});
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  return apiKey;
}

run().then(key => {
  process.exit(key ? 0 : 1);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
