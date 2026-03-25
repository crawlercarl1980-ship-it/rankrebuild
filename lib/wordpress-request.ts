import https from 'https';
import http from 'http';

// Promisified http/https request with retry logic for ECONNRESET (LocalWP issue)
export async function wpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
    retries?: number;
  } = {}
): Promise<{ status: number; body: string }> {
  const maxRetries = options.retries ?? 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await wpRequestOnce(url, options);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED') || msg.includes('socket hang up');

      if (isRetryable && attempt < maxRetries) {
        // Wait 300ms before retrying
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  // Should never reach here
  throw new Error('wpRequest: exhausted retries');
}

function wpRequestOnce(
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
      res.on('error', (e) => reject(new Error(`WordPress response error: ${e.message}`)));
      res.on('aborted', () => reject(new Error('WordPress response aborted')));
    });

    req.on('error', (e) => reject(new Error(`WordPress request failed: ${e.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('WordPress request timed out'));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}
