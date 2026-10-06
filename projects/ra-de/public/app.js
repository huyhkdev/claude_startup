import { parseExam } from '/src/parse.js';

const $ = (id) => document.getElementById(id);
const FIELDS = ['school', 'title', 'subject', 'minutes', 'versions', 'start'];
const TYPE_LABEL = { mcq: 'trắc nghiệm', truefalse: 'đúng/sai', short: 'trả lời ngắn', essay: 'tự luận' };

// Ghi nhớ đề đang soạn và thông tin trường trên máy giáo viên
function remember(key, value) {
  try { localStorage.setItem(`rade:${key}`, value); } catch { /* bộ nhớ bị chặn */ }
}
function recall(key) {
  try { return localStorage.getItem(`rade:${key}`); } catch { return null; }
}
for (const id of ['exam', ...FIELDS]) {
  const saved = recall(id);
  if (saved !== null) $(id).value = saved;
  $(id).addEventListener('input', () => remember(id, $(id).value));
}

function check() {
  const text = $('exam').value;
  if (!text.trim()) {
    $('check').innerHTML = '';
    return null;
  }
  const exam = parseExam(text);
  const summary = exam.parts.map((p) => `Phần ${p.number}: ${p.questions.length} câu ${TYPE_LABEL[p.type]}`).join(' · ');
  const box = $('check');
  box.replaceChildren();
  const head = document.createElement('div');
  head.className = exam.errors.length ? '' : 'ok';
  head.textContent = exam.parts.length ? `${exam.errors.length ? '' : '✓ '}${summary}` : 'Chưa nhận ra câu hỏi nào. Mỗi câu cần bắt đầu bằng "Câu 1."';
  box.append(head);
  if (exam.errors.length) {
    const ul = document.createElement('ul');
    for (const e of exam.errors) ul.append(Object.assign(document.createElement('li'), { textContent: e }));
    box.append(ul);
  }
  return exam;
}
$('exam').addEventListener('input', check);
check();

$('load-sample').addEventListener('click', async () => {
  $('exam').value = await (await fetch('/data/de-mau.txt')).text();
  remember('exam', $('exam').value);
  check();
});

$('download').addEventListener('click', async () => {
  const exam = check();
  if (!exam || exam.errors.length || !exam.parts.length) {
    $('dl-status').textContent = 'Hãy sửa các lỗi ở bước 1 trước.';
    return;
  }
  $('download').disabled = true;
  $('dl-status').textContent = 'Đang trộn đề...';
  try {
    const meta = { school: $('school').value, title: $('title').value, subject: $('subject').value, minutes: $('minutes').value };
    const res = await fetch('/api/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: $('exam').value, versions: $('versions').value, startCode: $('start').value, meta }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement('a'), { href: url, download: `de-${$('versions').value}-ma.docx` }).click();
    URL.revokeObjectURL(url);
    $('dl-status').textContent = 'Đã tải xong. Mở bằng Word để in.';
  } catch (err) {
    $('dl-status').textContent = `Lỗi: ${err.message}`;
  } finally {
    $('download').disabled = false;
  }
});

// Phần AI chỉ hiện khi máy chủ có bật
fetch('/api/health').then((r) => r.json()).then(({ ai }) => { $('ai-card').hidden = !ai; }).catch(() => {});

$('ai-go').addEventListener('click', async () => {
  $('ai-go').disabled = true;
  $('ai-status').textContent = 'AI đang soạn đề, có thể mất 1–2 phút...';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: $('ai-subject').value,
        grade: $('ai-grade').value,
        topic: $('ai-topic').value,
        material: $('ai-material').value,
        counts: { mcq: Number($('ai-mcq').value), truefalse: Number($('ai-tf').value), short: Number($('ai-short').value) },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    $('exam').value = data.text;
    remember('exam', data.text);
    check();
    $('ai-status').textContent = 'Xong. Thầy cô hãy đọc lại và sửa ở bước 1 trước khi tải.';
  } catch (err) {
    $('ai-status').textContent = `Lỗi: ${err.message}`;
  } finally {
    $('ai-go').disabled = false;
  }
});
