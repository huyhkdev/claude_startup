// Server tối giản: phục vụ giao diện web và API phân tích câu ghi sổ.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseText } from './src/parser.js';
import { aiAvailable, parseWithAI } from './src/ai.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const MAX_BODY = 20_000;

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > MAX_BODY) throw Object.assign(new Error('Nội dung quá dài'), { status: 413 });
  }
  return JSON.parse(data || '{}');
}

async function handleParse(req, res) {
  const { text = '' } = await readBody(req);
  if (aiAvailable()) {
    try {
      return send(res, 200, { engine: 'ai', transactions: await parseWithAI(text) });
    } catch (err) {
      console.warn('AI lỗi, chuyển sang bộ phân tích luật:', err.message);
    }
  }
  send(res, 200, { engine: 'rule', transactions: parseText(text) });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let path = url.pathname === '/' ? '/public/index.html' : url.pathname;
  if (!path.startsWith('/src/')) path = path.startsWith('/public/') ? path : `/public${path}`;
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT) || file.includes('node_modules')) return send(res, 404, 'Not found', 'text/plain');
  try {
    send(res, 200, await readFile(file), MIME[extname(file)] ?? 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

export const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/parse') return await handleParse(req, res);
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, ai: aiAvailable() });
    if (req.method === 'GET') return await serveStatic(req, res);
    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    send(res, err.status ?? 400, { error: err.message });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`Sổ Sạch đang chạy tại http://localhost:${PORT} (AI: ${aiAvailable() ? 'bật' : 'tắt'})`));
}
