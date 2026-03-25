import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let attempts = 0;

function start() {
  attempts++;
  console.log(`[keep-alive] Starting RankRebuild server... (attempt ${attempts})`);

  const proc = spawn('npm', ['run', 'start'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('exit', (code) => {
    console.log(`[keep-alive] Server exited (code ${code}). Restarting in 2s...`);
    setTimeout(start, 2000);
  });

  proc.on('error', (err) => {
    console.error('[keep-alive] Spawn error:', err);
    setTimeout(start, 2000);
  });
}

start();
