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
  console.log(`Screenshot: ${name}.png`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  let apiKey = null;

  try {
    // Step 1: Try login first
    console.log('--- Step 1: Attempting login ---');
    await page.goto('https://app.instawp.io/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '01-login-page');

    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await screenshot(page, '02-login-filled');

    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(3000);
    await screenshot(page, '03-after-login');

    let loggedIn = !page.url().includes('/login') && !page.url().includes('/register');
    console.log('URL after login:', page.url(), '| Logged in:', loggedIn);

    // Step 2: If login failed, register
    if (!loggedIn) {
      console.log('--- Step 2: Login failed, attempting registration ---');
      await page.goto('https://app.instawp.io/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      await screenshot(page, '04-register-page');

      // InstaWP register form fields - use type() to trigger Vue.js reactivity
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) { await nameInput.click(); await nameInput.fill(''); await nameInput.type('Carl'); }

      // Fill email
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) { await emailInput.click(); await emailInput.fill(''); await emailInput.type(EMAIL); }

      // Fill password fields - get all password inputs
      const passwordInputs = await page.$$('input[type="password"]');
      console.log(`Found ${passwordInputs.length} password input(s)`);
      for (const pwInput of passwordInputs) {
        await pwInput.click();
        await pwInput.fill('');
        await pwInput.type(PASSWORD);
        await page.waitForTimeout(300);
      }

      // Check for CAPTCHA before submitting
      const hasCaptcha = await page.isVisible('iframe[src*="recaptcha"], .g-recaptcha, iframe[src*="hcaptcha"]').catch(() => false);
      if (hasCaptcha) {
        await screenshot(page, '05-captcha-detected');
        console.log('CAPTCHA DETECTED on registration form - manual intervention required');
        await browser.close();
        process.exit(2);
      }

      // Accept Terms of Service checkbox (required to enable the submit button)
      const tosCheckbox = await page.$('input[type="checkbox"]');
      if (tosCheckbox) {
        const isChecked = await tosCheckbox.isChecked();
        if (!isChecked) {
          await tosCheckbox.click();
          console.log('Checked Terms of Service checkbox');
          await page.waitForTimeout(500);
        }
      }

      await screenshot(page, '05-register-filled');
      await page.waitForTimeout(500);
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ]);
      await page.waitForTimeout(4000);
      await screenshot(page, '06-after-register');
      console.log('URL after register:', page.url());

      // Check for email verification requirement
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.toLowerCase().includes('verify your email') || bodyText.toLowerCase().includes('check your email') || bodyText.toLowerCase().includes('confirmation')) {
        await screenshot(page, '07-email-verify');
        console.log('EMAIL VERIFICATION REQUIRED - check inbox for ' + EMAIL);
        await browser.close();
        process.exit(3);
      }

      loggedIn = !page.url().includes('/login') && !page.url().includes('/register');
      console.log('Logged in after register:', loggedIn);
    }

    if (!loggedIn) {
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
      console.log('Still not logged in. Page content:', bodyText);
      await screenshot(page, '07-not-logged-in');
      await browser.close();
      process.exit(4);
    }

    // Step 3: Navigate to API tokens
    console.log('--- Step 3: Finding API tokens page ---');
    await screenshot(page, '08-dashboard');
    console.log('Dashboard URL:', page.url());

    const apiPaths = [
      'https://app.instawp.io/user/api-tokens',
      'https://app.instawp.io/settings/api-tokens',
      'https://app.instawp.io/profile/api-tokens',
      'https://app.instawp.io/api-tokens',
      'https://app.instawp.io/settings',
      'https://app.instawp.io/profile',
    ];

    let onApiPage = false;
    for (const apiPath of apiPaths) {
      await page.goto(apiPath, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const url = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
      const hasTokenContent = bodyText.includes('api token') || bodyText.includes('api key') || bodyText.includes('personal access') || bodyText.includes('create new token');
      console.log(`  ${apiPath} -> ${url} | hasTokenContent: ${hasTokenContent}`);
      if (!url.includes('/login') && hasTokenContent) {
        console.log('Found API tokens page:', url);
        onApiPage = true;
        await screenshot(page, '09-api-tokens-page');
        break;
      }
    }

    if (!onApiPage) {
      // Scan all nav links
      console.log('Direct paths failed. Scanning navigation...');
      await page.goto('https://app.instawp.io/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await screenshot(page, '09-dashboard-scan');

      const links = await page.$$eval('a', els => els.map(a => ({ href: a.href, text: a.textContent?.trim() })));
      console.log('All navigation links:');
      links.forEach(l => console.log(' ', l.text?.substring(0, 40), '->', l.href));

      // Try to find settings/API link
      const apiLink = links.find(l =>
        l.href && (l.href.includes('token') || l.href.includes('api-key') || l.text?.toLowerCase().includes('api') || l.text?.toLowerCase().includes('token'))
      );
      if (apiLink) {
        console.log('Found potential API link:', apiLink);
        await page.goto(apiLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '10-api-page-via-nav');
        onApiPage = true;
      }
    }

    if (!onApiPage) {
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
      console.log('Could not find API tokens page. Current page:', page.url());
      console.log('Page text:', bodyText);
      await screenshot(page, 'error-no-api-page');
      await browser.close();
      process.exit(5);
    }

    // Step 4: Create a new API token named 'RankRebuild'
    console.log('--- Step 4: Creating API token ---');

    // Look for existing 'RankRebuild' token first
    const existingToken = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('RankRebuild');
    });

    if (existingToken) {
      console.log('RankRebuild token already exists, checking if we can get the value...');
    }

    // Find create/add token button
    const createBtnSelectors = [
      'button:has-text("Create New Token")',
      'button:has-text("Create token")',
      'button:has-text("Generate")',
      'button:has-text("New Token")',
      'button:has-text("Add")',
      'a:has-text("Create")',
      '[data-action*="create"]',
      'button.btn-primary',
    ];

    let createBtn = null;
    for (const sel of createBtnSelectors) {
      createBtn = await page.$(sel);
      if (createBtn) {
        console.log('Found create button with selector:', sel);
        break;
      }
    }

    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '11-create-clicked');

      // Fill token name
      const nameInput = await page.$('input[placeholder*="token" i], input[placeholder*="name" i], input[name*="name" i], input[id*="name" i]');
      if (nameInput) {
        await nameInput.fill('RankRebuild');
        console.log('Filled token name: RankRebuild');
        await screenshot(page, '12-name-filled');
      }

      // Submit
      const submitSelectors = ['button[type="submit"]', 'button:has-text("Create")', 'button:has-text("Generate")', 'button:has-text("Add Token")'];
      let submitBtn = null;
      for (const sel of submitSelectors) {
        submitBtn = await page.$(sel);
        if (submitBtn) break;
      }
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, '13-token-created');
        console.log('Token creation submitted');
      }
    } else {
      console.log('No create button found. Checking page for existing tokens or different UI...');
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
      console.log('Page content:', bodyText);
    }

    // Step 5: Extract the API key
    console.log('--- Step 5: Extracting API key ---');
    await screenshot(page, '14-extract-key');

    // Check for modal with token
    await page.waitForTimeout(1000);
    const modalVisible = await page.isVisible('.modal, [role="dialog"], [class*="modal"]').catch(() => false);
    if (modalVisible) {
      await screenshot(page, '14b-modal');
      console.log('Modal detected - checking for token inside');
    }

    // Try various ways to find the token value
    const tokenSelectors = [
      'input[readonly]',
      'input[disabled]',
      'input[type="text"][value]',
      'code',
      'pre',
      '.token-value',
      '[class*="token-value"]',
      '[class*="api-key"]',
      '[class*="apiKey"]',
    ];

    for (const sel of tokenSelectors) {
      const els = await page.$$(sel);
      for (const el of els) {
        let value = '';
        try { value = await el.getAttribute('value') || ''; } catch (e) {}
        if (!value) { try { value = await el.textContent() || ''; } catch (e) {} }
        value = value.trim();
        // A token is typically 32+ chars, no spaces, alphanumeric + possibly dashes/underscores
        if (value.length >= 20 && value.length < 500 && !/\s/.test(value)) {
          console.log(`Potential token found (${sel}):`, value.substring(0, 8) + '...' + ' (length: ' + value.length + ')');
          if (!apiKey) apiKey = value;
        }
      }
    }

    // Also check page source for token patterns
    if (!apiKey) {
      const pageText = await page.evaluate(() => document.body.innerText);
      const matches = pageText.match(/[0-9a-zA-Z]{40,}/g);
      if (matches) {
        console.log('Possible tokens in page text:', matches.map(m => m.substring(0, 8) + '...'));
        apiKey = matches[0];
      }
    }

    if (apiKey) {
      console.log('\n=== API KEY FOUND ===');
      console.log('Key (masked):', apiKey.substring(0, 8) + '...');
      fs.writeFileSync(path.join(__dirname, 'instawp-api-key.txt'), apiKey);
      console.log('Full key saved to scripts/instawp-api-key.txt');
    } else {
      console.log('\nAPI key NOT found automatically.');
      const finalText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
      console.log('Final page text:', finalText);
    }

  } catch (err) {
    console.error('Error:', err.message);
    await screenshot(page, 'error-state').catch(() => {});
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
