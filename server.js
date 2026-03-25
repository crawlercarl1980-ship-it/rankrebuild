// Custom server wrapper that prevents crashes from propagating
// Sets up global error handlers BEFORE Next.js starts

process.on('unhandledRejection', (reason) => {
  console.error('[RankRebuild] Caught unhandled rejection:', reason?.message || reason);
  // Don't exit
});

process.on('uncaughtException', (error) => {
  console.error('[RankRebuild] Caught uncaught exception:', error.message);
  // Don't exit unless it's a port conflict
  if (error.code === 'EADDRINUSE') process.exit(1);
});

// Now start Next.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
