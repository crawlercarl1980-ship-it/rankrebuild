const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = 'crawler.carl1980@gmail.com';
const PASSWORD = '!Ibckeg1';
const SCREENSHOT_DIR = path.join(__dirname, 'instawp-screenshots');

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot: ${name}.png`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('--- Opening Gmail ---');
    await page.goto('https://mail.google.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot(page, 'gmail-01-start');

    // Check if already logged in or need to log in
    const url = page.url();
    console.log('Gmail URL:', url);

    if (url.includes('accounts.google.com') || url.includes('/signin')) {
      console.log('Need to log into Google...');

      // Enter email
      await page.fill('input[type="email"]', EMAIL);
      await screenshot(page, 'gmail-02-email');
      await page.click('#identifierNext, button:has-text("Next")');
      await page.waitForTimeout(3000);
      await screenshot(page, 'gmail-03-after-email');

      // Enter password
      const pwInput = await page.$('input[type="password"]');
      if (pwInput) {
        await pwInput.fill(PASSWORD);
        await screenshot(page, 'gmail-04-password');
        await page.click('#passwordNext, button:has-text("Next")');
        await page.waitForTimeout(5000);
        await screenshot(page, 'gmail-05-after-password');
      }

      console.log('URL after login:', page.url());
    }

    // Wait for Gmail to load
    await page.waitForTimeout(3000);
    await screenshot(page, 'gmail-06-inbox');
    console.log('Gmail URL after load:', page.url());

    // Check for 2FA or account verification prompt
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    if (pageText.toLowerCase().includes('verify') && !page.url().includes('mail.google.com')) {
      console.log('Google account verification required - cannot proceed automatically');
      console.log('Page text:', pageText.substring(0, 500));
      await screenshot(page, 'gmail-verification-required');
      await browser.close();
      process.exit(2);
    }

    // Look for InstaWP email
    console.log('Searching for InstaWP verification email...');

    // Search for the email
    await page.waitForSelector('input[aria-label*="Search" i], input[name="q"]', { timeout: 15000 });
    await page.fill('input[aria-label*="Search" i], input[name="q"]', 'from:instawp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await screenshot(page, 'gmail-07-search-results');

    // Click on the InstaWP email
    const emailRows = await page.$$('[role="row"], tr.zA');
    console.log(`Found ${emailRows.length} email rows`);

    // Try to find and click InstaWP email
    let found = false;
    for (const row of emailRows) {
      const text = await row.textContent();
      if (text && (text.toLowerCase().includes('instawp') || text.toLowerCase().includes('verify') || text.toLowerCase().includes('email'))) {
        console.log('Found InstaWP email:', text.substring(0, 100));
        await row.click();
        await page.waitForTimeout(3000);
        found = true;
        break;
      }
    }

    if (!found && emailRows.length > 0) {
      // Click the first result
      await emailRows[0].click();
      await page.waitForTimeout(3000);
      found = true;
    }

    if (!found) {
      console.log('No InstaWP email found yet. Checking all recent emails...');
      await screenshot(page, 'gmail-08-no-email');
      await browser.close();
      process.exit(3);
    }

    await screenshot(page, 'gmail-08-email-open');
    console.log('Email opened, looking for verification link...');

    // Find the verification link
    const verifyLinks = await page.$$('a[href*="instawp"], a[href*="verify"], a[href*="email"]');
    console.log(`Found ${verifyLinks.length} potential verification links`);

    let verifyUrl = null;
    for (const link of verifyLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`Link: "${text?.trim()}" -> ${href}`);
      if (href && href.includes('instawp') && (href.includes('verify') || href.includes('email'))) {
        verifyUrl = href;
        break;
      }
    }

    if (!verifyUrl) {
      // Try to find any verification link
      const allLinks = await page.$$eval('a', els => els.map(a => ({ href: a.href, text: a.textContent?.trim() })));
      const instawpLinks = allLinks.filter(l => l.href && l.href.includes('instawp'));
      console.log('InstaWP links found:', instawpLinks);
      if (instawpLinks.length > 0) verifyUrl = instawpLinks[0].href;
    }

    if (verifyUrl) {
      console.log('Opening verification URL:', verifyUrl.substring(0, 80) + '...');
      await page.goto(verifyUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await screenshot(page, 'gmail-09-verified');
      console.log('Verification URL opened, final URL:', page.url());
    } else {
      console.log('Could not find verification link in email');
      const emailContent = await page.evaluate(() => document.body.innerText.substring(0, 3000));
      console.log('Email content:', emailContent);
      await screenshot(page, 'gmail-no-verify-link');
    }

  } catch (err) {
    console.error('Error:', err.message);
    await screenshot(page, 'gmail-error').catch(() => {});
  }

  await browser.close();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
