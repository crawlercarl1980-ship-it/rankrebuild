/**
 * Deploy to Vercel via API
 * Uses Vercel's deployment API to deploy from GitHub
 * Requires env vars: GITHUB_TOKEN, VERCEL_TOKEN
 */

const githubToken = process.env.GITHUB_TOKEN;
const vercelToken = process.env.VERCEL_TOKEN;

if (!vercelToken) {
  console.error('VERCEL_TOKEN env var required');
  process.exit(1);
}

const vercelAuthRes = await fetch('https://api.vercel.com/v2/user', {
  headers: {
    Authorization: `Bearer ${vercelToken}`
  }
});

console.log('Vercel auth status:', vercelAuthRes.status);
const vercelUser = await vercelAuthRes.json();
console.log('Vercel response:', JSON.stringify(vercelUser).substring(0, 200));
