const { chromium } = require('playwright');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const urlModule = require('url');

const OUTPUT_DIR = 'C:\\Users\\carl\\Projects\\3dscuba-assets';
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function downloadFile(fileUrl, dest) {
  return new Promise((resolve) => {
    try {
      const parsed = urlModule.parse(fileUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(dest);
      const req = client.get(fileUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          downloadFile(res.headers.location, dest).then(resolve);
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      });
      req.on('error', () => resolve(false));
    } catch(e) { resolve(false); }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading 3dscuba.com...');
  await page.goto('https://3dscuba.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'homepage-full.png'), fullPage: true });

  const assets = await page.evaluate(() => {
    const imgs = [];
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        imgs.push({
          src: img.src,
          alt: img.alt || '',
          w: img.naturalWidth,
          h: img.naturalHeight,
          inHeader: !!img.closest('header, nav, .navbar, .header, .nav')
        });
      }
    });

    // Get CSS variables and main colors
    const bodyStyles = getComputedStyle(document.body);
    const primaryBtns = document.querySelectorAll('.btn-primary, .btn-warning, .btn-main');
    const btnColors = [];
    primaryBtns.forEach(b => {
      const s = getComputedStyle(b);
      btnColors.push({ bg: s.backgroundColor, color: s.color });
    });

    // Get nav background
    const nav = document.querySelector('nav, .navbar, header');
    const navBg = nav ? getComputedStyle(nav).backgroundColor : '';

    return { imgs, btnColors, navBg };
  });

  console.log('\n=== ALL IMAGES ===');
  assets.imgs.forEach(i => console.log((i.inHeader ? '[HEADER]' : ''), i.w + 'x' + i.h, i.alt, i.src));
  console.log('\nNav BG:', assets.navBg);
  console.log('Button colors:', JSON.stringify(assets.btnColors));

  // Download header/logo images
  const toDownload = assets.imgs.filter(i => i.inHeader || i.src.toLowerCase().includes('logo') || i.alt.toLowerCase().includes('logo'));
  console.log('\nDownloading logo candidates...');
  for (const img of toDownload) {
    const parsed = urlModule.parse(img.src);
    const filename = path.basename(parsed.pathname);
    const dest = path.join(OUTPUT_DIR, filename);
    const ok = await downloadFile(img.src, dest);
    console.log(ok ? 'OK' : 'FAIL', filename);
  }

  // Also download ALL images for reference
  console.log('\nDownloading all images...');
  for (const img of assets.imgs) {
    const parsed = urlModule.parse(img.src);
    const filename = path.basename(parsed.pathname);
    const dest = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(dest)) {
      const ok = await downloadFile(img.src, dest);
      if (ok) console.log('OK', filename);
    }
  }

  // Check courses page for more assets
  await page.goto('https://3dscuba.com/courses', { waitUntil: 'networkidle', timeout: 30000 });
  const courseAssets = await page.evaluate(() => {
    const imgs = [];
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        imgs.push({ src: img.src, alt: img.alt || '', w: img.naturalWidth, h: img.naturalHeight });
      }
    });
    return imgs;
  });

  for (const img of courseAssets) {
    const parsed = urlModule.parse(img.src);
    const filename = path.basename(parsed.pathname);
    const dest = path.join(OUTPUT_DIR, filename);
    if (!fs.existsSync(dest) && filename) {
      await downloadFile(img.src, dest);
    }
  }

  await browser.close();

  // Write asset manifest
  const manifest = { imgs: assets.imgs, navBg: assets.navBg, btnColors: assets.btnColors };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\nAll done. Assets in:', OUTPUT_DIR);
  console.log('Files:', fs.readdirSync(OUTPUT_DIR).join(', '));
})();
