import https from 'https';
import http from 'http';

// Promisified http/https request that won't crash the server on ECONNRESET
export function wpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  } = {}
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const isLocal = parsed.hostname.endsWith('.local') || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

    const reqOptions: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 15000,
      ...(isHttps && isLocal ? { rejectUnauthorized: false } : {}),
      // Disable keep-alive to prevent ECONNRESET from connection reuse
      agent: false as unknown as http.Agent,
    };

    const transport = isHttps ? https : http;

    const req = transport.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
      res.on('error', (e) => {
        reject(new Error(`WordPress response error: ${e.message}`));
      });
      res.on('aborted', () => {
        reject(new Error('WordPress response aborted'));
      });
    });

    req.on('error', (e) => {
      // Catch ECONNRESET and other network errors here so they don't escape
      reject(new Error(`WordPress request failed: ${e.message}`));
    });

    req.on('close', () => {
      // Normal close - ignore
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('WordPress request timed out'));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}
