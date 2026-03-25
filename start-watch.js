// Auto-restart wrapper — keeps the server alive even if it crashes
const { spawn } = require('child_process');
const path = require('path');

// Catch any errors in the watcher itself
process.on('uncaughtException', (err) => {
  console.error('[auto-restart] Watcher caught:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[auto-restart] Watcher rejection:', reason);
});

let restartCount = 0;

function startServer() {
  console.log(`[auto-restart] Starting RankRebuild server (restart #${restartCount})...`);
  
  const child = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'pipe',
    cwd: __dirname,
    detached: false,
  });
  
  // Pipe output to parent process
  if (child.stdout) child.stdout.pipe(process.stdout, { end: false });
  if (child.stderr) child.stderr.pipe(process.stderr, { end: false });

  child.on('exit', (code, signal) => {
    restartCount++;
    console.log(`[auto-restart] Server exited (code=${code}, signal=${signal}), restarting in 500ms...`);
    setTimeout(startServer, 500);
  });

  child.on('error', (err) => {
    restartCount++;
    console.error('[auto-restart] Spawn error:', err.message, '- restarting in 2s...');
    setTimeout(startServer, 2000);
  });
}

startServer();
