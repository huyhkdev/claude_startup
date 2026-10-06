// Đọc đề thi dạng văn bản theo đúng cách giáo viên vẫn gõ trong Word:
//
//   PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn
//   Câu 1. Nội dung câu hỏi
//   A. ...   *B. ...   C. ...   D. ...       (dấu * trước đáp án đúng)
//   PHẦN II. Câu trắc nghiệm đúng sai
//   Câu 1. Đoạn dẫn
//   *a) Ý đúng
//   b) Ý sai
//   PHẦN III. Câu trắc nghiệm trả lời ngắn
//   Câu 1. Nội dung
//   Đáp án: 12,5
//
// Nếu không có tiêu đề PHẦN, câu có A–D là trắc nghiệm, câu có a)–d) là đúng/sai,
// câu có "Đáp án:" là trả lời ngắn, còn lại là tự luận.

const PART_RE = /^\s*PH[ẦA]N\s+(I{1,3}|IV|[1-4])\b[.:\s-]*(.*)$/i;
const QUESTION_RE = /^\s*C[âa]u\s+(\d+)\s*[.:)]?\s*(.*)$/i;
const OPTION_RE = /(?<=^|\s)(\*?)([A-D])\s*[.)]\s+/g;
const STATEMENT_RE = /^\s*(\*?)\s*([a-d])\s*[).]\s*(.*)$/;
const ANSWER_RE = /^\s*(?:Đáp án|Dap an|ĐA)\s*[:.]\s*(.+)$/i;

const PART_TYPES = { 1: 'mcq', 2: 'truefalse', 3: 'short', 4: 'essay' };
const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };

// Tách một dòng chứa nhiều phương án: "A. 1   B. 2   *C. 3   D. 4"
export function splitOptions(raw) {
  const line = raw.trim();
  const marks = [...line.matchAll(OPTION_RE)];
  if (marks.length === 0 || marks[0].index !== 0) return null;
  return marks.map((m, i) => ({
    letter: m[2],
    correct: m[1] === '*',
    text: line.slice(m.index + m[0].length, marks[i + 1]?.index ?? line.length).trim(),
  }));
}

export function parseExam(input) {
  const parts = [];
  let part = null;
  let q = null;
  const errors = [];

  const ensurePart = () => {
    if (!part) {
      part = { number: parts.length + 1, title: '', type: null, questions: [] };
      parts.push(part);
    }
    return part;
  };

  // Chữ Việt dán từ Word có thể ở dạng tổ hợp (NFD); chuẩn hóa để nhận đúng "Câu", "PHẦN".
  for (const raw of input.normalize('NFC').split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;

    const pm = line.match(PART_RE);
    if (pm) {
      const n = ROMAN[pm[1].toUpperCase()] ?? Number(pm[1]);
      part = { number: n, title: pm[2].trim(), type: PART_TYPES[n] ?? null, questions: [] };
      parts.push(part);
      q = null;
      continue;
    }

    const qm = line.match(QUESTION_RE);
    if (qm) {
      q = { source: Number(qm[1]), stem: qm[2], options: [], statements: [], answer: null };
      ensurePart().questions.push(q);
      continue;
    }
    if (!q) continue; // tiêu đề, thông tin trường... trước câu đầu tiên

    const am = line.match(ANSWER_RE);
    if (am) {
      q.answer = am[1].trim();
      continue;
    }
    const opts = splitOptions(line);
    if (opts) {
      q.options.push(...opts);
      continue;
    }
    const sm = line.match(STATEMENT_RE);
    if (sm && q.options.length === 0) {
      q.statements.push({ letter: sm[2], correct: sm[1] === '*', text: sm[3].trim() });
      continue;
    }
    // Dòng tiếp theo của nội dung câu hỏi hoặc của phương án/ý cuối cùng
    const last = q.statements.at(-1) ?? q.options.at(-1);
    if (last && !(q.options.length && q.statements.length)) last.text += '\n' + line.trim();
    else q.stem += (q.stem ? '\n' : '') + line.trim();
  }

  for (const p of parts) {
    p.type ??= inferType(p.questions);
    p.questions.forEach((question, i) => {
      question.type = p.type;
      errors.push(...validate(question, `Phần ${p.number}, câu ${question.source ?? i + 1}`));
    });
  }
  return { parts: parts.filter((p) => p.questions.length), errors };
}

function inferType(questions) {
  const q = questions[0];
  if (!q) return 'essay';
  if (q.options.length) return 'mcq';
  if (q.statements.length) return 'truefalse';
  if (q.answer) return 'short';
  return 'essay';
}

function validate(q, where) {
  const errs = [];
  if (q.type === 'mcq') {
    if (q.options.length < 2) errs.push(`${where}: cần ít nhất 2 phương án A, B...`);
    const n = q.options.filter((o) => o.correct).length;
    if (n === 0) errs.push(`${where}: chưa đánh dấu đáp án đúng (thêm * trước phương án)`);
    if (n > 1) errs.push(`${where}: có ${n} đáp án đúng, chỉ được 1`);
  }
  if (q.type === 'truefalse' && q.statements.length !== 4) errs.push(`${where}: câu đúng/sai cần đủ 4 ý a), b), c), d)`);
  if (q.type === 'short' && !q.answer) errs.push(`${where}: thiếu dòng "Đáp án: ..."`);
  return errs;
}
