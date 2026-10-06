// Server tối giản: giao diện web, xuất file Word và tạo câu hỏi bằng AI.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExam } from './src/parse.js';
import { mixExam, versionCodes } from './src/mix.js';
import { buildDocx } from './src/docx.js';
import { aiAvailable, generateExam, toText } from './src/ai.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const MAX_BODY = 400_000;
const MAX_VERSIONS = 24;

function send(res, status, body, type = 'application/json', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...extra });
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

async function handleDocx(req, res) {
  const { text = '', versions = 4, startCode = 101, meta = {} } = await readBody(req);
  const exam = parseExam(text);
  if (exam.parts.length === 0) return send(res, 400, { error: 'Không tìm thấy câu hỏi nào' });
  if (exam.errors.length) return send(res, 400, { error: 'Đề còn lỗi', errors: exam.errors });
  const n = Math.min(Math.max(1, Number(versions) || 1), MAX_VERSIONS);
  const buf = await buildDocx(mixExam(exam, versionCodes(n, Number(startCode) || 101)), meta);
  send(res, 200, buf, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
    'Content-Disposition': 'attachment; filename="de-tron.docx"',
  });
}

async function handleGenerate(req, res) {
  if (!aiAvailable()) return send(res, 503, { error: 'Chưa bật AI trên máy chủ' });
  const body = await readBody(req);
  if (!body.subject || !body.topic) return send(res, 400, { error: 'Cần nhập môn học và nội dung kiểm tra' });
  const exam = await generateExam(body);
  send(res, 200, { text: toText(exam) });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let path = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!path.startsWith('/src/') && !path.startsWith('/data/')) path = `/public${path}`;
  const file = normalize(join(ROOT, path));
  // Trình duyệt chỉ cần parse.js và mix.js; các file khác trong src/ chạy ở máy chủ.
  const allowed = file.startsWith(join(ROOT, 'public')) || file.startsWith(join(ROOT, 'data'))
    || [join(ROOT, 'src/parse.js'), join(ROOT, 'src/mix.js')].includes(file);
  if (!allowed) return send(res, 404, 'Not found', 'text/plain');
  try {
    send(res, 200, await readFile(file), MIME[extname(file)] ?? 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

export const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/docx') return await handleDocx(req, res);
    if (req.method === 'POST' && req.url === '/api/generate') return await handleGenerate(req, res);
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, ai: aiAvailable() });
    if (req.method === 'GET') return await serveStatic(req, res);
    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    send(res, err.status ?? 500, { error: err.status ? err.message : 'Có lỗi xảy ra, vui lòng thử lại' });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`Ra Đề đang chạy tại http://localhost:${PORT} (AI: ${aiAvailable() ? 'bật' : 'tắt'})`));
}
