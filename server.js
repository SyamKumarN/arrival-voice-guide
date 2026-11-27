// server.js — one small Node server (no framework), used by Docker and `npm start`.
//  - serves the app from ./public
//  - /api/* is handled by lib/core.js (the same code the hosted version uses):
//      GET  /api/config  -> which optional upgrades have keys (true/false only)
//      GET  /api/rates   -> live rates from a free no-key source, else the bundled sample
//      POST /api/tts     -> natural voice (only if SARVAM_API_KEY is set)
//      POST /api/understand -> AI fills in the fixed form when the rules don't understand (only if AI_API_KEY is set)
// Starts and works fully with no keys at all.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');

// Read .env when running without Docker (Docker passes it in via env_file).
// Must run before lib/core.js reads the environment, hence the dynamic import.
loadDotEnv(path.join(here, '.env'));
const { handleApi, config, API_HEADERS } = await import('./lib/core.js');

const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const PAGE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'microphone=(self)',
  'Cache-Control': 'no-cache',
};

async function readBody(req, limit = 8 * 1024) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403, PAGE_HEADERS); return res.end('Forbidden'); }
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    res.writeHead(200, { ...PAGE_HEADERS, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { ...PAGE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname.startsWith('/api/')) {
    const { status, body } = await handleApi(pathname, req.method, () => readBody(req), { ip: req.socket.remoteAddress });
    res.writeHead(status, API_HEADERS);
    return res.end(JSON.stringify(body));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, PAGE_HEADERS); return res.end('Method not allowed'); }
  return serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  const c = config();
  console.log(`Arrival Guide (Voice) running on http://localhost:${PORT}`);
  console.log(`Natural voice: ${c.naturalVoice ? 'on' : 'key not set'} | AI understanding: ${c.aiUnderstanding ? 'on' : 'key not set'}`);
});

// Minimal .env reader: KEY=value lines, # comments. Real env vars win.
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const val = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
